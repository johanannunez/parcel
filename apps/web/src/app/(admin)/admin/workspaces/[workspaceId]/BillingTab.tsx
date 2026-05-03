import {
  CurrencyDollar,
  CalendarBlank,
  CreditCard,
  Bank,
  Warning,
  ArrowSquareOut,
  Buildings,
  Repeat,
} from "@phosphor-icons/react/dist/ssr";
import type { WorkspaceBilling } from "@/lib/admin/workspace-billing";
import styles from "./BillingTab.module.css";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  review_ready: "Review ready",
  approved: "Approved",
  open: "Open",
  paid: "Paid",
  payment_failed: "Payment failed",
  uncollectible: "Uncollectible",
  refunded: "Refunded",
  partially_refunded: "Partially refunded",
  void: "Void",
  active: "Active",
  paused: "Paused",
  ended: "Ended",
  canceled: "Canceled",
};

const STATUS_CLASS: Record<string, string> = {
  draft: styles.pillDraft,
  review_ready: styles.pillOpen,
  approved: styles.pillOpen,
  open: styles.pillOpen,
  paid: styles.pillPaid,
  payment_failed: styles.pillFailed,
  uncollectible: styles.pillUncollectible,
  refunded: styles.pillVoid,
  partially_refunded: styles.pillVoid,
  void: styles.pillVoid,
  active: styles.pillPaid,
  paused: styles.pillDraft,
  ended: styles.pillVoid,
  canceled: styles.pillVoid,
};

const KIND_LABEL: Record<string, string> = {
  onboarding_fee: "Onboarding",
  tech_fee: "Tech fee",
  adhoc: "Ad hoc",
  recurring: "Recurring",
};

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

function scheduleIntervalLabel(interval: string, intervalCount: number): string {
  if (intervalCount === 1) return `Every ${interval}`;
  return `Every ${intervalCount} ${interval}s`;
}

export function BillingTab({ billing }: { billing: WorkspaceBilling }) {
  const {
    totalCollectedCents,
    nextInvoice,
    invoices,
    schedules,
    managementFeePercent,
    propertyCount,
    paymentMethod,
    availableCreditCents,
    stripeCustomerId,
  } = billing;

  return (
    <div className={styles.root}>
      <div className={styles.summaryBar}>
        <div className={styles.summaryItem}>
          <CurrencyDollar size={18} weight="duotone" className={styles.summaryIcon} />
          <div>
            <div className={styles.summaryValue}>{formatCents(totalCollectedCents)}</div>
            <div className={styles.summaryLabel}>Total collected</div>
          </div>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <Repeat size={18} weight="duotone" className={styles.summaryIcon} />
          <div>
            <div className={styles.summaryValue}>{schedules.length}</div>
            <div className={styles.summaryLabel}>
              Recurring schedule{schedules.length === 1 ? "" : "s"}
            </div>
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

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          <Repeat size={16} weight="duotone" className={styles.cardTitleIcon} />
          Recurring schedules
        </h3>
        {schedules.length === 0 ? (
          <p className={styles.emptyText}>No recurring schedules yet.</p>
        ) : (
          <div className={styles.scheduleList}>
            {schedules.map((schedule) => (
              <div key={schedule.id} className={styles.scheduleRow}>
                <div>
                  <div className={styles.scheduleName}>{schedule.name}</div>
                  <div className={styles.scheduleMeta}>
                    {schedule.lineCount} line item{schedule.lineCount === 1 ? "" : "s"}.{" "}
                    {scheduleIntervalLabel(schedule.interval, schedule.intervalCount)}
                  </div>
                </div>
                <div className={styles.scheduleRight}>
                  <span className={`${styles.pill} ${STATUS_CLASS[schedule.status] ?? styles.pillDraft}`}>
                    {STATUS_LABEL[schedule.status] ?? schedule.status}
                  </span>
                  <span className={styles.scheduleDate}>
                    {schedule.nextInvoiceDate ? formatDate(schedule.nextInvoiceDate) : "No next date"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          <Buildings size={16} weight="duotone" className={styles.cardTitleIcon} />
          Fee structure
        </h3>
        {managementFeePercent == null ? (
          <p className={styles.noFee}>No management fee rate set. Edit the workspace to add one.</p>
        ) : (() => {
          const { effectiveRate, discountApplied, discountPercent } = computeEffectiveRate(
            managementFeePercent,
            propertyCount,
          );
          return (
            <div className={styles.feeRows}>
              <div className={styles.feeRow}>
                <span className={styles.feeLabel}>Base rate</span>
                <span className={styles.feeValue}>{managementFeePercent}%</span>
              </div>
              {discountApplied ? (
                <div className={styles.feeRow}>
                  <span className={styles.feeLabel}>
                    Multi-property discount ({propertyCount} properties)
                  </span>
                  <span className={styles.feeDiscount}>-{discountPercent}%</span>
                </div>
              ) : null}
              <div className={`${styles.feeRow} ${styles.feeTotal}`}>
                <span className={styles.feeLabel}>Effective blended rate</span>
                <span className={styles.feeValue}>{effectiveRate.toFixed(2)}%</span>
              </div>
            </div>
          );
        })()}
        {availableCreditCents > 0 ? (
          <div className={styles.creditNote}>
            {formatCents(availableCreditCents)} available credit
          </div>
        ) : null}
      </div>

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
                  <td>
                    {inv.paid_at
                      ? formatDate(inv.paid_at)
                      : inv.due_at
                        ? formatDate(inv.due_at)
                        : "No date"}
                  </td>
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

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          <CreditCard size={16} weight="duotone" className={styles.cardTitleIcon} />
          Payment method
        </h3>
        {!paymentMethod ? (
          <p className={styles.emptyText}>
            No payment method on file{stripeCustomerId ? "." : ", and no Stripe customer has been created yet."}
          </p>
        ) : paymentMethod.type === "us_bank_account" ? (
          <div className={styles.paymentRow}>
            <Bank size={18} weight="duotone" className={styles.paymentIcon} />
            <div>
              <div className={styles.paymentMain}>{paymentMethod.label}</div>
              <div className={styles.paymentSub}>ACH bank debit</div>
            </div>
          </div>
        ) : (
          <div className={styles.paymentRow}>
            <CreditCard size={18} weight="duotone" className={styles.paymentIcon} />
            <div>
              <div className={styles.paymentMain}>{paymentMethod.label}</div>
              <div className={`${styles.paymentSub} ${paymentMethod.isExpiringSoon ? styles.paymentExpiring : ""}`}>
                {paymentMethod.isExpiringSoon ? <Warning size={13} weight="fill" /> : null}
                {paymentMethod.status}
                {paymentMethod.isExpiringSoon ? " (expiring soon)" : ""}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
