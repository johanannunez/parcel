import { Bed } from "@phosphor-icons/react";

interface SleepingArrangementsProps {
  arrangements: { room: string; beds: string }[];
}

export default function SleepingArrangements({ arrangements }: SleepingArrangementsProps) {
  return (
    <section>
      <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)] mb-5">
        Sleeping arrangements
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {arrangements.map((arr) => (
          <div
            key={arr.room}
            className="
              flex flex-col items-center gap-3 p-5
              bg-[var(--surface)] border border-[var(--border-subtle)]
              rounded-[var(--radius-lg)] shadow-[var(--shadow-xs)]
              transition-shadow duration-200 hover:shadow-[var(--shadow-sm)]
            "
          >
            <Bed
              size={28}
              weight="duotone"
              className="text-[var(--brand-bright)]"
            />
            <div className="text-center">
              <p className="text-sm font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
                {arr.room}
              </p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)] font-[family-name:var(--font-body)]">
                {arr.beds}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
