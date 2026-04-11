import type { Metadata } from "next";
import {
  ListChecks,
  CheckCircle,
  Circle,
  Warning,
  ArrowUp,
} from "@phosphor-icons/react/dist/ssr";
import { getPortalContext } from "@/lib/portal-context";
import { EmptyState } from "@/components/portal/EmptyState";
import { formatMedium } from "@/lib/format";

export const metadata: Metadata = { title: "Tasks" };
export const dynamic = "force-dynamic";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  property_id: string | null;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
};

const priorityStyle = (p: string | null) => {
  if (p === "high")
    return { bg: "rgba(220, 38, 38, 0.10)", fg: "#b91c1c", label: "High" };
  if (p === "medium")
    return { bg: "rgba(245, 158, 11, 0.14)", fg: "#b45309", label: "Medium" };
  return { bg: "rgba(2, 170, 235, 0.10)", fg: "#0c6fae", label: "Low" };
};

export default async function TasksPage() {
  const { userId, client } = await getPortalContext();

  const [tasksResult, { data: properties }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any)
      .from("owner_tasks")
      .select(
        "id, title, description, status, priority, property_id, due_date, created_at, completed_at",
      )
      .eq("owner_id", userId)
      .order("created_at", { ascending: false }),
    client.from("properties").select("id, name, address_line1").eq("owner_id", userId),
  ]);

  const tasks: Task[] = tasksResult.data ?? [];
  const propertyMap = new Map(
    (properties ?? []).map((p) => [p.id, p.name?.trim() || p.address_line1 || "Property"]),
  );

  const open = tasks.filter((t) => t.status !== "completed" && t.status !== "done");
  const done = tasks.filter((t) => t.status === "completed" || t.status === "done");

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <EmptyState
          icon={<ListChecks size={26} weight="duotone" />}
          title="No tasks yet"
          body="Tasks assigned to you by your Parcel team will appear here."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary strip */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            backgroundColor: "var(--color-warm-gray-100)",
            color: "var(--color-text-secondary)",
          }}
        >
          {tasks.length} task{tasks.length !== 1 ? "s" : ""}
        </span>
        {open.length > 0 && (
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              color: "#b45309",
            }}
          >
            {open.length} open
          </span>
        )}
        {done.length > 0 && (
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              backgroundColor: "rgba(22, 163, 74, 0.10)",
              color: "#15803d",
            }}
          >
            {done.length} done
          </span>
        )}
      </div>

      {/* Open tasks */}
      {open.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2
            className="text-sm font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Open
          </h2>
          {open.map((task) => {
            const pStyle = priorityStyle(task.priority);
            const propertyLabel = task.property_id ? propertyMap.get(task.property_id) : null;
            return (
              <div
                key={task.id}
                className="rounded-2xl border p-5"
                style={{
                  backgroundColor: "var(--color-white)",
                  borderColor: "var(--color-warm-gray-200)",
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 shrink-0"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    <Circle size={18} weight="regular" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-sm font-semibold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {task.title}
                    </div>
                    {task.description && (
                      <div
                        className="mt-1 text-sm leading-relaxed"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {task.description}
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {task.due_date && (
                        <span
                          className="flex items-center gap-1 text-xs"
                          style={{ color: "var(--color-text-tertiary)" }}
                        >
                          <Warning size={12} weight="fill" />
                          Due {formatMedium(task.due_date)}
                        </span>
                      )}
                      {propertyLabel && (
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: "rgba(2, 170, 235, 0.08)",
                            color: "var(--color-brand)",
                          }}
                        >
                          {propertyLabel}
                        </span>
                      )}
                      {task.priority && (
                        <span
                          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                          style={{ backgroundColor: pStyle.bg, color: pStyle.fg }}
                        >
                          {task.priority === "high" && <ArrowUp size={10} weight="bold" />}
                          {pStyle.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Completed tasks */}
      {done.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2
            className="text-sm font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Completed
          </h2>
          {done.map((task) => {
            const propertyLabel = task.property_id ? propertyMap.get(task.property_id) : null;
            return (
              <div
                key={task.id}
                className="rounded-2xl border p-5 opacity-70"
                style={{
                  backgroundColor: "var(--color-white)",
                  borderColor: "var(--color-warm-gray-200)",
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0" style={{ color: "#15803d" }}>
                    <CheckCircle size={18} weight="duotone" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-sm font-medium line-through"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {task.title}
                    </div>
                    {propertyLabel && (
                      <div className="mt-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: "rgba(2, 170, 235, 0.08)",
                            color: "var(--color-brand)",
                          }}
                        >
                          {propertyLabel}
                        </span>
                      </div>
                    )}
                    {task.completed_at && (
                      <div
                        className="mt-1.5 text-xs"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        Completed {formatMedium(task.completed_at)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
