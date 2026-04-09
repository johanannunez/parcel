/**
 * BoldSign API client for creating and tracking e-sign documents.
 *
 * Requires BOLDSIGN_API_KEY env var. When not set, functions return
 * null so callers can show a "Coming soon" state.
 */

const BASE_URL = "https://api.boldsign.com/v1";

function getApiKey(): string | null {
  return process.env.BOLDSIGN_API_KEY ?? null;
}

function headers(): HeadersInit {
  const key = getApiKey();
  if (!key) throw new Error("BOLDSIGN_API_KEY is not set");
  return {
    "X-API-KEY": key,
    "Content-Type": "application/json",
  };
}

export type CreateDocumentResult = {
  documentId: string;
  signUrl: string;
} | null;

/**
 * Create a document from a BoldSign template and return the
 * embedded signing URL for the first signer.
 */
export async function createDocumentFromTemplate(opts: {
  templateId: string;
  signerEmail: string;
  signerName: string;
  redirectUrl?: string;
}): Promise<CreateDocumentResult> {
  if (!getApiKey()) return null;

  const res = await fetch(`${BASE_URL}/template/send`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      templateId: opts.templateId,
      roles: [
        {
          roleIndex: 1,
          signerEmail: opts.signerEmail,
          signerName: opts.signerName,
          signerType: "Signer",
        },
      ],
      disableEmails: true,
      enableEmbeddedSigning: true,
      ...(opts.redirectUrl ? { redirectUrl: opts.redirectUrl } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[BoldSign] createDocumentFromTemplate failed:", text);
    return null;
  }

  const data = (await res.json()) as { documentId: string };
  const documentId = data.documentId;

  // Get embedded sign URL
  const embedRes = await fetch(
    `${BASE_URL}/document/getEmbeddedSignLink?documentId=${documentId}&signerEmail=${encodeURIComponent(opts.signerEmail)}`,
    { headers: headers() },
  );

  if (!embedRes.ok) {
    console.error("[BoldSign] getEmbeddedSignLink failed:", await embedRes.text());
    return null;
  }

  const embedData = (await embedRes.json()) as { signLink: string };
  return { documentId, signUrl: embedData.signLink };
}

export type DocumentStatus = {
  documentId: string;
  status: string;
  signedAt: string | null;
} | null;

/**
 * Get the status of a BoldSign document.
 */
export async function getDocumentStatus(
  documentId: string,
): Promise<DocumentStatus> {
  if (!getApiKey()) return null;

  const res = await fetch(
    `${BASE_URL}/document/properties?documentId=${documentId}`,
    { headers: headers() },
  );

  if (!res.ok) return null;

  const data = (await res.json()) as {
    documentId: string;
    status: string;
    activityDate: string;
  };

  return {
    documentId: data.documentId,
    status: data.status,
    signedAt: data.status === "Completed" ? data.activityDate : null,
  };
}
