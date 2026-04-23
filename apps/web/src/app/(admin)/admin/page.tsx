// apps/web/src/app/(admin)/admin/page.tsx
import type { Metadata } from 'next';
import { fetchDashboardData } from '@/lib/admin/dashboard-data';
import { fetchDashboardTasks } from '@/lib/admin/dashboard-tasks';
import { PropertyHealthGrid } from './PropertyHealthGrid';
import { AttentionQueue } from './AttentionQueue';
import { DashboardTaskSurface } from './DashboardTaskSurface';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [{ propertyCards, attentionItems }, tasks] = await Promise.all([
    fetchDashboardData(),
    fetchDashboardTasks(),
  ]);

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Property Health</h2>
        <PropertyHealthGrid cards={propertyCards} />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Attention Queue</h2>
        <AttentionQueue items={attentionItems} />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Tasks</h2>
        <DashboardTaskSurface tasks={tasks} />
      </section>
    </div>
  );
}
