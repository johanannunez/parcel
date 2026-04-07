import { NextRequest, NextResponse } from "next/server";

interface InquiryBody {
  name: string;
  email: string;
  phone?: string;
  address: string;
  message?: string;
}

export async function POST(req: NextRequest) {
  let body: InquiryBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, email, address } = body;

  if (!name?.trim() || !email?.trim() || !address?.trim()) {
    return NextResponse.json(
      { error: "Name, email, and property address are required." },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  // Log inquiry in development
  if (process.env.NODE_ENV === "development") {
    console.log("[Inquiry]", { name, email, phone: body.phone, address, message: body.message });
  }

  // Send via Resend when configured
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "inquiries@theparcelco.com",
          to: process.env.INQUIRY_TO_EMAIL ?? "hello@theparcelco.com",
          subject: `New Owner Inquiry from ${name}`,
          text: [
            `Name: ${name}`,
            `Email: ${email}`,
            body.phone ? `Phone: ${body.phone}` : null,
            `Property Address: ${address}`,
            body.message ? `\nMessage:\n${body.message}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
        }),
      });

      if (!res.ok) {
        console.error("[Inquiry] Resend error:", await res.text());
      }
    } catch (err) {
      console.error("[Inquiry] Failed to send email:", err);
    }
  }

  return NextResponse.json({ success: true });
}
