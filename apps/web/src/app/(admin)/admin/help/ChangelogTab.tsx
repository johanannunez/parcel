"use client";

import { useState, useTransition } from "react";
import { CustomSelect } from "@/components/admin/CustomSelect";
import { createChangelog, type Changelog } from "@/lib/admin/changelogs";

const TAG_OPTIONS = ["feature", "fix", "improvement", "breaking"] as const;
const TAG_SELECT_OPTIONS = [
  { value: "", label: "No tag" },
  ...TAG_OPTIONS.map((tag) => ({
    value: tag,
    label: tag.charAt(0).toUpperCase() + tag.slice(1),
  })),
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function TagBadge({ tag }: { tag: string | null }) {
  if (!tag) return null;
  const colors: Record<string, { bg: string; color: string }> = {
    feature: { bg: "rgba(2,170,235,0.12)", color: "#02AAEB" },
    fix: { bg: "rgba(239,68,68,0.12)", color: "#ef4444" },
    improvement: { bg: "rgba(16,185,129,0.12)", color: "#10b981" },
    breaking: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  };
  const style = colors[tag] ?? { bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: "99px",
        fontSize: "11px",
        fontWeight: 600,
        background: style.bg,
        color: style.color,
        textTransform: "capitalize",
      }}
    >
      {tag}
    </span>
  );
}

export function ChangelogTab({ initialEntries }: { initialEntries: Changelog[] }) {
  const [entries, setEntries] = useState<Changelog[]>(initialEntries);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [version, setVersion] = useState("");
  const [tag, setTag] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await createChangelog({ title, body, version, tag });
      if (!result.ok) {
        setError(result.error ?? "Failed to create entry.");
        return;
      }
      setSuccess(true);
      setTitle("");
      setBody("");
      setVersion("");
      setTag("");
      setEntries((prev) => [
        {
          id: crypto.randomUUID(),
          title,
          body,
          version: version || null,
          tag: tag || null,
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1px solid var(--color-warm-gray-200)",
    background: "var(--color-white)",
    fontSize: "13px",
    color: "var(--color-text-primary)",
    outline: "none",
    fontFamily: "inherit",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <div
        style={{
          background: "var(--color-white)",
          border: "1px solid var(--color-warm-gray-200)",
          borderRadius: "14px",
          padding: "24px",
        }}
      >
        <h3
          style={{
            margin: "0 0 20px",
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--color-text-primary)",
          }}
        >
          New changelog entry
        </h3>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              required
              style={{ ...inputStyle, flex: 1 }}
            />
            <input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="v1.2.0"
              style={{ ...inputStyle, width: "100px", flex: "none" }}
            />
            <CustomSelect
              value={tag}
              onChange={setTag}
              options={TAG_SELECT_OPTIONS}
            />
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What changed? One line is fine."
            required
            rows={3}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
          />
          {error && (
            <p style={{ margin: 0, fontSize: "12px", color: "#dc2626" }}>{error}</p>
          )}
          {success && (
            <p style={{ margin: 0, fontSize: "12px", color: "#10b981" }}>Entry published.</p>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={pending}
              style={{
                padding: "8px 18px",
                borderRadius: "9px",
                border: "none",
                background: "var(--color-brand)",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 600,
                cursor: pending ? "wait" : "pointer",
                opacity: pending ? 0.6 : 1,
                fontFamily: "inherit",
              }}
            >
              {pending ? "Publishing…" : "Publish"}
            </button>
          </div>
        </form>
      </div>

      {entries.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--color-text-tertiary)", textAlign: "center" }}>
          No changelog entries yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
          {entries.map((e) => (
            <div
              key={e.id}
              style={{
                background: "var(--color-white)",
                border: "1px solid var(--color-warm-gray-100)",
                borderRadius: "10px",
                padding: "14px 18px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    flex: 1,
                  }}
                >
                  {e.title}
                </span>
                {e.version && (
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--color-text-tertiary)",
                      fontFamily: "ui-monospace, monospace",
                    }}
                  >
                    {e.version}
                  </span>
                )}
                <TagBadge tag={e.tag} />
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--color-text-tertiary)",
                    flexShrink: 0,
                  }}
                >
                  {formatDate(e.published_at)}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "12.5px",
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.55,
                }}
              >
                {e.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
