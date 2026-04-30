import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Lora } from "next/font/google";
import { LoginForm } from "./LoginForm";
import { AuthLeftPanel } from "@/components/auth/AuthLeftPanel";

const lora = Lora({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your Parcel owner portal.",
};

type SearchParams = Promise<{ redirect?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { redirect } = await searchParams;

  return (
    <div className={`${lora.variable} auth-page-root auth-page-grid`}>
      <div className="auth-left-hide-mobile">
        <AuthLeftPanel />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "44px 0",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.05), 0 8px 28px rgba(0,0,0,0.09), 0 20px 60px rgba(27,119,190,0.07)",
            padding: "42px 38px 34px",
            width: "100%",
          }}
        >
            {/* Branding — visible on mobile only where the left panel is hidden */}
            <div className="auth-mobile-branding">
              <Image
                src="/brand/logo-mark.png"
                alt="The Parcel Co."
                width={40}
                height={40}
                style={{
                  width: "40px",
                  height: "40px",
                  objectFit: "contain",
                  mixBlendMode: "multiply",
                  marginBottom: "8px",
                }}
              />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#1a1a1a",
                  letterSpacing: "-0.01em",
                }}
              >
                The Parcel Co.
              </span>
            </div>

            <h2
              style={{
                fontFamily: "var(--font-lora), Georgia, serif",
                fontSize: "27px",
                fontWeight: 700,
                color: "#1a1a1a",
                textAlign: "center",
                letterSpacing: "-0.02em",
                marginBottom: "6px",
              }}
            >
              Welcome back
            </h2>
            <p
              style={{
                fontSize: "13.5px",
                color: "#6b7280",
                textAlign: "center",
                marginBottom: "28px",
                lineHeight: 1.5,
              }}
            >
              Log in to your Parcel owner portal.
            </p>

            <LoginForm redirectTo={redirect ?? "/portal/dashboard"} />

            <p
              style={{
                textAlign: "center",
                marginTop: "16px",
                fontSize: "13px",
                color: "#6b7280",
              }}
            >
              New to Parcel?{" "}
              <Link
                href="/signup"
                style={{
                  color: "var(--color-brand)",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Create an account
              </Link>
            </p>
        </div>
      </div>
    </div>
  );
}
