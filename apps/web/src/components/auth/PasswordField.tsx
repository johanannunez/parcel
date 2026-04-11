"use client";

import { useState } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";

type PasswordFieldProps = {
  id: string;
  name: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
};

export function PasswordField({
  id,
  name,
  autoComplete,
  required,
  minLength,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className="w-full rounded-lg border border-[var(--color-warm-gray-200)] bg-[var(--color-white)] px-4 py-3 pr-12 text-base outline-none transition-colors focus:border-[var(--color-brand)]"
        style={{ color: "var(--color-text-primary)" }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex items-center justify-center rounded-r-lg px-3 transition-colors hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-0"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {visible ? (
          <EyeSlash size={18} weight="regular" />
        ) : (
          <Eye size={18} weight="regular" />
        )}
      </button>
    </div>
  );
}
