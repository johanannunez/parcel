import {
  Receipt,
  WarningCircle,
  ClockCountdown,
  ArrowSquareOut,
} from "@phosphor-icons/react/dist/ssr";
import {
  isStripeConfigured,
  listInvoicesForOwner,
  type InvoiceRow,
} from "@/lib/stripe";
import styles from "./FinancialsTab.module.css";

/**
 * Server component. Renders the owner's invoice list pulled from the
 * local `invoices` mirror table. When STRIPE_SECRET_KEY is not set the
 * setup notice appears but we still show whatever invoices happen to be
 * in the DB (normally none).
 */
export async function FinancialsTab({ ownerId }: { ownerId: string }) {
  const configured = isStripeConfigured();
  const invoices = await listInvoicesForOwner(ownerId);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.title}>Financials</h2>
        <p className={styles.subtitle}>
          Invoices, subscriptions, and payout activity.
        </p>
      </div>

      {!configured ? <StripeSetupNotice /> : null}

      <InvoicesCard invoices={invoices} />

      <SubscriptionsPlaceholder />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stripe setup notice
// ---------------------------------------------------------------------------

function StripeSetupNotice() {
  return (
    <div className={styles.notice} role="note">
      <div className={styles.noticeIcon} aria-hidden>
        <WarningCircle size={18} weight="fill" />
      </div>
      <div className={styles.noticeBody}>
        <div className={styles.noticeTitle}>Stripe is not yet configured</div>
        <div className={styles.noticeText}>
          Set <code>STRIPE_SECRET_KEY</code> (and{" "}
          <code>STRIPE_WEBHOOK_SECRET</code>) in Vercel to enable invoicing.
          Existing invoices will still render if any are already in the
          database.
        </div>
        <a
          className={styles.noticeLink}
          href="https://dashboard.stripe.com/apikeys"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Stripe dashboard &rarr;
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Invoices card
// ---------------------------------------------------------------------------

const KIND_LABEL: Record<string, string> = {
  onboarding_fee: "Onboarding",
  tech_fee: "Tech fee",
  adhoc: "Ad hoc",
};

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

function formatCurrency(amountCents: number, currency: string): string {
  const amount = amountCents / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function InvoicesCard({ invoices }: { invoices: InvoiceRow[] }) {
  return (
    <section className={styles.card} aria-label="Invoices">
      <header className={styles.cardHead}>
        <div>
          <div className={styles.cardTitle}>Invoices</div>
          <div className={styles.cardSubtitle}>
            {invoices.length === 0
              ? "Nothing billed yet"
              : `${invoices.length} total`}
          </div>
        </div>
      </header>

      {invoices.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <Receipt size={22} weight="duotone" />
          </div>
          <div className={styles.emptyTitle}>No invoices yet</div>
          <div className={styles.emptyBody}>
            Onboarding fees, tech fees, and ad-hoc charges will show up here
            once you create the first invoice.
          </div>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 130 }}>Date</th>
                <th style={{ width: 120 }}>Kind</th>
                <th>Description</th>
                <th style={{ width: 120, textAlign: "right" }}>Amount</th>
                <th style={{ width: 130 }}>Status</th>
                <th style={{ width: 130 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const descPrimary =
                  inv.description ??
                  inv.items[0]?.description ??
                  (inv.items.length > 0
                    ? `${inv.items.length} line item${inv.items.length === 1 ? "" : "s"}`
                    : "Invoice");
                const descSub =
                  inv.items.length > 1
                    ? `${inv.items.length} line items`
                    : null;
                const statusClass =
                  STATUS_CLASS[inv.status] ?? styles.pillDraft;
                const statusLabel = STATUS_LABEL[inv.status] ?? inv.status;
                const kindLabel = KIND_LABEL[inv.kind] ?? inv.kind;
                return (
                  <tr key={inv.id}>
                    <td className={styles.cellDate}>
                      {formatDate(inv.created_at)}
                    </td>
                    <td>
                      <span className={styles.kindPill}>{kindLabel}</span>
                    </td>
                    <td className={styles.cellDesc}>
                      <span className={styles.cellDescMain}>
                        {descPrimary}
                      </span>
                      {descSub ? (
                        <span className={styles.cellDescSub}>{descSub}</span>
                      ) : null}
                    </td>
                    <td className={styles.cellAmount}>
                      {formatCurrency(inv.amount_cents, inv.currency)}
                    </td>
                    <td>
                      <span className={`${styles.pill} ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td>
                      {inv.hosted_invoice_url ? (
                        <a
                          className={styles.actionLink}
                          href={inv.hosted_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open invoice{" "}
                          <ArrowSquareOut
                            size={12}
                            weight="bold"
                            style={{
                              verticalAlign: "-2px",
                              marginLeft: 2,
                            }}
                          />
                        </a>
                      ) : (
                        <span className={styles.actionDisabled}>&mdash;</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Subscriptions (coming soon)
// ---------------------------------------------------------------------------

function SubscriptionsPlaceholder() {
  return (
    <div className={styles.soonCard} role="note">
      <div className={styles.soonIcon}>
        <ClockCountdown size={20} weight="duotone" />
      </div>
      <div className={styles.soonBody}>
        <div className={styles.soonTitle}>Subscriptions</div>
        <div className={styles.soonText}>
          Coming soon. Recurring tech fees and other subscriptions will render
          here once billing is wired up end to end.
        </div>
      </div>
    </div>
  );
}
