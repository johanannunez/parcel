import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  Circle,
  ClipboardText,
  FileText,
  House,
  Sparkle,
  Lock,
} from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Setup",
};

export const dynamic = "force-dynamic";

type StepState = "done" | "active" | "todo" | "locked";

type Step = {
  key: string;
  label: string;
  hint: string;
  state: StepState;
  href?: string;
};

type Track = {
  id: "property" | "welcome";
  eyebrow: string;
  title: string;
  summary: string;
  icon: React.ReactNode;
  tint: string;
  steps: Step[];
};

type PropertyRow = {
  id: string;
  name: string | null;
  address_line1: string | null;
  city: string | null;
  property_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  guest_capacity: number | null;
  active: boolean | null;
};

function isBasicsComplete(p: PropertyRow | null | undefined) {
  if (!p) return false;
  return Boolean(
    p.property_type &&
      p.address_line1 &&
      p.city &&
      p.bedrooms !== null &&
      p.bathrooms !== null &&
      p.guest_capacity !== null,
  );
}

export default async function SetupHubPage({
  searchParams,
}: {
  searchParams?: Promise<{ just?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const params = await searchParams;
  const justCompleted = params?.just ?? null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: properties } = await supabase
    .from("properties")
    .select(
      "id, name, address_line1, city, property_type, bedrooms, bathrooms, guest_capacity, active",
    )
    .order("created_at", { ascending: true });

  const firstName =
    profile?.full_name?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "there";

  const firstProperty = (properties?.[0] as PropertyRow | undefined) ?? null;
  const propertyLabel =
    firstProperty?.name ||
    firstProperty?.address_line1 ||
    firstProperty?.city ||
    "your property";

  const basicsDone = isBasicsComplete(firstProperty);

  const propertySteps: Step[] = [
    {
      key: "basics",
      label: "Property basics",
      hint: "Address, type, bedrooms, bathrooms, guests.",
      state: basicsDone ? "done" : "active",
      href: "/portal/setup/basics",
    },
    {
      key: "amenities",
      label: "Photos and amenities",
      hint: "Upload photos and check off what guests get.",
      state: basicsDone ? "active" : "locked",
    },
    {
      key: "rules",
      label: "House rules",
      hint: "Quiet hours, pets, smoking, check-in windows.",
      state: "locked",
    },
    {
      key: "pricing",
      label: "Pricing and calendar",
      hint: "Nightly rate, minimum stay, blocked dates.",
      state: "locked",
    },
    {
      key: "golive",
      label: "Go live",
      hint: "Final review, then we push to every channel.",
      state: "locked",
    },
  ];

  const welcomeSteps: Step[] = [
    {
      key: "agreement",
      label: "Management agreement",
      hint: "The Parcel owner agreement. Signed in the portal.",
      state: "active",
    },
    {
      key: "deposit",
      label: "Direct deposit",
      hint: "Where your payouts land each month.",
      state: "locked",
    },
    {
      key: "w9",
      label: "Tax form (W-9)",
      hint: "Required before your first payout.",
      state: "locked",
    },
    {
      key: "insurance",
      label: "Insurance certificate",
      hint: "Upload your policy or let us add you to ours.",
      state: "locked",
    },
    {
      key: "kickoff",
      label: "Kickoff call",
      hint: "Thirty minute walkthrough with Johan.",
      state: "locked",
    },
  ];

  const tracks: Track[] = [
    {
      id: "property",
      eyebrow: "Track 01",
      title: "Property setup",
      summary:
        "Everything we need to list your home and start taking bookings.",
      icon: <House size={22} weight="duotone" />,
      tint: "var(--color-brand)",
      steps: propertySteps,
    },
    {
      id: "welcome",
      eyebrow: "Track 02",
      title: "Welcome packet",
      summary:
        "Paperwork that makes it official. Signed once, stored forever.",
      icon: <FileText size={22} weight="duotone" />,
      tint: "#0E9F6E",
      steps: welcomeSteps,
    },
  ];

  const progress = (track: Track) => {
    const done = track.steps.filter((s) => s.state === "done").length;
    return { done, total: track.steps.length };
  };

  const totalDone = tracks.reduce(
    (sum, t) => sum + progress(t).done,
    0,
  );
  const totalSteps = tracks.reduce((sum, t) => sum + t.steps.length, 0);
  const overallPct = Math.round((totalDone / totalSteps) * 100);

  return (
    <div className="flex flex-col gap-10">
      {justCompleted === "basics" ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm"
          style={{
            borderColor: "#bfe5cd",
            backgroundColor: "#f2fbf5",
            color: "#166534",
          }}
        >
          <CheckCircle
            size={18}
            weight="fill"
            style={{ color: "#15803d" }}
          />
          <span>
            <span className="font-semibold">Property basics saved.</span>{" "}
            Photos and amenities is next.
          </span>
        </div>
      ) : null}

      <header className="flex flex-col gap-6">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Onboarding
          </p>
          <h1
            className="mt-2 text-[34px] font-semibold leading-tight tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            Let us get you set up, {firstName}.
          </h1>
          <p
            className="mt-2 max-w-2xl text-base"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Two short tracks. One gets{" "}
            <span
              className="font-medium"
              style={{ color: "var(--color-text-primary)" }}
            >
              {propertyLabel}
            </span>{" "}
            listing ready. The other handles the paperwork. Finish both
            and you are live on Parcel.
          </p>
        </div>

        <OverallProgressBar
          pct={overallPct}
          done={totalDone}
          total={totalSteps}
        />
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {tracks.map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            progress={progress(track)}
          />
        ))}
      </section>

      <aside
        className="flex flex-col gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between"
        style={{
          borderColor: "var(--color-warm-gray-200)",
          backgroundColor: "var(--color-white)",
        }}
      >
        <div className="flex items-start gap-4">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: "var(--color-warm-gray-50)",
              color: "var(--color-brand)",
            }}
          >
            <Sparkle size={20} weight="duotone" />
          </span>
          <div>
            <h3
              className="text-base font-semibold tracking-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              Stuck on a step?
            </h3>
            <p
              className="mt-1 max-w-md text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Send a message from the portal and Johan will jump in. Most
              owners finish setup in under an hour once they start.
            </p>
          </div>
        </div>
        <Link
          href="/portal/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--color-warm-gray-50)]"
          style={{
            borderColor: "var(--color-warm-gray-200)",
            color: "var(--color-text-primary)",
          }}
        >
          <ClipboardText size={15} weight="duotone" />
          Message Parcel
        </Link>
      </aside>
    </div>
  );
}

function OverallProgressBar({
  pct,
  done,
  total,
}: {
  pct: number;
  done: number;
  total: number;
}) {
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border p-5"
      style={{
        borderColor: "var(--color-warm-gray-200)",
        backgroundColor: "var(--color-white)",
      }}
    >
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Overall progress
          </p>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {done} of {total} steps complete
          </p>
        </div>
        <div
          className="text-2xl font-semibold tabular-nums tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          {pct}%
        </div>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: "var(--color-warm-gray-100)" }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${pct}%`,
            background:
              "linear-gradient(90deg, #02aaeb 0%, #1b77be 100%)",
          }}
        />
      </div>
    </div>
  );
}

function TrackCard({
  track,
  progress,
}: {
  track: Track;
  progress: { done: number; total: number };
}) {
  const pct = Math.round((progress.done / progress.total) * 100);
  const nextStep =
    track.steps.find((s) => s.state === "active") ??
    track.steps.find((s) => s.state === "todo");
  const nextHasHref = Boolean(nextStep?.href);

  return (
    <article
      className="relative flex flex-col overflow-hidden rounded-2xl border"
      style={{
        borderColor: "var(--color-warm-gray-200)",
        backgroundColor: "var(--color-white)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-28"
        style={{
          background: `radial-gradient(120% 100% at 0% 0%, ${track.tint}14 0%, transparent 70%)`,
        }}
      />

      <header className="relative flex items-start justify-between gap-4 px-6 pt-6">
        <div className="flex items-start gap-4">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `${track.tint}14`,
              color: track.tint,
            }}
          >
            {track.icon}
          </span>
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {track.eyebrow}
            </p>
            <h2
              className="mt-1 text-xl font-semibold tracking-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              {track.title}
            </h2>
          </div>
        </div>
        <div
          className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold tabular-nums"
          style={{
            borderColor: "var(--color-warm-gray-200)",
            color: "var(--color-text-secondary)",
          }}
        >
          {progress.done}/{progress.total}
        </div>
      </header>

      <p
        className="relative mt-3 px-6 text-sm"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {track.summary}
      </p>

      <div className="relative px-6 pt-5">
        <div
          className="h-1 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: "var(--color-warm-gray-100)" }}
        >
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${pct}%`,
              backgroundColor: track.tint,
            }}
          />
        </div>
      </div>

      <ul className="relative mt-5 flex flex-col px-3 pb-4">
        {track.steps.map((step, idx) => (
          <li key={step.key}>
            <StepRow step={step} index={idx} tint={track.tint} />
          </li>
        ))}
      </ul>

      <footer
        className="relative mt-auto flex items-center justify-between gap-4 border-t px-6 py-4"
        style={{ borderColor: "var(--color-warm-gray-200)" }}
      >
        <div className="min-w-0">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Next up
          </p>
          <p
            className="mt-0.5 truncate text-sm font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            {nextStep?.label ?? "All done"}
          </p>
        </div>
        {nextStep && nextHasHref ? (
          <Link
            href={nextStep.href ?? "#"}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: track.tint }}
          >
            Continue
            <ArrowRight size={14} weight="bold" />
          </Link>
        ) : (
          <span
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium"
            style={{
              borderColor: "var(--color-warm-gray-200)",
              color: "var(--color-text-tertiary)",
              backgroundColor: "var(--color-warm-gray-50)",
            }}
          >
            Coming soon
          </span>
        )}
      </footer>
    </article>
  );
}

function StepRow({
  step,
  index,
  tint,
}: {
  step: Step;
  index: number;
  tint: string;
}) {
  const isDone = step.state === "done";
  const isActive = step.state === "active";
  const isLocked = step.state === "locked";

  const icon = isDone ? (
    <CheckCircle size={18} weight="fill" />
  ) : isLocked ? (
    <Lock size={14} weight="duotone" />
  ) : (
    <Circle size={16} weight={isActive ? "bold" : "regular"} />
  );

  const iconColor = isDone
    ? tint
    : isActive
      ? tint
      : "var(--color-text-tertiary)";

  const labelColor = isLocked
    ? "var(--color-text-tertiary)"
    : "var(--color-text-primary)";

  return (
    <div
      className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors"
      style={{
        backgroundColor: isActive
          ? "var(--color-warm-gray-50)"
          : "transparent",
      }}
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
        style={{
          color: iconColor,
          backgroundColor: isActive
            ? "var(--color-white)"
            : "transparent",
          border: isActive
            ? `1px solid ${tint}33`
            : "1px solid transparent",
        }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span
            className="text-[10px] font-semibold tabular-nums tracking-[0.12em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <span
            className="text-sm font-medium"
            style={{
              color: labelColor,
              textDecoration: isDone ? "line-through" : "none",
              textDecorationColor: "var(--color-warm-gray-200)",
            }}
          >
            {step.label}
          </span>
        </div>
        <p
          className="mt-0.5 text-[13px] leading-snug"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {step.hint}
        </p>
      </div>
    </div>
  );
}
