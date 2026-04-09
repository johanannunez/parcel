import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle,
  Circle,
  PencilSimple,
  Rocket,
} from "@phosphor-icons/react/dist/ssr";
import { StepShell } from "@/components/portal/setup/StepShell";
import { setupSearchIndex } from "@/lib/wizard/search-index";

export const metadata: Metadata = { title: "Review and Submit" };

// Summary sections for the review page
const sections = setupSearchIndex
  .filter((s) => s.track === "property")
  .map((s) => ({
    key: s.stepKey,
    label: s.label,
    href: s.href,
    // All are incomplete until migration + wiring
    complete: false,
  }));

export default function ReviewPage() {
  const completedCount = sections.filter((s) => s.complete).length;
  const allComplete = completedCount === sections.length;

  return (
    <StepShell
      track="property"
      stepNumber={14}
      title="Review and submit"
      whyWeAsk="One last look before we start preparing your listing. Make sure everything is accurate."
      estimateMinutes={3}
    >
      <div className="flex flex-col gap-6">
        {/* Section checklist */}
        <div
          className="rounded-2xl border p-6"
          style={{
            borderColor: "var(--color-warm-gray-200)",
            backgroundColor: "var(--color-white)",
          }}
        >
          <h2
            className="mb-4 text-base font-semibold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            Completion checklist
          </h2>
          <p
            className="mb-4 text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {completedCount} of {sections.length} sections complete
          </p>
          <ul className="flex flex-col gap-1">
            {sections.map((section) => (
              <li key={section.key}>
                <div className="flex items-center justify-between rounded-lg px-3 py-2">
                  <div className="flex items-center gap-3">
                    {section.complete ? (
                      <CheckCircle
                        size={18}
                        weight="fill"
                        style={{ color: "var(--color-success)" }}
                      />
                    ) : (
                      <Circle
                        size={18}
                        weight="regular"
                        style={{ color: "var(--color-warm-gray-400)" }}
                      />
                    )}
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: section.complete
                          ? "var(--color-text-primary)"
                          : "var(--color-text-secondary)",
                      }}
                    >
                      {section.label}
                    </span>
                  </div>
                  <Link
                    href={section.href}
                    className="flex items-center gap-1 text-xs font-medium transition-colors"
                    style={{ color: "var(--color-brand)" }}
                  >
                    <PencilSimple size={12} weight="bold" />
                    {section.complete ? "Edit" : "Complete"}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Submit button */}
        <div
          className="sticky bottom-4 z-10 flex items-center justify-between gap-4 rounded-2xl border px-5 py-4"
          style={{
            borderColor: "var(--color-warm-gray-200)",
            backgroundColor: "var(--color-white)",
            boxShadow: "0 14px 40px -18px rgba(15, 40, 75, 0.28)",
          }}
        >
          <p
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {allComplete
              ? "Everything looks good. Ready to submit!"
              : "Complete all sections before submitting."}
          </p>
          <button
            type="button"
            disabled={!allComplete}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ backgroundColor: "var(--color-brand)" }}
          >
            <Rocket size={16} weight="fill" />
            Submit for review
          </button>
        </div>
      </div>
    </StepShell>
  );
}
