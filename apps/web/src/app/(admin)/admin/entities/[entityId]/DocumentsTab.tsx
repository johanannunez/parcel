import type { ElementType } from "react";
import {
  FileText,
  FilePdf,
  Scales,
  Wallet,
  Buildings,
  CheckCircle,
  Clock,
  XCircle,
  DownloadSimple,
} from "@phosphor-icons/react/dist/ssr";
import type { EntityDocument } from "@/lib/admin/entity-documents";
import styles from "./DocumentsTab.module.css";

const CATEGORY_META: Record<EntityDocument["category"], { label: string; icon: ElementType }> = {
  legal: { label: "Legal", icon: Scales },
  financial: { label: "Financial", icon: Wallet },
  property: { label: "Property-specific", icon: Buildings },
};

function StatusPill({ status }: { status: string }) {
  if (status === "completed" || status === "signed") {
    return (
      <span className={`${styles.pill} ${styles.pillSigned}`}>
        <CheckCircle size={12} weight="fill" />
        Signed
      </span>
    );
  }
  if (status === "expired" || status === "declined") {
    return (
      <span className={`${styles.pill} ${styles.pillExpired}`}>
        <XCircle size={12} weight="fill" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }
  return (
    <span className={`${styles.pill} ${styles.pillPending}`}>
      <Clock size={12} weight="fill" />
      Pending
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function DocumentsTab({ documents }: { documents: EntityDocument[] }) {
  const byCategory = new Map<EntityDocument["category"], EntityDocument[]>();
  for (const doc of documents) {
    const list = byCategory.get(doc.category) ?? [];
    list.push(doc);
    byCategory.set(doc.category, list);
  }

  const categoryOrder: EntityDocument["category"][] = ["legal", "financial", "property"];

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.title}>Documents</h2>
        <p className={styles.subtitle}>Agreements, tax forms, and property-specific documents.</p>
      </div>

      {documents.length === 0 ? (
        <div className={styles.emptyState}>
          <FilePdf size={32} weight="duotone" className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>No documents yet</p>
          <p className={styles.emptyBody}>
            Documents sent for signature via BoldSign will appear here automatically.
          </p>
        </div>
      ) : (
        <div className={styles.categories}>
          {categoryOrder.map((cat) => {
            const docs = byCategory.get(cat);
            if (!docs || docs.length === 0) return null;
            const { label, icon: Icon } = CATEGORY_META[cat];

            return (
              <div key={cat} className={styles.category}>
                <div className={styles.categoryHeader}>
                  <Icon size={15} weight="duotone" className={styles.categoryIcon} />
                  <h3 className={styles.categoryTitle}>{label}</h3>
                  <span className={styles.categoryCount}>{docs.length}</span>
                </div>
                <div className={styles.docList}>
                  {docs.map((doc) => (
                    <div key={doc.id} className={styles.docRow}>
                      <FileText size={16} weight="duotone" className={styles.docIcon} />
                      <div className={styles.docMain}>
                        <div className={styles.docName}>{doc.templateName}</div>
                        <div className={styles.docMeta}>
                          {doc.propertyLabel ? (
                            <span className={styles.docProperty}>{doc.propertyLabel}</span>
                          ) : null}
                          <span className={styles.docDate}>
                            {doc.signedAt
                              ? `Signed ${formatDate(doc.signedAt)}`
                              : `Sent ${formatDate(doc.createdAt)}`}
                          </span>
                        </div>
                      </div>
                      <StatusPill status={doc.status} />
                      {doc.signedPdfUrl ? (
                        <a
                          href={doc.signedPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.downloadBtn}
                          aria-label={`Download ${doc.templateName}`}
                        >
                          <DownloadSimple size={15} />
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
