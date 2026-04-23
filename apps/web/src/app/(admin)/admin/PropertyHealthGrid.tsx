// apps/web/src/app/(admin)/admin/PropertyHealthGrid.tsx
import Link from 'next/link';
import type { PropertyHealthCard, CategoryHealth } from '@/lib/admin/dashboard-data';
import styles from './PropertyHealthGrid.module.css';

function CategoryBar({ health, color }: { health: CategoryHealth; color: 'green' | 'amber' | 'red' }) {
  const pct = health.total > 0 ? Math.round((health.done / health.total) * 100) : 0;
  return (
    <div className={styles.track}>
      <div
        className={`${styles.fill} ${
          color === 'red' ? styles.fillRed :
          color === 'amber' ? styles.fillAmber :
          styles.fillGreen
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function PropertyCard({ card }: { card: PropertyHealthCard }) {
  const borderCls =
    card.worstOverall === 'red' ? styles.cardRed :
    card.worstOverall === 'amber' ? styles.cardAmber :
    styles.cardGreen;

  const docColor = card.documents.worst === 'stuck' ? 'red' : card.documents.worst ? 'amber' : 'green';
  const finColor = card.finances.worst === 'stuck' ? 'red' : card.finances.worst ? 'amber' : 'green';
  const listColor = card.listings.worst === 'stuck' ? 'red' : card.listings.worst ? 'amber' : 'green';

  return (
    <Link href={card.href} className={`${styles.card} ${borderCls}`}>
      {card.coverPhotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={card.coverPhotoUrl} alt={card.name} className={styles.cover} />
      ) : (
        <div className={styles.cover} />
      )}
      <div className={styles.body}>
        <div>
          <div className={styles.name}>{card.address ?? card.name}</div>
          <div className={styles.location}>{card.city}, {card.state}</div>
        </div>
        <div className={styles.cats}>
          {(
            [
              { label: 'Docs', health: card.documents, color: docColor },
              { label: 'Finance', health: card.finances, color: finColor },
              { label: 'Listings', health: card.listings, color: listColor },
            ] as const
          ).map(({ label, health, color }) => (
            <div key={label} className={styles.catRow}>
              <span className={styles.catLabel}>{label}</span>
              <CategoryBar health={health} color={color} />
              <span className={styles.catCount}>{health.done}/{health.total}</span>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}

export function PropertyHealthGrid({ cards }: { cards: PropertyHealthCard[] }) {
  if (cards.length === 0) {
    return <p className={styles.empty}>No active properties yet.</p>;
  }
  return (
    <div className={styles.grid}>
      {cards.map((card) => (
        <PropertyCard key={card.id} card={card} />
      ))}
    </div>
  );
}
