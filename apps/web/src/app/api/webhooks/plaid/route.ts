// Plaid webhook handler
// Verifies the Plaid-Verification JWT, dispatches sync or status updates,
// and returns 200 immediately. Heavy work runs after the response.
// SERVER-SIDE ONLY — no user session is available in a webhook context.

import { NextResponse, type NextRequest } from "next/server";
import * as crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { runTreasurySync } from "@/lib/treasury/sync";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Plaid webhook verification
// ---------------------------------------------------------------------------

/**
 * Extracts the `kid` (key ID) from the JWT header without verifying the
 * signature. We use this to look up the correct public key from Plaid before
 * doing full verification.
 */
function extractKidFromJwt(token: string): string | null {
  try {
    const [headerB64] = token.split(".");
    if (!headerB64) return null;
    const header = JSON.parse(
      Buffer.from(headerB64, "base64url").toString("utf8"),
    );
    return typeof header.kid === "string" ? header.kid : null;
  } catch {
    return null;
  }
}

/**
 * Fetches the Plaid webhook verification public key for the given `kid`.
 * https://plaid.com/docs/api/webhooks/webhook-verification/
 */
async function fetchPlaidPublicKey(kid: string): Promise<crypto.KeyObject> {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SB_SECRET;

  if (!clientId || !secret) {
    throw new Error("PLAID_CLIENT_ID or PLAID_SB_SECRET is not configured");
  }

  const env = process.env.PLAID_ENV ?? "sandbox";
  const baseUrl =
    env === "production"
      ? "https://production.plaid.com"
      : env === "development"
        ? "https://development.plaid.com"
        : "https://sandbox.plaid.com";

  const response = await fetch(
    `${baseUrl}/webhook_verification_key/get`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, secret, key_id: kid }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Plaid key fetch failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as {
    key: {
      alg: string;
      crv: string;
      kid: string;
      kty: string;
      use: string;
      x: string;
      y: string;
    };
    request_id: string;
  };

  // Convert the JWK to a Node.js KeyObject
  return crypto.createPublicKey({ key: data.key, format: "jwk" });
}

/**
 * Verifies the Plaid webhook JWT signature against the fetched public key.
 * Returns true if valid, false otherwise.
 *
 * Plaid signs using ES256 (ECDSA P-256 SHA-256). The JWT body contains a
 * `request_body_sha256` claim that must match the SHA-256 hash of the raw
 * request body.
 */
function verifyPlaidJwt(
  token: string,
  publicKey: crypto.KeyObject,
  rawBody: Buffer,
): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const [headerB64, payloadB64, signatureB64] = parts;

    // Verify the signature over `header.payload`
    const signingInput = `${headerB64}.${payloadB64}`;
    const signature = Buffer.from(signatureB64, "base64url");

    const valid = crypto.verify(
      "sha256",
      Buffer.from(signingInput),
      { key: publicKey, dsaEncoding: "ieee-p1363" },
      signature,
    );

    if (!valid) return false;

    // Verify the body hash claim
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    );
    const expectedHash = crypto
      .createHash("sha256")
      .update(rawBody)
      .digest("hex");

    return payload.request_body_sha256 === expectedHash;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Webhook event handlers
// ---------------------------------------------------------------------------

/**
 * Trigger a full treasury sync for the connection linked to a Plaid item ID.
 * We do not narrow to a single item because runTreasurySync() handles cursors
 * incrementally — it is safe and correct to run the full cycle.
 */
async function handleTransactionSync(itemId: string): Promise<void> {
  console.log(`[Plaid webhook] Triggering sync for item: ${itemId}`);
  try {
    const result = await runTreasurySync();
    console.log(
      `[Plaid webhook] Sync complete — added: ${result.transactions_added}, errors: ${result.errors.length}`,
    );
  } catch (err) {
    console.error("[Plaid webhook] Sync failed:", err);
  }
}

/** Mark the connection for the given item as stale when Plaid reports an error. */
async function handleItemError(itemId: string): Promise<void> {
  console.log(`[Plaid webhook] ITEM/ERROR for item: ${itemId}`);
  const svc = createServiceClient();
  const { error } = await svc
    .from("treasury_connections")
    .update({ status: "stale" })
    .eq("plaid_item_id", itemId);

  if (error) {
    console.error(
      `[Plaid webhook] Failed to mark connection stale for item ${itemId}:`,
      error.message,
    );
  }
}

/**
 * Create a warning alert when Plaid notifies that a connection is about to
 * expire and requires re-authentication.
 */
async function handlePendingExpiration(itemId: string): Promise<void> {
  console.log(`[Plaid webhook] ITEM/PENDING_EXPIRATION for item: ${itemId}`);
  const svc = createServiceClient();

  const { error } = await svc.from("treasury_alerts").insert({
    type: "connection_expiring",
    severity: "warning",
    title: "Bank connection expiring soon",
    message: `The Plaid connection for item ${itemId} will expire soon. Please re-authenticate to keep transactions syncing.`,
    metadata: { plaid_item_id: itemId, webhook_code: "PENDING_EXPIRATION" },
  });

  if (error) {
    console.error(
      `[Plaid webhook] Failed to create expiration alert for item ${itemId}:`,
      error.message,
    );
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Read the raw body — must happen before any .json() call
  const rawBody = Buffer.from(await request.arrayBuffer());

  // 2. Verify the Plaid-Verification JWT signature
  const verificationToken = request.headers.get("Plaid-Verification");
  const isSandbox = (process.env.PLAID_ENV ?? "sandbox") === "sandbox";

  if (!verificationToken) {
    // Plaid always sends this header in production. A missing header means
    // the request did not originate from Plaid (or is a direct test call).
    if (!isSandbox) {
      console.error("[Plaid webhook] Missing Plaid-Verification header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.warn(
      "[Plaid webhook] Sandbox mode: skipping signature verification (no token present)",
    );
  } else {
    const kid = extractKidFromJwt(verificationToken);

    if (!kid) {
      console.error("[Plaid webhook] Could not extract kid from JWT header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isSandbox) {
      // In sandbox, attempt verification. Key fetch errors are common (return 500).
      // Invalid signatures always reject, even in sandbox.
      try {
        const publicKey = await fetchPlaidPublicKey(kid);
        const valid = verifyPlaidJwt(verificationToken, publicKey, rawBody);
        if (!valid) {
          console.error("[Plaid webhook] Sandbox: signature verification failed");
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
      } catch (err) {
        console.error(
          "[Plaid webhook] Sandbox: key fetch error (Plaid-side issue):",
          err instanceof Error ? err.message : String(err),
        );
        return NextResponse.json(
          { error: "Webhook verification key fetch failed" },
          { status: 500 },
        );
      }
    } else {
      // Production: hard-fail on any verification error
      try {
        const publicKey = await fetchPlaidPublicKey(kid);
        const valid = verifyPlaidJwt(verificationToken, publicKey, rawBody);
        if (!valid) {
          console.error("[Plaid webhook] Signature verification failed");
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
      } catch (err) {
        console.error(
          "[Plaid webhook] Public key fetch or verification error:",
          err instanceof Error ? err.message : String(err),
        );
        return NextResponse.json(
          { error: "Signature verification failed" },
          { status: 401 },
        );
      }
    }
  }

  // 3. Parse the body
  let body: { webhook_type: string; webhook_code: string; item_id: string };
  try {
    body = JSON.parse(rawBody.toString("utf8"));
  } catch {
    console.error("[Plaid webhook] Failed to parse request body");
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const { webhook_type, webhook_code, item_id } = body;
  console.log(
    `[Plaid webhook] Received ${webhook_type}/${webhook_code} for item: ${item_id}`,
  );

  // 4. Respond 200 immediately, then do the heavy work via waitUntil
  const work = (async () => {
    try {
      if (webhook_type === "TRANSACTIONS") {
        if (
          webhook_code === "SYNC_UPDATES_AVAILABLE" ||
          webhook_code === "DEFAULT_UPDATE"
        ) {
          await handleTransactionSync(item_id);
          return;
        }
      }

      if (webhook_type === "ITEM") {
        if (webhook_code === "ERROR") {
          await handleItemError(item_id);
          return;
        }
        if (webhook_code === "PENDING_EXPIRATION") {
          await handlePendingExpiration(item_id);
          return;
        }
      }

      console.log(
        `[Plaid webhook] Unhandled event type: ${webhook_type}/${webhook_code}`,
      );
    } catch (err) {
      console.error("[Plaid webhook] Error processing event:", err);
    }
  })();

  // Next.js 16 after() keeps the function alive until the promise settles.
  // Falls back to fire-and-forget if not available (local dev).
  try {
    const { after } = await import("next/server");
    after(() => work);
  } catch {
    work.catch(() => undefined);
  }

  return NextResponse.json({ received: true });
}
