import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {eyebrow}
          </p>
        ) : null}
        <h1
          className="mt-2 text-[32px] font-semibold leading-tight tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          {title}
        </h1>
        {description ? (
          <p
            className="mt-2 max-w-2xl text-base"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </header>
  );
}
