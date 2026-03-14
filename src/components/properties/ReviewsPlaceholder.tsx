import { Star } from "@phosphor-icons/react";

export default function ReviewsPlaceholder() {
  return (
    <section>
      <div className="border-t border-[var(--border-subtle)] pt-12">
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)] mb-4">
          Guest reviews
        </h2>

        <div className="
          flex flex-col items-center justify-center gap-4 py-16
          rounded-[var(--radius-lg)] bg-[var(--surface)]
          border border-[var(--border-subtle)]
        ">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={20}
                weight="fill"
                className="text-[var(--border)]"
              />
            ))}
          </div>

          <p className="text-sm text-[var(--text-tertiary)] font-[family-name:var(--font-body)] text-center max-w-sm">
            Reviews coming soon. We are connecting to the Hospitable API to
            display verified guest feedback.
          </p>
        </div>
      </div>
    </section>
  );
}
