import type { Metadata } from "next";
import { LockKey } from "@phosphor-icons/react/dist/ssr";
import { TreasuryVerifyForm } from "./TreasuryVerifyForm";

export const metadata: Metadata = {
  title: "Verify Access | Treasury",
};

interface TreasuryVerifyPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function TreasuryVerifyPage({
  searchParams,
}: TreasuryVerifyPageProps) {
  const { redirect: rawRedirect = "/admin/treasury" } = await searchParams;
  // Prevent open redirect: only allow internal treasury paths
  const redirectTo = rawRedirect.startsWith("/admin/treasury")
    ? rawRedirect
    : "/admin/treasury";

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        backgroundColor: "var(--color-warm-gray-50)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "var(--color-off-white)",
          borderRadius: "16px",
          border: "1.5px solid var(--color-warm-gray-200)",
          padding: "40px 36px",
          boxShadow:
            "0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -1px rgba(0,0,0,0.04)",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
        }}
      >
        {/* Icon + heading */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #02AAEB22, #1B77BE22)",
              border: "1.5px solid #02AAEB44",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <LockKey
              size={28}
              weight="duotone"
              color="#1B77BE"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--color-text-primary)",
                lineHeight: "1.2",
              }}
            >
              Treasury Access
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "var(--color-warm-gray-400)",
                lineHeight: "1.5",
              }}
            >
              Confirm your password to view financial data.
            </p>
          </div>
        </div>

        <TreasuryVerifyForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
