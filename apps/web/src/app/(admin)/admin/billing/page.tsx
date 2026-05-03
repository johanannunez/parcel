import type { Metadata } from "next";
import {
  FileText,
  Repeat,
  Receipt,
  Tag,
} from "@phosphor-icons/react/dist/ssr";
import styles from "./BillingPage.module.css";

export const metadata: Metadata = {
  title: "Billing | Admin",
};

const BILLING_AREAS = [
  {
    title: "Invoices",
    eyebrow: "Collect",
    detail: "One-time charges, payment status, and owner-facing records.",
    icon: FileText,
  },
  {
    title: "Recurring invoices",
    eyebrow: "Repeat",
    detail: "Monthly management fees, technology fees, and standing services.",
    icon: Repeat,
  },
  {
    title: "Proposals",
    eyebrow: "Offer",
    detail: "Premium owner proposals before an Entity becomes active.",
    icon: Receipt,
  },
  {
    title: "Catalog",
    eyebrow: "Price",
    detail: "Reusable services, fees, packages, margins, and tax rules.",
    icon: Tag,
  },
] as const;

export default function BillingPage() {
  return (
    <main className={styles.shell}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Billing</p>
          <h1 className={styles.title}>Revenue operations</h1>
          <p className={styles.subtitle}>
            Invoices, recurring revenue, proposals, and the Parcel service catalog.
          </p>
        </div>
        <div className={styles.summary}>
          <span className={styles.summaryLabel}>Next build focus</span>
          <strong>Recurring invoices</strong>
        </div>
      </section>

      <section className={styles.grid} aria-label="Billing areas">
        {BILLING_AREAS.map((area) => {
          const Icon = area.icon;
          return (
            <article key={area.title} className={styles.card}>
              <div className={styles.iconWrap}>
                <Icon size={22} weight="duotone" />
              </div>
              <div className={styles.cardText}>
                <span>{area.eyebrow}</span>
                <h2>{area.title}</h2>
                <p>{area.detail}</p>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
