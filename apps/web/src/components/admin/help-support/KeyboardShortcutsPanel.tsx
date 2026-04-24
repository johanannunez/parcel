"use client";

type Shortcut = { keys: string[]; label: string };
type Category = { title: string; shortcuts: Shortcut[] };

const SHORTCUTS: Category[] = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["G", "H"], label: "Go to Dashboard" },
      { keys: ["G", "P"], label: "Go to Properties" },
      { keys: ["G", "I"], label: "Go to Inbox" },
      { keys: ["G", "T"], label: "Go to Tasks" },
      { keys: ["G", "C"], label: "Go to Contacts" },
    ],
  },
  {
    title: "Actions",
    shortcuts: [
      { keys: ["C"], label: "Create new item" },
      { keys: ["⌘", "K"], label: "Open command palette" },
      { keys: ["?"], label: "Open Help & Support" },
    ],
  },
  {
    title: "Search",
    shortcuts: [
      { keys: ["⌘", "K"], label: "Global search" },
      { keys: ["⌘", "F"], label: "Search on page" },
    ],
  },
  {
    title: "System",
    shortcuts: [
      { keys: ["Esc"], label: "Close modal / go back" },
      { keys: ["⌘", "\\"], label: "Toggle sidebar" },
    ],
  },
];

function Kbd({ children }: { children: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "22px",
        height: "20px",
        padding: "0 5px",
        borderRadius: "5px",
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        fontFamily: "ui-monospace, SFMono-Regular, monospace",
        fontSize: "11px",
        fontWeight: 600,
        color: "rgba(255,255,255,0.70)",
        lineHeight: 1,
      }}
    >
      {children}
    </span>
  );
}

export function KeyboardShortcutsPanel() {
  return (
    <div style={{ padding: "4px 0 16px" }}>
      {SHORTCUTS.map((cat) => (
        <div key={cat.title} style={{ marginBottom: "4px" }}>
          <div
            style={{
              padding: "10px 20px 6px",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.30)",
            }}
          >
            {cat.title}
          </div>
          {cat.shortcuts.map((s) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "7px 20px",
              }}
            >
              <span
                style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.55)" }}
              >
                {s.label}
              </span>
              <div style={{ display: "flex", gap: "4px" }}>
                {s.keys.map((k, i) => (
                  <Kbd key={i}>{k}</Kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
