import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Lora } from "next/font/google";
import { SignupForm } from "./SignupForm";
import { AuthLeftPanel } from "@/components/auth/AuthLeftPanel";

const lora = Lora({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a Parcel owner account to manage your properties.",
};

export default function SignupPage() {
  return (
    <div className={`${lora.variable} auth-page-root auth-page-grid`}>
      <div className="auth-left-hide-mobile">
        <AuthLeftPanel />
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-card">
          {/* Branding — mobile only */}
          <div className="auth-mobile-branding">
            <Image
              src="/brand/logo-mark.png"
              alt="The Parcel Co."
              width={48}
              height={48}
              style={{
                width: "48px",
                height: "48px",
                objectFit: "contain",
                mixBlendMode: "multiply",
                marginBottom: "10px",
              }}
            />
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#1a1a1a",
                letterSpacing: "-0.01em",
                marginBottom: "14px",
              }}
            >
              The Parcel Co.
            </span>
            <div
              style={{
                width: "36px",
                height: "2px",
                background: "linear-gradient(90deg, rgba(27,119,190,0.2), var(--color-brand), rgba(27,119,190,0.2))",
                borderRadius: "1px",
              }}
            />
          </div>

          <h2
            style={{
              fontFamily: "var(--font-lora), Georgia, serif",
              fontSize: "32px",
              fontWeight: 700,
              color: "#1a1a1a",
              textAlign: "center",
              letterSpacing: "-0.02em",
              marginBottom: "8px",
            }}
          >
            Get started
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
            {"Let's start by creating your account."}
          </p>

          <SignupForm />

          <hr
            style={{
              border: "none",
              borderTop: "1px solid #f0f4f8",
              margin: "24px 0 0",
            }}
          />
          <p
            style={{
              textAlign: "center",
              marginTop: "16px",
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            Already have an account?{" "}
            <Link
              href="/login"
              style={{
                color: "var(--color-brand)",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
