import Link from "next/link";
import styles from "./OverviewPanels.module.css";
import type { OwnerDetailData } from "@/lib/admin/owner-detail";
import {
  BillingCard,
  TasksPanel,
  gradientFor,
} from "./OverviewShared";
import { createClient } from "@/lib/supabase/server";
import { ONBOARDING_PHASE_TOTALS } from "@/lib/admin/onboarding-templates";

type PhaseStatus = "Not started" | "In progress" | "Complete";

function phaseStatus(done: number, total: number): PhaseStatus {
  if (done === 0) return "Not started";
  if (done >= total) return "Complete";
  return "In progress";
}

export async function OverviewOnboarding({
  data,
  lifetimeRevenueCents,
}: {
  data: OwnerDetailData;
  lifetimeRevenueCents?: number | null;
}) {
  const { properties, entity } = data;
  const propertyIds = properties.map((p) => p.id);

  // Fetch real onboarding task progress when properties exist.
  type TaskRow = { parent_id: string; tags: string[]; status: string };
  let taskRows: TaskRow[] = [];

  if (propertyIds.length > 0) {
    const supabase = await createClient();
    const { data: rows } = await (supabase as any)
      .from("tasks")
      .select("parent_id, tags, status")
      .eq("parent_type", "property")
      .in("parent_id", propertyIds)
      .not("tags", "is", null);

    taskRows = ((rows ?? []) as TaskRow[]).filter((r) =>
      (r.tags ?? []).includes("onboarding"),
    );
  }

  const propertiesWithProgress = properties.map((p) => {
    const propTasks = taskRows.filter((r) => r.parent_id === p.id);

    const byPhase = (tag: string) => propTasks.filter((r) => r.tags.includes(tag));
    const doneCount = (tasks: TaskRow[]) => tasks.filter((r) => r.status === "done").length;
    const inProgressCount = (tasks: TaskRow[]) =>
      tasks.filter((r) => r.status === "in_progress").length;
    const blockedCount = (tasks: TaskRow[]) =>
      tasks.filter((r) => r.status === "blocked").length;

    const docTasks  = byPhase("onboarding:documents");
    const finTasks  = byPhase("onboarding:finances");
    const listTasks = byPhase("onboarding:listings");

    const docDone   = doneCount(docTasks);
    const finDone   = doneCount(finTasks);
    const listDone  = doneCount(listTasks);

    // Fall back to template counts if tasks have not been seeded yet.
    const docTotal  = docTasks.length  || ONBOARDING_PHASE_TOTALS.documents;
    const finTotal  = finTasks.length  || ONBOARDING_PHASE_TOTALS.finances;
    const listTotal = listTasks.length || ONBOARDING_PHASE_TOTALS.listings;

    const completed = docDone + finDone + listDone;
    const total     = docTotal + finTotal + listTotal;

    const allInProgress = [docTasks, finTasks, listTasks].reduce(
      (sum, g) => sum + inProgressCount(g), 0,
    );
    const allBlocked = [docTasks, finTasks, listTasks].reduce(
      (sum, g) => sum + blockedCount(g), 0,
    );

    return {
      property: p,
      phases: {
        Documents: { completed: docDone, total: docTotal, status: phaseStatus(docDone, docTotal) },
        Finances:  { completed: finDone, total: finTotal, status: phaseStatus(finDone, finTotal) },
        Listings:  { completed: listDone, total: listTotal, status: phaseStatus(listDone, listTotal) },
      },
      completed,
      total,
      inProgress: allInProgress,
      blocked: allBlocked,
    };
  });

  const aggregateTotal    = propertiesWithProgress.reduce((s, x) => s + x.total, 0);
  const aggregateDone     = propertiesWithProgress.reduce((s, x) => s + x.completed, 0);
  const aggregateInProgress = propertiesWithProgress.reduce((s, x) => s + x.inProgress, 0);
  const aggregateBlocked  = propertiesWithProgress.reduce((s, x) => s + x.blocked, 0);
  const pct = aggregateTotal === 0
    ? 0
    : Math.round((aggregateDone / aggregateTotal) * 100);

  return (
    <>
      <div className={styles.topRow}>
        <TasksPanel entityId={entity.id} />
        <BillingCard lifetimeRevenueCents={lifetimeRevenueCents} />
      </div>

      <section className={styles.launchpad} style={{ marginTop: 18 }}>
        <header className={styles.launchpadHead}>
          <div className={styles.launchpadHeadLeft}>
            <div className={styles.launchpadHeadTitle}>Onboarding progress</div>
          </div>
          <Link
            href="/admin/properties?view=launchpad"
            className={styles.panelLink}
            prefetch={false}
          >
            Open full launchpad &rarr;
          </Link>
        </header>

        <div className={styles.launchpadBody}>
          <div className={styles.headline}>
            <div className={styles.headlinePct}>{pct}%</div>
            <div className={styles.headlineText}>
              {aggregateDone} of {aggregateTotal} tasks complete across{" "}
              {properties.length} propert
              {properties.length === 1 ? "y" : "ies"}
            </div>
          </div>

          <div className={styles.segBar} aria-hidden>
            <span className={styles.segDone} style={{ flex: aggregateDone }} />
            <span
              className={styles.segIdle}
              style={{ flex: Math.max(1, aggregateTotal - aggregateDone) }}
            />
          </div>

          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: "#12824A" }} />
              {aggregateDone} completed
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: "#B45309" }} />
              {aggregateInProgress} in progress
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: "#B3261E" }} />
              {aggregateBlocked} stuck
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: "#8A9AAB" }} />
              {Math.max(0, aggregateTotal - aggregateDone - aggregateInProgress - aggregateBlocked)} not started
            </span>
          </div>

          {properties.length === 0 ? (
            <div
              className={styles.emptyBlock}
              style={{ marginTop: 16, padding: "20px 16px" }}
            >
              No properties yet. Once this owner adds their first property,
              their launchpad will show up here.
            </div>
          ) : (
            <div className={styles.launchpadList}>
              {propertiesWithProgress.map(
                ({ property: p, phases, completed, total }) => {
                  const propPct = total === 0 ? 0 : Math.round((completed / total) * 100);
                  const subParts: string[] = [];
                  if (p.city)
                    subParts.push(`${p.city}${p.state ? `, ${p.state}` : ""}`);
                  if (p.bedrooms)
                    subParts.push(`${p.bedrooms} bed${p.bedrooms === 1 ? "" : "s"}`);
                  if (p.bathrooms)
                    subParts.push(`${p.bathrooms} bath${p.bathrooms === 1 ? "" : "s"}`);
                  return (
                    <div key={p.id} className={styles.propRow}>
                      <div className={styles.propRowHead}>
                        <div
                          className={styles.propThumb}
                          style={{ background: gradientFor(p.id) }}
                        />
                        <div className={styles.propText}>
                          <div className={styles.propAddr}>{p.label}</div>
                          {subParts.length > 0 ? (
                            <div className={styles.propSub}>
                              {subParts.join(" · ")}
                            </div>
                          ) : null}
                        </div>
                        <div className={styles.propFrac}>
                          {propPct}% &middot; {completed}/{total}
                        </div>
                        <Link
                          href={`/admin/properties/${p.id}`}
                          className={styles.propLink}
                          prefetch={false}
                        >
                          View &rarr;
                        </Link>
                      </div>
                      <div className={styles.phaseGrid}>
                        {(["Documents", "Finances", "Listings"] as const).map(
                          (phaseName) => {
                            const phase = phases[phaseName];
                            const phasePct =
                              phase.total === 0
                                ? 0
                                : Math.round((phase.completed / phase.total) * 100);
                            return (
                              <div key={phaseName} className={styles.phaseCard}>
                                <div className={styles.phaseHead}>
                                  <div className={styles.phaseName}>{phaseName}</div>
                                  <div className={styles.phaseFrac}>
                                    {phase.completed}/{phase.total}
                                  </div>
                                </div>
                                <div className={styles.phaseBar}>
                                  <div
                                    className={styles.phaseFill}
                                    style={{ width: `${phasePct}%` }}
                                  />
                                </div>
                                <div className={styles.phaseStatus}>{phase.status}</div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
