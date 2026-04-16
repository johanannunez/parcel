// POST /api/treasury/exchange-token
// Exchanges a Plaid public token for an access token, stores the
// encrypted connection and its accounts in Supabase.
// Admin + treasury-verified only.

import { NextRequest, NextResponse } from "next/server";
import { treasuryAdminGuard } from "@/lib/treasury/admin-guard";
import { getPlaidClient } from "@/lib/treasury/plaid";
import { encrypt } from "@/lib/treasury/encryption";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const guard = await treasuryAdminGuard();
  if (!guard.ok) return guard.response;

  const { user } = guard;

  let body: {
    public_token: string;
    institution_name?: string;
    institution_id?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { public_token, institution_name, institution_id } = body;

  if (!public_token) {
    return NextResponse.json({ error: "public_token is required" }, { status: 400 });
  }

  try {
    const plaid = getPlaidClient();
    const service = createServiceClient();

    // Exchange public token for access token
    const exchangeResponse = await plaid.itemPublicTokenExchange({ public_token });
    const { access_token, item_id } = exchangeResponse.data;

    // Encrypt access token before storing (Base64 for consistent encoding)
    const encryptedToken = encrypt(access_token).toString("base64");

    // Store connection in treasury_connections.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: connection, error: connectionError } = await (service as any)
      .from("treasury_connections")
      .insert({
        plaid_item_id: item_id,
        access_token_encrypted: encryptedToken,
        institution_name: institution_name ?? null,
        institution_id: institution_id ?? null,
        status: "active",
      })
      .select("id")
      .single() as { data: { id: string } | null; error: { message: string } | null };

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: "Failed to store connection", detail: connectionError?.message },
        { status: 500 },
      );
    }

    // Fetch accounts for this item
    const accountsResponse = await plaid.accountsGet({ access_token });
    const plaidAccounts = accountsResponse.data.accounts;

    // Map Plaid account types to our categories
    function mapAccountType(plaidType: string, plaidSubtype: string | null | undefined): string {
      switch (plaidType) {
        case "depository":
          return plaidSubtype === "savings" ? "savings" : "checking";
        case "credit":
          return "credit_card";
        case "investment":
          return "investment";
        case "loan":
          return "loan";
        default:
          return "checking";
      }
    }

    // Map and insert accounts
    const accountRows = plaidAccounts.map((acct) => ({
      connection_id: connection.id,
      plaid_account_id: acct.account_id,
      name: acct.name,
      official_name: acct.official_name ?? null,
      type: mapAccountType(acct.type, acct.subtype),
      mask: acct.mask ?? null,
      current_balance: acct.balances.current ?? null,
      available_balance: acct.balances.available ?? null,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: accountsError } = await (service as any)
      .from("treasury_accounts")
      .insert(accountRows) as { error: { message: string } | null };

    if (accountsError) {
      return NextResponse.json(
        { error: "Failed to store accounts", detail: accountsError.message },
        { status: 500 },
      );
    }

    // Audit log: plaid_link_complete
    await service.from("activity_log").insert({
      actor_id: user.id,
      action: "plaid_link_complete",
      entity_type: "treasury_connection",
      entity_id: connection.id,
      metadata: {
        institution_name: institution_name ?? null,
        accounts_added: plaidAccounts.length,
      },
    });

    return NextResponse.json({
      ok: true,
      connection_id: connection.id,
      accounts_added: plaidAccounts.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Token exchange failed", detail: message },
      { status: 500 },
    );
  }
}
