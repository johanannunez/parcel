import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  FileText,
  Handshake,
  CurrencyDollar,
  SignOut,
} from "@phosphor-icons/react/dist/ssr";
import { StepShell } from "@/components/portal/setup/StepShell";

export const metadata: Metadata = { title: "Agreement Preview" };

const points = [
  {
    icon: <Handshake size={20} weight="duotone" />,
    title: "What The Parcel Company does",
    items: [
      "List your property on Airbnb, Vrbo, and direct booking channels",
      "Handle guest communication, check-in, and check-out",
      "Coordinate cleaning, maintenance, and restocking",
      "Manage pricing strategy to maximize your revenue",
      "Provide monthly financial reports through the owner portal",
    ],
  },
  {
    icon: <CheckCircle size={20} weight="duotone" />,
    title: "What you agree to",
    items: [
      "Keep the property guest-ready and well maintained",
      "Notify Parcel of any blocked dates at least 48 hours in advance",
      "Maintain homeowner insurance that covers short-term rentals",
      "Allow professional photography of the property",
      "Respond to urgent owner-only matters within 24 hours",
    ],
  },
  {
    icon: <CurrencyDollar size={20} weight="duotone" />,
    title: "Commission structure",
    items: [
      "Parcel earns a percentage of each booking, deducted before payout",
      "The exact rate is set in your signed agreement",
      "No hidden fees. Cleaning fees are passed through to guests",
      "Payouts arrive within 2 to 3 business days of guest checkout",
    ],
  },
  {
    icon: <SignOut size={20} weight="duotone" />,
    title: "How to end the agreement",
    items: [
      "Either party can terminate with 30 days written notice",
      "Existing reservations will be honored through checkout",
      "Your listing content and photos remain your property",
    ],
  },
];

export default function AgreementPreviewPage() {
  return (
    <StepShell
      track="property"
      stepNumber={1}
      title="Agreement preview"
      whyWeAsk="Before we get into the details, here is a plain-language summary of what the host agreement covers. No legal jargon."
      estimateMinutes={3}
    >
      <div className="flex flex-col gap-6">
        {points.map((section) => (
          <div
            key={section.title}
            className="rounded-2xl border p-6"
            style={{
              borderColor: "var(--color-warm-gray-200)",
              backgroundColor: "var(--color-white)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <span style={{ color: "var(--color-brand)" }}>
                {section.icon}
              </span>
              <h2
                className="text-base font-semibold tracking-tight"
                style={{ color: "var(--color-text-primary)" }}
              >
                {section.title}
              </h2>
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {section.items.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <span
                    className="mt-2 h-1 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: "var(--color-brand)" }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div
          className="sticky bottom-4 z-10 flex items-center justify-between gap-4 rounded-2xl border px-5 py-4"
          style={{
            borderColor: "var(--color-warm-gray-200)",
            backgroundColor: "var(--color-white)",
            boxShadow: "0 14px 40px -18px rgba(15, 40, 75, 0.28)",
          }}
        >
          <a
            href="/legal/host-rental-agreement-v3.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <FileText size={16} weight="duotone" />
            Read the full agreement
          </a>
          <Link
            href="/portal/setup/basics"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--color-brand)" }}
          >
            This looks good, keep going
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      </div>
    </StepShell>
  );
}
