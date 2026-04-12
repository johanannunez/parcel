"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  MagnifyingGlass,
  Bank,
  Lightning,
  CaretDown,
  ArrowUp,
  ArrowDown,
  Warning,
  Repeat,
  Coins,
  Receipt,
} from "@phosphor-icons/react";
import { currency2 } from "@/lib/format";
import {
  fetchTransactions,
  confirmDedupMatch,
  type TransactionRow,
  type TransactionFilters,
  type MonthlyBurnRate,
} from "./actions";
import type { TransactionCategory } from "@/lib/treasury/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES: { value: TransactionCategory | ""; label: string }[] = [
  { value: "", label: "All categories" },
  { value: "revenue", label: "Revenue" },
  { value: "transfer", label: "Transfer" },
  { value: "subscription", label: "Subscription" },
  { value: "operating", label: "Operating" },
  { value: "stripe_fee", label: "Stripe Fee" },
  { value: "stripe_payout", label: "Stripe Payout" },
  { value: "other", label: "Other" },
];

const PAGE_SIZE = 50;

// ---------------------------------------------------------------------------
// Category badge styles
// ---------------------------------------------------------------------------

type CategoryStyle = { bg: string; text: string; label: string };

const CATEGORY_STYLES: Record<TransactionCategory, CategoryStyle> = {
  revenue: { bg: "rgba(22,163,74,0.1)", text: "#15803d", label: "Revenue" },
  transfer: { bg: "rgba(107,114,128,0.12)", text: "#4b5563", label: "Transfer" },
  subscription: { bg: "rgba(124,58,237,0.1)", text: "#7c3aed", label: "Subscription" },
  operating: { bg: "rgba(217,119,6,0.1)", text: "#b45309", label: "Operating" },
  stripe_fee: { bg: "rgba(2,170,235,0.12)", text: "#1B77BE", label: "Stripe Fee" },
  stripe_payout: { bg: "rgba(2,170,235,0.12)", text: "#1B77BE", label: "Stripe Payout" },
  other: { bg: "rgba(156,163,175,0.15)", text: "#6b7280", label: "Other" },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type AccountOption = { id: string; name: string };

type Props = {
  accounts: AccountOption[];
  initialTransactions: TransactionRow[];
  initialTotal: number;
  initialBurnRate: MonthlyBurnRate;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TransactionsShell({
  accounts,
  initialTransactions,
  initialTotal,
  initialBurnRate,
}: Props) {
  const [transactions, setTransactions] = useState<TransactionRow[]>(initialTransactions);
  const [total, setTotal] = useState(initialTotal);
  const [burnRate] = useState<MonthlyBurnRate>(initialBurnRate);

  // Filters
  const [accountId, setAccountId] = useState("");
  const [category, setCategory] = useState<TransactionCategory | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [isPending, startTransition] = useTransition();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Dedup confirm state: transactionId -> loading | done
  const [dedupState, setDedupState] = useState<Record<string, "loading" | "done">>({});

  // Debounce search
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search]);

  // Reload from page 1 whenever filters change
  const loadPage1 = useCallback(
    (filters: Omit<TransactionFilters, "page" | "limit">) => {
      startTransition(async () => {
        const result = await fetchTransactions({ ...filters, page: 1, limit: PAGE_SIZE });
        setTransactions(result.transactions);
        setTotal(result.total);
        setPage(1);
      });
    },
    [],
  );

  // Track previous filter values to avoid re-firing on mount
  const prevFilters = useRef({ accountId, category, dateFrom, dateTo, debouncedSearch });

  useEffect(() => {
    const prev = prevFilters.current;
    if (
      prev.accountId === accountId &&
      prev.category === category &&
      prev.dateFrom === dateFrom &&
      prev.dateTo === dateTo &&
      prev.debouncedSearch === debouncedSearch
    ) {
      return;
    }
    prevFilters.current = { accountId, category, dateFrom, dateTo, debouncedSearch };
    loadPage1({ accountId, category, dateFrom, dateTo, search: debouncedSearch });
  }, [accountId, category, dateFrom, dateTo, debouncedSearch, loadPage1]);

  const hasMore = transactions.length < total;

  const handleLoadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    const result = await fetchTransactions({
      accountId,
      category,
      dateFrom,
      dateTo,
      search: debouncedSearch,
      page: nextPage,
      limit: PAGE_SIZE,
    });
    setTransactions((prev) => [...prev, ...result.transactions]);
    setPage(nextPage);
    setIsLoadingMore(false);
  };

  const handleConfirmDedup = async (txId: string) => {
    setDedupState((prev) => ({ ...prev, [txId]: "loading" }));
    await confirmDedupMatch(txId);
    setDedupState((prev) => ({ ...prev, [txId]: "done" }));
    // Reflect in local state
    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, is_duplicate: true } : t)),
    );
  };

  const hasActiveFilters = !!(accountId || category || dateFrom || dateTo || debouncedSearch);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Burn rate summary cards */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
        }}
      >
        <BurnCard
          label="Subscriptions / mo"
          value={currency2.format(burnRate.subscriptions)}
          icon={<Repeat size={18} weight="duotone" color="#7c3aed" />}
          bg="rgba(124,58,237,0.07)"
          border="rgba(124,58,237,0.18)"
        />
        <BurnCard
          label="Operating / mo"
          value={currency2.format(burnRate.operating)}
          icon={<Coins size={18} weight="duotone" color="#b45309" />}
          bg="rgba(217,119,6,0.07)"
          border="rgba(217,119,6,0.18)"
        />
        <BurnCard
          label="Total transactions"
          value={total.toLocaleString()}
          icon={<Receipt size={18} weight="duotone" color="#1B77BE" />}
          bg="rgba(2,170,235,0.07)"
          border="rgba(2,170,235,0.18)"
        />
      </section>

      {/* Filters bar */}
      <section
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          alignItems: "center",
        }}
      >
        {/* Search */}
        <div
          style={{
            position: "relative",
            flex: "1 1 200px",
            minWidth: "160px",
            maxWidth: "280px",
          }}
        >
          <MagnifyingGlass
            size={14}
            weight="bold"
            color="var(--color-text-tertiary)"
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Search merchant or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              paddingLeft: "30px",
              paddingRight: "10px",
              paddingTop: "8px",
              paddingBottom: "8px",
              fontSize: "13px",
              borderRadius: "9px",
              border: "1.5px solid var(--color-warm-gray-200)",
              backgroundColor: "var(--color-white)",
              color: "var(--color-text-primary)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Account selector */}
        <div style={{ position: "relative" }}>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            style={{
              appearance: "none",
              paddingLeft: "12px",
              paddingRight: "28px",
              paddingTop: "8px",
              paddingBottom: "8px",
              fontSize: "13px",
              borderRadius: "9px",
              border: "1.5px solid var(--color-warm-gray-200)",
              backgroundColor: "var(--color-white)",
              color: "var(--color-text-primary)",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <CaretDown
            size={12}
            weight="bold"
            color="var(--color-text-tertiary)"
            style={{
              position: "absolute",
              right: "9px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Category selector */}
        <div style={{ position: "relative" }}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TransactionCategory | "")}
            style={{
              appearance: "none",
              paddingLeft: "12px",
              paddingRight: "28px",
              paddingTop: "8px",
              paddingBottom: "8px",
              fontSize: "13px",
              borderRadius: "9px",
              border: "1.5px solid var(--color-warm-gray-200)",
              backgroundColor: "var(--color-white)",
              color: "var(--color-text-primary)",
              cursor: "pointer",
              outline: "none",
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <CaretDown
            size={12}
            weight="bold"
            color="var(--color-text-tertiary)"
            style={{
              position: "absolute",
              right: "9px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Date from */}
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          style={{
            padding: "8px 10px",
            fontSize: "13px",
            borderRadius: "9px",
            border: "1.5px solid var(--color-warm-gray-200)",
            backgroundColor: "var(--color-white)",
            color: "var(--color-text-primary)",
            outline: "none",
            cursor: "pointer",
          }}
          aria-label="Date from"
        />

        {/* Date to */}
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          style={{
            padding: "8px 10px",
            fontSize: "13px",
            borderRadius: "9px",
            border: "1.5px solid var(--color-warm-gray-200)",
            backgroundColor: "var(--color-white)",
            color: "var(--color-text-primary)",
            outline: "none",
            cursor: "pointer",
          }}
          aria-label="Date to"
        />

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setAccountId("");
              setCategory("");
              setDateFrom("");
              setDateTo("");
              setSearch("");
            }}
            style={{
              padding: "8px 12px",
              fontSize: "12px",
              fontWeight: 600,
              borderRadius: "9px",
              border: "1.5px solid var(--color-warm-gray-200)",
              backgroundColor: "transparent",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              transition: "background-color 0.15s ease",
            }}
          >
            Clear
          </button>
        )}

        {/* Loading indicator */}
        {isPending && (
          <span
            style={{
              fontSize: "12px",
              color: "var(--color-text-tertiary)",
              marginLeft: "4px",
            }}
          >
            Loading...
          </span>
        )}
      </section>

      {/* Table */}
      {transactions.length === 0 && !isPending ? (
        <EmptyState hasFilters={hasActiveFilters} />
      ) : (
        <div
          style={{
            overflow: "hidden",
            borderRadius: "14px",
            border: "1.5px solid var(--color-warm-gray-200)",
            backgroundColor: "var(--color-white)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "var(--color-warm-gray-50)",
                    borderBottom: "1px solid var(--color-warm-gray-200)",
                  }}
                >
                  {["Date", "Merchant", "Description", "Category", "Amount", "Account", "Source", ""].map((h) => (
                    <Th key={h} right={h === "Amount"}>
                      {h}
                    </Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <TransactionTableRow
                    key={tx.id}
                    tx={tx}
                    isLast={i === transactions.length - 1}
                    dedupStatus={dedupState[tx.id]}
                    onConfirmDedup={handleConfirmDedup}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Load more */}
          {hasMore && (
            <div
              style={{
                padding: "14px",
                borderTop: "1px solid var(--color-warm-gray-100)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                style={{
                  padding: "9px 20px",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderRadius: "9px",
                  border: "1.5px solid var(--color-warm-gray-200)",
                  backgroundColor: isLoadingMore ? "var(--color-warm-gray-50)" : "var(--color-white)",
                  color: "var(--color-text-primary)",
                  cursor: isLoadingMore ? "default" : "pointer",
                  opacity: isLoadingMore ? 0.6 : 1,
                  transition: "background-color 0.15s ease",
                }}
              >
                {isLoadingMore ? "Loading..." : `Load more (${total - transactions.length} remaining)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TransactionTableRow
// ---------------------------------------------------------------------------

function TransactionTableRow({
  tx,
  isLast,
  dedupStatus,
  onConfirmDedup,
}: {
  tx: TransactionRow;
  isLast: boolean;
  dedupStatus: "loading" | "done" | undefined;
  onConfirmDedup: (id: string) => void;
}) {
  const catStyle = tx.category ? CATEGORY_STYLES[tx.category] : null;
  const isPositive = tx.amount > 0;
  const formattedAmount = currency2.format(Math.abs(tx.amount));
  const isDedup = tx.is_duplicate || !!tx.duplicate_of || dedupStatus === "done";
  const isSubscription = tx.category === "subscription";

  const dateStr = tx.date
    ? new Date(tx.date + "T12:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <tr
      style={{
        borderBottom: isLast ? "none" : "1px solid var(--color-warm-gray-100)",
        backgroundColor: "var(--color-white)",
        transition: "background-color 0.1s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
          "var(--color-warm-gray-50)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
          "var(--color-white)";
      }}
    >
      {/* Date */}
      <Td>
        <span style={{ color: "var(--color-text-tertiary)", whiteSpace: "nowrap" }}>
          {dateStr}
        </span>
      </Td>

      {/* Merchant */}
      <Td>
        <span
          style={{
            fontWeight: 500,
            color: "var(--color-text-primary)",
            maxWidth: "160px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "block",
          }}
        >
          {tx.merchant_name || (
            <span style={{ color: "var(--color-text-tertiary)", fontStyle: "italic" }}>
              Unknown
            </span>
          )}
        </span>
      </Td>

      {/* Description */}
      <Td>
        <span
          style={{
            color: "var(--color-text-secondary)",
            maxWidth: "200px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "block",
          }}
        >
          {tx.description || ""}
        </span>
      </Td>

      {/* Category */}
      <Td>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          {catStyle ? (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: "20px",
                backgroundColor: catStyle.bg,
                color: catStyle.text,
                letterSpacing: "0.02em",
                whiteSpace: "nowrap",
              }}
            >
              {catStyle.label}
            </span>
          ) : (
            <span style={{ color: "var(--color-text-tertiary)", fontSize: "12px" }}>
              Uncategorized
            </span>
          )}
          {isSubscription && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: "20px",
                backgroundColor: "rgba(124,58,237,0.12)",
                color: "#7c3aed",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              Recurring
            </span>
          )}
          {isDedup && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: "20px",
                backgroundColor: "rgba(2,170,235,0.12)",
                color: "#1B77BE",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              Matched
            </span>
          )}
        </div>
      </Td>

      {/* Amount */}
      <Td right>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontWeight: 600,
            color: isPositive ? "#16a34a" : "#dc2626",
            whiteSpace: "nowrap",
          }}
        >
          {isPositive ? (
            <ArrowUp size={12} weight="bold" />
          ) : (
            <ArrowDown size={12} weight="bold" />
          )}
          {formattedAmount}
        </div>
      </Td>

      {/* Account */}
      <Td>
        <span
          style={{
            color: "var(--color-text-secondary)",
            maxWidth: "120px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "block",
          }}
        >
          {tx.account_name || ""}
        </span>
      </Td>

      {/* Source */}
      <Td>
        <SourceBadge source={tx.source} />
      </Td>

      {/* Actions */}
      <Td>
        {!isDedup && tx.duplicate_of === null && (tx.category === "stripe_payout" || tx.category === "revenue") && (
          <button
            type="button"
            onClick={() => onConfirmDedup(tx.id)}
            disabled={dedupStatus === "loading"}
            title="Mark as matched duplicate"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 9px",
              fontSize: "11px",
              fontWeight: 600,
              borderRadius: "7px",
              border: "1.5px solid rgba(2,170,235,0.3)",
              backgroundColor: "rgba(2,170,235,0.06)",
              color: "#1B77BE",
              cursor: dedupStatus === "loading" ? "default" : "pointer",
              opacity: dedupStatus === "loading" ? 0.5 : 1,
              transition: "opacity 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            <Warning size={11} weight="fill" />
            {dedupStatus === "loading" ? "Saving..." : "Confirm match"}
          </button>
        )}
      </Td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// SourceBadge
// ---------------------------------------------------------------------------

function SourceBadge({ source }: { source: "plaid" | "stripe" | null }) {
  if (!source) return <span style={{ color: "var(--color-text-tertiary)", fontSize: "12px" }}></span>;

  if (source === "stripe") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          fontSize: "11px",
          fontWeight: 600,
          padding: "3px 8px",
          borderRadius: "20px",
          backgroundColor: "rgba(99,91,255,0.1)",
          color: "#6356ff",
          whiteSpace: "nowrap",
        }}
      >
        <Lightning size={11} weight="fill" />
        Stripe
      </span>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        fontSize: "11px",
        fontWeight: 600,
        padding: "3px 8px",
        borderRadius: "20px",
        backgroundColor: "rgba(2,170,235,0.1)",
        color: "#1B77BE",
        whiteSpace: "nowrap",
      }}
    >
      <Bank size={11} weight="fill" />
      Plaid
    </span>
  );
}

// ---------------------------------------------------------------------------
// BurnCard
// ---------------------------------------------------------------------------

function BurnCard({
  label,
  value,
  icon,
  bg,
  border,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  bg: string;
  border: string;
}) {
  return (
    <div
      style={{
        backgroundColor: bg,
        border: `1.5px solid ${border}`,
        borderRadius: "14px",
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "9px",
          backgroundColor: "var(--color-white)",
          border: `1px solid ${border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-text-tertiary)",
            marginBottom: "3px",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: "20px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--color-text-primary)",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "14px",
        padding: "64px 24px",
        borderRadius: "14px",
        border: "1.5px solid var(--color-warm-gray-200)",
        backgroundColor: "var(--color-white)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "16px",
          background: "linear-gradient(135deg, rgba(2,170,235,0.1), rgba(27,119,190,0.1))",
          border: "1.5px solid rgba(2,170,235,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Receipt size={26} weight="duotone" color="#1B77BE" />
      </div>
      <div>
        <p
          style={{
            margin: 0,
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--color-text-primary)",
          }}
        >
          {hasFilters ? "No matching transactions" : "No transactions yet"}
        </p>
        <p
          style={{
            margin: "6px 0 0",
            fontSize: "13px",
            lineHeight: "1.6",
            color: "var(--color-text-secondary)",
            maxWidth: "320px",
          }}
        >
          {hasFilters
            ? "Try adjusting your filters or clearing the search."
            : "Transactions will appear here once your bank account syncs."}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table primitives
// ---------------------------------------------------------------------------

function Th({ children, right = false }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      style={{
        padding: "10px 14px",
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--color-text-tertiary)",
        textAlign: right ? "right" : "left",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, right = false }: { children: React.ReactNode; right?: boolean }) {
  return (
    <td
      style={{
        padding: "11px 14px",
        verticalAlign: "middle",
        textAlign: right ? "right" : "left",
      }}
    >
      {children}
    </td>
  );
}
