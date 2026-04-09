import { NextResponse } from "next/server";

/**
 * BoldSign webhook handler (stub).
 *
 * BoldSign sends POST requests when a document is:
 * - Sent
 * - Viewed
 * - Signed
 * - Completed
 * - Declined
 * - Expired
 *
 * Once the signed_documents table exists, this handler will:
 * 1. Verify the webhook signature
 * 2. Parse the event payload
 * 3. Update the signed_documents row (status, signed_at, signed_pdf_url)
 * 4. Return 200
 *
 * Until then, acknowledge all requests with 200 so BoldSign
 * does not retry or flag the endpoint as unhealthy.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[BoldSign webhook] Received event:", body?.event?.eventType ?? "unknown");

    // TODO: Process the event once PENDING migration runs
    // - Verify X-BoldSign-Signature header
    // - Match body.event.document.documentId to signed_documents.boldsign_document_id
    // - Update status + signed_at + signed_pdf_url

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: true });
  }
}
