"use server";

import { createClient } from "@/lib/supabase/server";

const AI_SYSTEM_PROMPT = `You analyze documents and images for a property management company. Classify the document and provide a brief, useful summary.

Document types you might see:
- Receipt (purchase, repair, cleaning supply, maintenance)
- Invoice (contractor, vendor, utility)
- Insurance document (policy, claim, certificate)
- Legal document (lease, agreement, contract, notice)
- Maintenance photo (damage, repair needed, before/after)
- Property photo (interior, exterior, amenity)
- Tax document (W-9, 1099, tax return)
- ID document (driver's license, passport)
- Other

Respond in JSON:
{
  "documentType": "receipt",
  "summary": "Home Depot receipt for $127.43. Items: smoke detectors (3), carbon monoxide detector (1), 9V batteries (6). Dated March 15, 2026.",
  "keyDetails": {
    "vendor": "Home Depot",
    "amount": "$127.43",
    "date": "March 15, 2026"
  }
}

Keep the summary under 2 sentences. Extract specific amounts, dates, names, and addresses when visible. For photos, describe what you see and any maintenance issues.`;

type UploadResult = {
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  aiSummary: string | null;
  documentType: string | null;
  keyDetails: Record<string, string> | null;
  error?: string;
};

export async function uploadMessageAttachment(formData: FormData): Promise<UploadResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      url: "",
      fileName: "",
      fileType: "",
      fileSize: 0,
      aiSummary: null,
      documentType: null,
      keyDetails: null,
      error: "Not authenticated",
    };
  }

  const file = formData.get("file") as File | null;
  const conversationId = formData.get("conversationId") as string | null;

  if (!file || !conversationId) {
    return {
      url: "",
      fileName: "",
      fileType: "",
      fileSize: 0,
      aiSummary: null,
      documentType: null,
      keyDetails: null,
      error: "Missing file or conversation ID",
    };
  }

  // Validate file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    return {
      url: "",
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      aiSummary: null,
      documentType: null,
      keyDetails: null,
      error: "File exceeds 10MB limit",
    };
  }

  // Validate file type
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "application/pdf",
  ];
  if (!allowedTypes.includes(file.type)) {
    return {
      url: "",
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      aiSummary: null,
      documentType: null,
      keyDetails: null,
      error: "File type not supported. Use JPEG, PNG, WebP, HEIC, or PDF.",
    };
  }

  // Upload to Supabase Storage
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${user.id}/${conversationId}/${timestamp}-${sanitizedName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("message-attachments")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return {
      url: "",
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      aiSummary: null,
      documentType: null,
      keyDetails: null,
      error: uploadError.message,
    };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("message-attachments")
    .getPublicUrl(storagePath);

  const publicUrl = urlData.publicUrl;

  // AI analysis
  let aiSummary: string | null = null;
  let documentType: string | null = null;
  let keyDetails: Record<string, string> | null = null;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const aiResult = await analyzeWithAI(apiKey, buffer, file.type, file.name);
      if (aiResult) {
        aiSummary = aiResult.summary;
        documentType = aiResult.documentType;
        keyDetails = aiResult.keyDetails;
      }
    } catch (err) {
      // AI analysis is best-effort; don't block upload
      console.error("[upload] AI analysis failed:", err);
    }
  }

  return {
    url: publicUrl,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    aiSummary,
    documentType,
    keyDetails,
  };
}

async function analyzeWithAI(
  apiKey: string,
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<{ summary: string; documentType: string; keyDetails: Record<string, string> } | null> {
  const isImage = mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf";

  // Build content for the API call
  const content: Array<Record<string, unknown>> = [];

  if (isImage) {
    const base64 = buffer.toString("base64");
    // Map HEIC to jpeg for the API (it doesn't support HEIC natively)
    const mediaType = mimeType === "image/heic" ? "image/jpeg" : mimeType;
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: mediaType,
        data: base64,
      },
    });
    content.push({
      type: "text",
      text: `Analyze this image (filename: ${fileName}). Respond with JSON only.`,
    });
  } else if (isPdf) {
    const base64 = buffer.toString("base64");
    content.push({
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: base64,
      },
    });
    content.push({
      type: "text",
      text: `Analyze this PDF document (filename: ${fileName}). Respond with JSON only.`,
    });
  } else {
    return null;
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: AI_SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    }),
  });

  if (!response.ok) {
    console.error("[upload] AI API error:", response.status, await response.text());
    return null;
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text;
  if (!text) return null;

  // Parse JSON from the response (handle markdown code blocks)
  const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try {
    const parsed = JSON.parse(jsonStr);
    return {
      summary: parsed.summary ?? "",
      documentType: parsed.documentType ?? "Other",
      keyDetails: parsed.keyDetails ?? null,
    };
  } catch {
    // If it can't parse, use the raw text as summary
    return {
      summary: text.slice(0, 200),
      documentType: "Other",
      keyDetails: {} as Record<string, string>,
    };
  }
}
