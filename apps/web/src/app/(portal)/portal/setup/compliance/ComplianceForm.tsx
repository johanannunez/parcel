"use client";

import { useState, useId } from "react";
import { UploadSimple } from "@phosphor-icons/react";
import { StepSaveBar } from "@/components/portal/setup/StepShell";

export function ComplianceForm() {
  const [needsPermit, setNeedsPermit] = useState<"yes" | "no" | "unsure" | "">("");
  const [hasHoa, setHasHoa] = useState<"yes" | "no" | "">("");

  return (
    <form action="/portal/setup" method="get" className="flex flex-col gap-8">
      <input type="hidden" name="just" value="compliance" />

      <Section title="STR permit">
        <fieldset className="mb-3">
          <legend className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--color-text-tertiary)" }}>
            Does your city require an STR permit?
          </legend>
          <div className="flex gap-3">
            {(["yes", "no", "unsure"] as const).map((opt) => (
              <label key={opt} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer hover:bg-[var(--color-warm-gray-50)]"
                style={{ borderColor: "var(--color-warm-gray-200)", color: "var(--color-text-primary)" }}>
                <input type="radio" name="needs_permit" value={opt} checked={needsPermit === opt}
                  onChange={() => setNeedsPermit(opt)} className="accent-[var(--color-brand)]" />
                {opt === "unsure" ? "Not sure" : opt === "yes" ? "Yes" : "No"}
              </label>
            ))}
          </div>
        </fieldset>
        {needsPermit === "yes" && (
          <TextInput name="permit_number" label="STR permit number" placeholder="e.g. STR-2024-001234" />
        )}
      </Section>

      <Section title="HOA">
        <fieldset className="mb-3">
          <legend className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--color-text-tertiary)" }}>
            Is there an HOA?
          </legend>
          <div className="flex gap-3">
            {(["yes", "no"] as const).map((opt) => (
              <label key={opt} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer hover:bg-[var(--color-warm-gray-50)]"
                style={{ borderColor: "var(--color-warm-gray-200)", color: "var(--color-text-primary)" }}>
                <input type="radio" name="has_hoa" value={opt} checked={hasHoa === opt}
                  onChange={() => setHasHoa(opt)} className="accent-[var(--color-brand)]" />
                {opt === "yes" ? "Yes" : "No"}
              </label>
            ))}
          </div>
        </fieldset>
        {hasHoa === "yes" && (
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Please confirm that your HOA allows short-term rentals. We may ask for written approval later.
          </p>
        )}
      </Section>

      <Section title="Insurance certificate">
        <p className="mb-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Upload your homeowner insurance certificate that covers short-term rental activity. If you do not have one, we can help you get added to ours.
        </p>
        <label
          className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors hover:bg-[var(--color-warm-gray-50)]"
          style={{ borderColor: "var(--color-warm-gray-200)" }}
        >
          <UploadSimple size={24} weight="duotone" style={{ color: "var(--color-text-tertiary)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Upload certificate</span>
          <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>PDF, JPG, or PNG</span>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" name="insurance_cert" />
        </label>
      </Section>

      <StepSaveBar pending={false} />
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border p-6" style={{ borderColor: "var(--color-warm-gray-200)", backgroundColor: "var(--color-white)" }}>
      <h2 className="mb-4 text-base font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>{title}</h2>
      {children}
    </section>
  );
}

function TextInput({ name, label, placeholder }: { name: string; label: string; placeholder?: string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--color-text-tertiary)" }}>{label}</label>
      <input id={id} name={name} placeholder={placeholder}
        className="rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
        style={{ borderColor: "var(--color-warm-gray-200)", backgroundColor: "var(--color-white)", color: "var(--color-text-primary)" }}
      />
    </div>
  );
}
