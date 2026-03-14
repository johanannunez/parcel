import { ProhibitInset } from "@phosphor-icons/react";

interface HouseRulesProps {
  rules: string[];
}

export default function HouseRules({ rules }: HouseRulesProps) {
  return (
    <section>
      <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)] mb-5">
        House rules
      </h2>

      <ul className="space-y-3">
        {rules.map((rule) => (
          <li
            key={rule}
            className="flex items-start gap-3 text-sm text-[var(--text-secondary)] font-[family-name:var(--font-body)] leading-relaxed"
          >
            <ProhibitInset
              size={18}
              weight="duotone"
              className="text-[var(--text-tertiary)] shrink-0 mt-0.5"
            />
            {rule}
          </li>
        ))}
      </ul>
    </section>
  );
}
