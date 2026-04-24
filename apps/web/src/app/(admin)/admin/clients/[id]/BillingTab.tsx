import {
  CurrencyDollar,
  CalendarBlank,
  CreditCard,
  Bank,
  Warning,
  ArrowSquareOut,
  Buildings,
} from "@phosphor-icons/react/dist/ssr";
import type { ClientBilling } from "@/lib/admin/client-billing";
import styles from "./BillingTab.module.css";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  open: "Open",
  paid: "Paid",
  uncollectible: "Uncollectible",
  void: "Void",
};
const STATUS_CLASS: Record<string, string> = {
  draft: styles.pillDraft,
  open: styles.pillOpen,
  paid: styles.pillPaid,
  uncollectible: styles.pillUncollectible,
  void: styles.pillVoid,
};
const KIND_LABEL: Record<string, string> = {
  onboarding_fee: "Onboarding",
  tech_fee: "Tech fee",
  adhoc: "Ad hoc",
};

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function computeEffectiveRate(
  feePercent: number,
  propertyCount: number,
): { effectiveRate: number; discountApplied: boolean; discountPercent: number } {
  const discountApplied = propertyCount >= 3;
  const discountPercent = discountApplied ? 10 : 0;
  const effectiveRate = feePercent * (1 - discountPercent / 100);
  return { effectiveRate, discountApplied, discountPercent };
}

export function BillingTab({ billing }: { billing: ClientBilling }) {
  const { totalCollectedCents, nextInvoice, invoices, managementFeePercent, propertyCount, paymentMethod } = billing;

  return (
    <div className={styles.root}>
      {/* Summary bar */}
      <div className={styles.summaryBar}>
        <div className={styles.summaryItem}>
          <CurrencyDollar size={18} weight="duotone" className={styles.summaryIcon} />
          <div>
            <div className={styles.summaryValue}>{formatCents(totalCollectedCents)}</div>
            <div className={styles.summaryLabel}>Total collected (lifetime)</div>
          </div>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <CalendarBlank size={18} weight="duotone" className={styles.summaryIcon} />
          <div>
            <div className={styles.summaryValue}>
              {nextInvoice ? formatDate(nextInvoice.dueAt) : "No upcoming invoice"}
            </div>
            <div className={styles.summaryLabel}>
              {nextInvoice ? `${formatCents(nextInvoice.amountCents)} due` : "Next invoice date"}
            </div>
          </div>
        </div>
      </div>

      {/* Fee structure */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          <Buildings size={16} weight="duotone" className={styles.cardTitleIcon} />
          Fee structure
        </h3>
        {managementFeePercent == null ? (
          <p className={styles.noFee}>No management fee rate set. Edit the client to add one.</p>
        ) : (() => {
          const { effectiveRate, discountApplied, discountPercent } = computeEffectiveRate(managementFeePercent, propertyCount);
          return (
            <div className={styles.feeRows}>
              <div className={styles.feeRow}>
                <span className={styles.feeLabel}>Base rate</span>
                <span className={styles.feeValue}>{managementFeePercent}%</span>
              </div>
              {discountApplied && (
                <div className={styles.feeRow}>
                  <span className={styles.feeLabel}>
                    Multi-property discount ({propertyCount} properties)
                  </span>
                  <span className={styles.feeDiscount}>-{discountPercent}%</span>
                </div>
              )}
              <div className={`${styles.feeRow} ${styles.feeTotal}`}>
                <span className={styles.feeLabel}>Effective blended rate</span>
                <span className={styles.feeValue}>{effectiveRate.toFixed(2)}%</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Invoice history */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          <CurrencyDollar size={16} weight="duotone" className={styles.cardTitleIcon} />
          Invoice history
        </h3>
        {invoices.length === 0 ? (
          <p className={styles.emptyText}>No invoices yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Type</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>{KIND_LABEL[inv.kind] ?? inv.kind}</td>
                  <td>
                    <span className={`${styles.pill} ${STATUS_CLASS[inv.status] ?? ""}`}>
                      {STATUS_LABEL[inv.status] ?? inv.status}
                    </span>
                  </td>
                  <td>{formatCents(inv.amount_cents)}</td>
                  <td>{inv.paid_at ? formatDate(inv.paid_at) : inv.due_at ? formatDate(inv.due_at) : "—"}</td>
                  <td>
                    {inv.hosted_invoice_url ? (
                      <a
                        href={inv.hosted_invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.invoiceLink}
                        aria-label="Open invoice"
                      >
                        <ArrowSquareOut size={14} />
                      </a>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payment method */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          <CreditCard size={16} weight="duotone" className={styles.cardTitleIcon} />
          Payment method
        </h3>
        {!paymentMethod ? (
          <p className={styles.emptyText}>No payment method on file.</p>
        ) : paymentMethod.type === "card" ? (
          <div className={styles.paymentRow}>
            <CreditCard size={18} weight="duotone" className={styles.paymentIcon} />
            <div>
              <div className={styles.paymentMain}>
                {paymentMethod.brand
                  ? paymentMethod.brand.charAt(0).toUpperCase() + paymentMethod.brand.slice(1)
                  : "Card"}{" "}
                ending {paymentMethod.last4}
              </div>
              <div className={`${styles.paymentSub} ${paymentMethod.isExpiringSoon ? styles.paymentExpiring : ""}`}>
                {paymentMethod.isExpiringSoon && <Warning size={13} weight="fill" />}
                Expires {paymentMethod.expMonth}/{paymentMethod.expYear}
                {paymentMethod.isExpiringSoon ? " (expiring soon)" : ""}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.paymentRow}>
            <Bank size={18} weight="duotone" className={styles.paymentIcon} />
            <div>
              <div className={styles.paymentMain}>
                {paymentMethod.brand ?? "Bank account"} ending {paymentMethod.last4}
              </div>
              <div className={styles.paymentSub}>ACH / bank transfer</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
