# Help & Support Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a frosted-glass Help & Support modal to the admin sidebar footer with six fully functional options: Help Center, Ask AI, What's New, Contact Support, Send Feedback, and Keyboard Shortcuts.

**Architecture:** A `HelpSupportModal` client component mounted in the admin layout (alongside `CreateModal` and `CommandPalette`) listens for a `admin:help-support` custom window event. Detail panels are separate files so three workstreams can run in parallel with no merge conflicts. The `AIChatWidget` is surfaced via a new `AdminAIChatTrigger` wrapper that listens for `admin:ai-chat`.

**Tech Stack:** Next.js 15 App Router, `motion/react` v12 (AnimatePresence + motion.div), Supabase service client, Phosphor Icons (duotone), Resend (fetch-based), Tailwind v4, TypeScript strict.

---

## Execution Order

**Main thread first (Tasks 1–7).** These establish the modal shell and the panel stub files that sub-agents will fill in.

**Sub-agent 1 (Tasks 8–11) and Sub-agent 2 (Tasks 12–15) run in parallel after Task 7 is committed.** They never touch the same files.

---

## File Map

### Main Thread Creates
- `src/components/admin/HelpSupportModal.tsx` — modal shell, 6 option rows, panel routing, keyboard shortcut
- `src/components/admin/help-support/KeyboardShortcutsPanel.tsx` — static shortcuts grid (full)
- `src/components/admin/help-support/WhatsNewPanel.tsx` — **stub** (sub-agent 1 replaces)
- `src/components/admin/help-support/SupportFormPanel.tsx` — **stub** (sub-agent 2 replaces)
- `src/components/admin/help-support/FeedbackFormPanel.tsx` — **stub** (sub-agent 2 replaces)
- `src/components/admin/AdminAIChatTrigger.tsx` — wraps AIChatWidget, listens for admin:ai-chat event
- Modify: `src/components/admin/AdminSidebarFooter.tsx` — add Help & Support trigger button
- Modify: `src/app/(admin)/admin/layout.tsx` — mount HelpSupportModal + AdminAIChatTrigger

### Sub-agent 1 Creates (What's New)
- `supabase/migrations/20260423_changelogs.sql` — changelogs table
- `src/lib/admin/changelogs.ts` — fetchChangelogs + createChangelog server actions
- `src/app/(admin)/admin/help/ChangelogTab.tsx` — admin UI to create/list changelog entries
- Replace: `src/components/admin/help-support/WhatsNewPanel.tsx` — full implementation
- Modify: `src/app/(admin)/admin/help/page.tsx` — add Changelog tab

### Sub-agent 2 Creates (Contact Support + Send Feedback)
- `supabase/migrations/20260423T2_support_tickets.sql` — support_tickets table
- `supabase/migrations/20260423T3_feedback_submissions.sql` — feedback_submissions table
- `src/lib/admin/support.ts` — submitSupportTicket + submitFeedback server actions (email on ticket)
- Replace: `src/components/admin/help-support/SupportFormPanel.tsx` — full implementation
- Replace: `src/components/admin/help-support/FeedbackFormPanel.tsx` — full implementation

---

## Workstream 1: Main Thread

### Task 1: Create help-support panel directory and stub files

**Files:**
- Create: `src/components/admin/help-support/WhatsNewPanel.tsx`
- Create: `src/components/admin/help-support/SupportFormPanel.tsx`
- Create: `src/components/admin/help-support/FeedbackFormPanel.tsx`

- [ ] **Step 1: Create the stub panel files**

Create `src/components/admin/help-support/WhatsNewPanel.tsx`:
```tsx
"use client";

export function WhatsNewPanel() {
  return (
    <div
      style={{
        padding: "32px 20px",
        textAlign: "center",
        color: "rgba(255,255,255,0.35)",
        fontSize: "13px",
      }}
    >
      No updates yet.
    </div>
  );
}
```

Create `src/components/admin/help-support/SupportFormPanel.tsx`:
```tsx
"use client";

export function SupportFormPanel({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        padding: "32px 20px",
        textAlign: "center",
        color: "rgba(255,255,255,0.35)",
        fontSize: "13px",
      }}
    >
      Contact support coming soon.
    </div>
  );
}
```

Create `src/components/admin/help-support/FeedbackFormPanel.tsx`:
```tsx
"use client";

export function FeedbackFormPanel({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        padding: "32px 20px",
        textAlign: "center",
        color: "rgba(255,255,255,0.35)",
        fontSize: "13px",
      }}
    >
      Feedback coming soon.
    </div>
  );
}
```

- [ ] **Step 2: Commit stubs**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/components/admin/help-support/
git commit -m "feat: add help-support panel stub files"
```

---

### Task 2: Create KeyboardShortcutsPanel

**Files:**
- Create: `src/components/admin/help-support/KeyboardShortcutsPanel.tsx`

- [ ] **Step 1: Create the shortcuts panel**

Create `src/components/admin/help-support/KeyboardShortcutsPanel.tsx`:
```tsx
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
```

- [ ] **Step 2: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/components/admin/help-support/KeyboardShortcutsPanel.tsx
git commit -m "feat: add KeyboardShortcutsPanel static component"
```

---

### Task 3: Create AdminAIChatTrigger

**Files:**
- Create: `src/components/admin/AdminAIChatTrigger.tsx`

- [ ] **Step 1: Create the trigger wrapper**

Create `src/components/admin/AdminAIChatTrigger.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { AIChatWidget } from "@/components/help/AIChatWidget";

export function AdminAIChatTrigger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleOpen() {
      setOpen(true);
    }
    window.addEventListener("admin:ai-chat", handleOpen);
    return () => window.removeEventListener("admin:ai-chat", handleOpen);
  }, []);

  return <AIChatWidget open={open} onClose={() => setOpen(false)} />;
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/components/admin/AdminAIChatTrigger.tsx
git commit -m "feat: add AdminAIChatTrigger event-driven wrapper"
```

---

### Task 4: Create HelpSupportModal

**Files:**
- Create: `src/components/admin/HelpSupportModal.tsx`

- [ ] **Step 1: Create the modal component**

Create `src/components/admin/HelpSupportModal.tsx`:
```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpenText,
  Robot,
  Sparkle,
  ChatCircleDots,
  PaperPlaneTilt,
  Command,
  CaretRight,
  ArrowLeft,
  X,
} from "@phosphor-icons/react";
import { KeyboardShortcutsPanel } from "./help-support/KeyboardShortcutsPanel";
import { WhatsNewPanel } from "./help-support/WhatsNewPanel";
import { SupportFormPanel } from "./help-support/SupportFormPanel";
import { FeedbackFormPanel } from "./help-support/FeedbackFormPanel";

type Panel = "root" | "whats-new" | "shortcuts" | "support" | "feedback";

type Option = {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; weight?: string; style?: React.CSSProperties }>;
  iconBg: string;
  iconColor: string;
  panel: Panel | null;
  onClick?: () => void;
};

const PANEL_TITLES: Record<Exclude<Panel, "root">, string> = {
  "whats-new": "What's New",
  shortcuts: "Keyboard Shortcuts",
  support: "Contact Support",
  feedback: "Send Feedback",
};

export function HelpSupportModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>("root");
  const [direction, setDirection] = useState<1 | -1>(1);
  const [focusIdx, setFocusIdx] = useState(0);

  const close = useCallback(() => {
    setOpen(false);
    setPanel("root");
    setDirection(1);
  }, []);

  const goTo = useCallback((p: Panel) => {
    setDirection(1);
    setPanel(p);
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setPanel("root");
  }, []);

  // Listen for open event
  useEffect(() => {
    function handleOpen() {
      setPanel("root");
      setDirection(1);
      setOpen(true);
    }
    window.addEventListener("admin:help-support", handleOpen);
    return () => window.removeEventListener("admin:help-support", handleOpen);
  }, []);

  // Keyboard: ? to open, Escape to close/back
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      const isTyping =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement).isContentEditable;

      if (!open && e.key === "?" && !isTyping && !e.metaKey && !e.ctrlKey) {
        setPanel("root");
        setDirection(1);
        setOpen(true);
        return;
      }
      if (!open) return;

      if (e.key === "Escape") {
        if (panel !== "root") {
          goBack();
        } else {
          close();
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, panel, close, goBack]);

  const OPTIONS: Option[] = [
    {
      id: "help-center",
      label: "Help Center",
      description: "Browse articles and documentation",
      icon: BookOpenText,
      iconBg: "rgba(2,170,235,0.18)",
      iconColor: "#02AAEB",
      panel: null,
      onClick: () => {
        close();
        router.push("/admin/help");
      },
    },
    {
      id: "ask-ai",
      label: "Ask AI",
      description: "Get instant answers from your help articles",
      icon: Robot,
      iconBg: "rgba(139,92,246,0.18)",
      iconColor: "#8b5cf6",
      panel: null,
      onClick: () => {
        close();
        window.dispatchEvent(new CustomEvent("admin:ai-chat"));
      },
    },
    {
      id: "whats-new",
      label: "What's New",
      description: "Latest platform updates and improvements",
      icon: Sparkle,
      iconBg: "rgba(16,185,129,0.18)",
      iconColor: "#10b981",
      panel: "whats-new",
    },
    {
      id: "support",
      label: "Contact Support",
      description: "Submit a ticket to the support team",
      icon: ChatCircleDots,
      iconBg: "rgba(245,158,11,0.18)",
      iconColor: "#f59e0b",
      panel: "support",
    },
    {
      id: "feedback",
      label: "Send Feedback",
      description: "Share ideas, report bugs, or say thanks",
      icon: PaperPlaneTilt,
      iconBg: "rgba(239,68,68,0.18)",
      iconColor: "#ef4444",
      panel: "feedback",
    },
    {
      id: "shortcuts",
      label: "Keyboard Shortcuts",
      description: "Shortcuts to navigate faster",
      icon: Command,
      iconBg: "rgba(255,255,255,0.10)",
      iconColor: "rgba(255,255,255,0.55)",
      panel: "shortcuts",
    },
  ];

  const panelVariants = {
    enter: (d: number) => ({ x: d * 32, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d * -32, opacity: 0 }),
  };

  const panelTransition = {
    type: "spring" as const,
    damping: 30,
    stiffness: 300,
    mass: 0.8,
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={close}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              zIndex: 200,
            }}
            aria-hidden
          />

          {/* Modal panel */}
          <motion.div
            role="dialog"
            aria-label="Help and Support"
            aria-modal="true"
            initial={{ scale: 0.93, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: -10 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "420px",
              maxWidth: "calc(100vw - 32px)",
              maxHeight: "80vh",
              overflow: "hidden",
              background: "rgba(14,26,45,0.82)",
              backdropFilter: "blur(28px) saturate(180%)",
              WebkitBackdropFilter: "blur(28px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: "20px",
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.04), 0 24px 64px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4)",
              zIndex: 201,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "16px 16px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                flexShrink: 0,
              }}
            >
              {panel !== "root" ? (
                <button
                  type="button"
                  onClick={goBack}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    color: "rgba(255,255,255,0.55)",
                    cursor: "pointer",
                    marginRight: "10px",
                    flexShrink: 0,
                    transition: "background 120ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.10)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  }}
                  aria-label="Go back"
                >
                  <ArrowLeft size={14} weight="bold" />
                </button>
              ) : null}
              <span
                style={{
                  flex: 1,
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.80)",
                  letterSpacing: "-0.01em",
                }}
              >
                {panel === "root"
                  ? "Help & Support"
                  : PANEL_TITLES[panel as Exclude<Panel, "root">]}
              </span>
              <button
                type="button"
                onClick={close}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  color: "rgba(255,255,255,0.40)",
                  cursor: "pointer",
                  transition: "background 120ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.10)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                }}
                aria-label="Close"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            {/* Sliding content area */}
            <div
              style={{
                flex: 1,
                overflow: "hidden",
                position: "relative",
                minHeight: 0,
              }}
            >
              <AnimatePresence
                mode="popLayout"
                custom={direction}
                initial={false}
              >
                {panel === "root" ? (
                  <motion.div
                    key="root"
                    custom={direction}
                    variants={panelVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={panelTransition}
                    style={{ overflow: "hidden auto", maxHeight: "calc(80vh - 60px)" }}
                  >
                    <div style={{ padding: "8px" }}>
                      {OPTIONS.map((opt, idx) => {
                        const Icon = opt.icon;
                        const isLast = idx === OPTIONS.length - 1;
                        return (
                          <div key={opt.id}>
                            <button
                              type="button"
                              onClick={() => {
                                if (opt.onClick) {
                                  opt.onClick();
                                } else if (opt.panel) {
                                  goTo(opt.panel);
                                }
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                width: "100%",
                                padding: "10px 10px",
                                gap: "12px",
                                background: "transparent",
                                border: "none",
                                borderRadius: "12px",
                                cursor: "pointer",
                                textAlign: "left",
                                transition: "background 120ms ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                  "rgba(255,255,255,0.05)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                              }}
                            >
                              {/* Icon block */}
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: "34px",
                                  height: "34px",
                                  borderRadius: "9px",
                                  background: opt.iconBg,
                                  flexShrink: 0,
                                }}
                              >
                                <Icon
                                  size={17}
                                  weight="duotone"
                                  style={{ color: opt.iconColor }}
                                />
                              </span>

                              {/* Text */}
                              <div
                                style={{
                                  flex: 1,
                                  minWidth: 0,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "1px",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "13.5px",
                                    fontWeight: 600,
                                    color: "#E0EDF8",
                                    lineHeight: 1.3,
                                  }}
                                >
                                  {opt.label}
                                </span>
                                <span
                                  style={{
                                    fontSize: "11.5px",
                                    color: "rgba(255,255,255,0.40)",
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {opt.description}
                                </span>
                              </div>

                              {/* Caret */}
                              <CaretRight
                                size={13}
                                weight="bold"
                                style={{
                                  color: "rgba(255,255,255,0.25)",
                                  flexShrink: 0,
                                }}
                              />
                            </button>
                            {!isLast && (
                              <div
                                style={{
                                  height: "1px",
                                  background: "rgba(255,255,255,0.05)",
                                  margin: "0 10px",
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer hint */}
                    <div
                      style={{
                        padding: "10px 20px 14px",
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.22)",
                        textAlign: "center",
                      }}
                    >
                      Press <kbd style={{ fontFamily: "monospace" }}>?</kbd> to
                      open anytime
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={panel}
                    custom={direction}
                    variants={panelVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={panelTransition}
                    style={{ overflow: "hidden auto", maxHeight: "calc(80vh - 60px)" }}
                  >
                    {panel === "whats-new" && <WhatsNewPanel />}
                    {panel === "shortcuts" && <KeyboardShortcutsPanel />}
                    {panel === "support" && <SupportFormPanel onClose={close} />}
                    {panel === "feedback" && <FeedbackFormPanel onClose={close} />}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1 | grep -E "HelpSupportModal|help-support" | head -20
```

Expected: no errors for these files.

- [ ] **Step 3: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/components/admin/HelpSupportModal.tsx
git commit -m "feat: add HelpSupportModal frosted glass component"
```

---

### Task 5: Add trigger button to AdminSidebarFooter

**Files:**
- Modify: `src/components/admin/AdminSidebarFooter.tsx`

- [ ] **Step 1: Add import and trigger button**

In `src/components/admin/AdminSidebarFooter.tsx`, add `Question` to the imports from `@phosphor-icons/react`:
```tsx
import { GearSix, UserSwitch, Power, Sun, Moon, Monitor, CaretDown, Check, Question } from "@phosphor-icons/react";
```

Between the `{/* Portal — full width */}` `</div>` closing tag and the `{/* Theme dropdown + bare sign out */}` comment, add:

```tsx
{/* Help & Support */}
<div className="px-0.5 pb-0.5 pt-0.5">
  <button
    type="button"
    onClick={() => window.dispatchEvent(new CustomEvent("admin:help-support"))}
    className="flex w-full items-center justify-center gap-[7px] rounded-[10px] py-2 px-1.5 text-[12.5px] font-medium focus-visible:ring-2 focus-visible:ring-white/40"
    style={{
      color: "rgba(255,255,255,0.45)",
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.08)",
      cursor: "pointer",
      fontFamily: "inherit",
      transition: "background 150ms ease, color 150ms ease, border-color 150ms ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "rgba(255,255,255,0.09)";
      e.currentTarget.style.color = "rgba(255,255,255,0.75)";
      e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
      e.currentTarget.style.color = "rgba(255,255,255,0.45)";
      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
    }}
  >
    <Question size={14} weight="regular" className="shrink-0" />
    Help & Support
  </button>
</div>
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1 | grep "AdminSidebarFooter" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/components/admin/AdminSidebarFooter.tsx
git commit -m "feat: add Help & Support trigger button to sidebar footer"
```

---

### Task 6: Mount modal and AI chat trigger in admin layout

**Files:**
- Modify: `src/app/(admin)/admin/layout.tsx`

- [ ] **Step 1: Add imports**

In `src/app/(admin)/admin/layout.tsx`, add these two imports alongside the existing client component imports:
```tsx
import { HelpSupportModal } from "@/components/admin/HelpSupportModal";
import { AdminAIChatTrigger } from "@/components/admin/AdminAIChatTrigger";
```

- [ ] **Step 2: Mount components in the layout JSX**

Find the block at the bottom of the layout JSX that reads:
```tsx
        <CreateModal />
        <CommandPalette />
        <NotificationPopover />
```

Add the two new components immediately after `<NotificationPopover />`:
```tsx
        <HelpSupportModal />
        <AdminAIChatTrigger />
```

- [ ] **Step 3: Verify TypeScript and build**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm build 2>&1 | tail -20
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/app/\(admin\)/admin/layout.tsx
git commit -m "feat: mount HelpSupportModal and AdminAIChatTrigger in admin layout"
```

---

### Task 7: Smoke test the modal in the browser

- [ ] **Step 1: Start dev server**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
doppler run -- next dev -p 4000
```

- [ ] **Step 2: Open browser and verify**

Navigate to `http://localhost:4000/admin`.

Check:
1. Sidebar footer has a "Help & Support" button below the Portal button
2. Clicking it opens the frosted-glass modal centered on screen
3. Backdrop blurs the page behind
4. All 6 options render with correct icons and descriptions
5. "Help Center" clicks close the modal and navigates to `/admin/help`
6. "Ask AI" clicks close the modal and open the AI chat drawer
7. "What's New", "Contact Support", "Send Feedback", "Keyboard Shortcuts" slide to their detail panels
8. Back button returns to root menu with reverse animation
9. Pressing `?` on any admin page opens the modal
10. Pressing `Esc` closes/navigates back
11. Keyboard Shortcuts panel shows all categories and shortcut chips

- [ ] **Step 3: Commit main thread completion note**

```bash
cd /Users/johanannunez/workspace/parcel
git commit --allow-empty -m "chore: main thread complete — ready for parallel sub-agents"
```

---

## Workstream 2: Sub-agent 1 (What's New)

> Start after Task 7 commit. Do not modify `HelpSupportModal.tsx`.

### Task 8: Create changelogs Supabase migration

**Files:**
- Create: `supabase/migrations/20260423_changelogs.sql`

- [ ] **Step 1: Apply migration via Supabase MCP**

Use the `mcp__claude_ai_Supabase__apply_migration` tool with project ID `pwoxwpryummqeqsxdgyc` and name `changelogs`:

```sql
create table changelogs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  version text,
  tag text,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table changelogs enable row level security;

create policy "Service role full access"
  on changelogs
  using (true)
  with check (true);

create index changelogs_published_at_idx on changelogs (published_at desc);
```

- [ ] **Step 2: Save migration file**

Create `apps/web/supabase/migrations/20260423_changelogs.sql` with the same SQL content above.

- [ ] **Step 3: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/supabase/migrations/20260423_changelogs.sql
git commit -m "feat: add changelogs table migration"
```

---

### Task 9: Create changelogs lib

**Files:**
- Create: `src/lib/admin/changelogs.ts`

- [ ] **Step 1: Create the server actions file**

Create `apps/web/src/lib/admin/changelogs.ts`:
```ts
"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export type Changelog = {
  id: string;
  title: string;
  body: string;
  version: string | null;
  tag: string | null;
  published_at: string;
  created_at: string;
};

export async function fetchChangelogs(limit = 20): Promise<Changelog[]> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("changelogs")
    .select("id, title, body, version, tag, published_at, created_at")
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Changelog[];
}

export async function createChangelog(input: {
  title: string;
  body: string;
  version?: string;
  tag?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!input.title.trim() || !input.body.trim()) {
    return { ok: false, error: "Title and body are required." };
  }
  const svc = createServiceClient();
  const { error } = await svc.from("changelogs").insert({
    title: input.title.trim(),
    body: input.body.trim(),
    version: input.version?.trim() || null,
    tag: input.tag?.trim() || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/help");
  return { ok: true };
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1 | grep "changelogs" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/lib/admin/changelogs.ts
git commit -m "feat: add changelogs server actions"
```

---

### Task 10: Build ChangelogTab admin component and wire into /admin/help

**Files:**
- Create: `src/app/(admin)/admin/help/ChangelogTab.tsx`
- Modify: `src/app/(admin)/admin/help/page.tsx`

- [ ] **Step 1: Create ChangelogTab**

Create `apps/web/src/app/(admin)/admin/help/ChangelogTab.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { createChangelog, type Changelog } from "@/lib/admin/changelogs";

const TAG_OPTIONS = ["feature", "fix", "improvement", "breaking"] as const;

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
      // Optimistically prepend
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
      {/* Create form */}
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
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              style={{ ...inputStyle, width: "130px", flex: "none" }}
            >
              <option value="">No tag</option>
              {TAG_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
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

      {/* Entries list */}
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
```

- [ ] **Step 2: Update /admin/help/page.tsx to add Changelog tab**

At the top of `apps/web/src/app/(admin)/admin/help/page.tsx`, add the import:
```tsx
import { ChangelogTab } from "./ChangelogTab";
import { fetchChangelogs } from "@/lib/admin/changelogs";
```

In the `AdminHelpPage` async function, add a changelogs fetch alongside the articles fetch:
```tsx
export default async function AdminHelpPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "articles" } = await searchParams;
  const service = createServiceClient();
  // ... existing articles query ...

  const changelogs = tab === "changelog" ? await fetchChangelogs(50) : [];
```

Replace the existing `return (` block header section to add tabs:
```tsx
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
      <div className="flex flex-col gap-8">
        {/* Tab row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "4px" }}>
            {(["articles", "changelog"] as const).map((t) => (
              <a
                key={t}
                href={`/admin/help?tab=${t}`}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  textDecoration: "none",
                  background: tab === t ? "var(--color-brand)" : "transparent",
                  color: tab === t ? "#fff" : "var(--color-text-secondary)",
                  transition: "background 120ms ease",
                  textTransform: "capitalize",
                }}
              >
                {t === "articles" ? "Articles" : "Changelog"}
              </a>
            ))}
          </div>
          {tab === "articles" && (
            <div className="flex items-center gap-3">
              <Link href="/admin/help/intake" /* existing styles */>New from Alcove</Link>
              <Link href="/admin/help/new" /* existing styles */>New Article</Link>
            </div>
          )}
        </div>

        {tab === "articles" ? (
          <HelpArticleFilter articles={sorted} />
        ) : (
          <ChangelogTab initialEntries={changelogs} />
        )}
      </div>
    </div>
  );
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1 | grep -E "changelog|Changelog" | head -10
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/app/\(admin\)/admin/help/ChangelogTab.tsx apps/web/src/app/\(admin\)/admin/help/page.tsx
git commit -m "feat: add Changelog tab to admin help page"
```

---

### Task 11: Replace WhatsNewPanel stub with full implementation

**Files:**
- Replace: `src/components/admin/help-support/WhatsNewPanel.tsx`

- [ ] **Step 1: Replace the stub**

Overwrite `apps/web/src/components/admin/help-support/WhatsNewPanel.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import type { Changelog } from "@/lib/admin/changelogs";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  feature: { bg: "rgba(2,170,235,0.15)", color: "#02AAEB" },
  fix: { bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
  improvement: { bg: "rgba(16,185,129,0.15)", color: "#10b981" },
  breaking: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" },
};

function TagPill({ tag }: { tag: string | null }) {
  if (!tag) return null;
  const style = TAG_COLORS[tag] ?? { bg: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.55)" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 7px",
        borderRadius: "99px",
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        background: style.bg,
        color: style.color,
        flexShrink: 0,
      }}
    >
      {tag}
    </span>
  );
}

export function WhatsNewPanel() {
  const [entries, setEntries] = useState<Changelog[] | null>(null);

  useEffect(() => {
    fetch("/api/changelogs")
      .then((r) => r.json())
      .then((data: Changelog[]) => setEntries(data))
      .catch(() => setEntries([]));
  }, []);

  if (entries === null) {
    return (
      <div
        style={{
          padding: "40px 20px",
          textAlign: "center",
          color: "rgba(255,255,255,0.25)",
          fontSize: "13px",
        }}
      >
        Loading…
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div
        style={{
          padding: "40px 20px",
          textAlign: "center",
          color: "rgba(255,255,255,0.35)",
          fontSize: "13px",
        }}
      >
        No updates yet.
      </div>
    );
  }

  return (
    <div style={{ padding: "8px 0 16px" }}>
      {entries.map((e, idx) => (
        <div key={e.id}>
          <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {/* Title row */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  flex: 1,
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#E0EDF8",
                  lineHeight: 1.3,
                }}
              >
                {e.title}
              </span>
              {e.version && (
                <span
                  style={{
                    fontSize: "10.5px",
                    fontFamily: "ui-monospace, monospace",
                    color: "rgba(255,255,255,0.35)",
                    flexShrink: 0,
                  }}
                >
                  {e.version}
                </span>
              )}
              <TagPill tag={e.tag} />
            </div>
            {/* Body */}
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                color: "rgba(255,255,255,0.45)",
                lineHeight: 1.6,
              }}
            >
              {e.body}
            </p>
            {/* Date */}
            <span
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.25)",
              }}
            >
              {formatDate(e.published_at)}
            </span>
          </div>
          {idx < entries.length - 1 && (
            <div
              style={{
                height: "1px",
                background: "rgba(255,255,255,0.05)",
                margin: "0 20px",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create the API route `/api/changelogs`**

Create `apps/web/src/app/api/changelogs/route.ts`:
```ts
import { NextResponse } from "next/server";
import { fetchChangelogs } from "@/lib/admin/changelogs";

export async function GET() {
  const entries = await fetchChangelogs(20);
  return NextResponse.json(entries);
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1 | grep "WhatsNew\|changelogs" | head -10
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/components/admin/help-support/WhatsNewPanel.tsx apps/web/src/app/api/changelogs/route.ts
git commit -m "feat: implement WhatsNewPanel with changelogs API"
```

---

## Workstream 3: Sub-agent 2 (Contact Support + Send Feedback)

> Start after Task 7 commit. Do not modify `HelpSupportModal.tsx`.

### Task 12: Apply support_tickets and feedback_submissions migrations

**Files:**
- Create: `supabase/migrations/20260423T2_support_tickets.sql`
- Create: `supabase/migrations/20260423T3_feedback_submissions.sql`

- [ ] **Step 1: Apply support_tickets migration via Supabase MCP**

Use `mcp__claude_ai_Supabase__apply_migration` with project `pwoxwpryummqeqsxdgyc`, name `support_tickets`:

```sql
create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  message text not null,
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'urgent')),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved')),
  created_at timestamptz not null default now()
);

alter table support_tickets enable row level security;

create policy "Service role full access"
  on support_tickets
  using (true)
  with check (true);

create index support_tickets_status_idx on support_tickets (status, created_at desc);
```

- [ ] **Step 2: Apply feedback_submissions migration via Supabase MCP**

Use `mcp__claude_ai_Supabase__apply_migration` with project `pwoxwpryummqeqsxdgyc`, name `feedback_submissions`:

```sql
create table feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  type text not null
    check (type in ('bug', 'idea', 'compliment', 'other')),
  message text not null,
  created_at timestamptz not null default now()
);

alter table feedback_submissions enable row level security;

create policy "Service role full access"
  on feedback_submissions
  using (true)
  with check (true);
```

- [ ] **Step 3: Save migration files**

Create `apps/web/supabase/migrations/20260423T2_support_tickets.sql` and `apps/web/supabase/migrations/20260423T3_feedback_submissions.sql` with the respective SQL above.

- [ ] **Step 4: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/supabase/migrations/20260423T2_support_tickets.sql apps/web/supabase/migrations/20260423T3_feedback_submissions.sql
git commit -m "feat: add support_tickets and feedback_submissions migrations"
```

---

### Task 13: Create support server actions

**Files:**
- Create: `src/lib/admin/support.ts`

- [ ] **Step 1: Create the server actions file**

Create `apps/web/src/lib/admin/support.ts`:
```ts
"use server";

import { createServiceClient } from "@/lib/supabase/service";

async function sendViaResend(args: {
  subject: string;
  html: string;
}): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Parcel Platform <hello@theparcelco.com>",
      to: "jo@johanannunez.com",
      subject: args.subject,
      html: args.html,
    }),
  });
}

export async function submitSupportTicket(input: {
  subject: string;
  message: string;
  priority: "low" | "normal" | "urgent";
}): Promise<{ ok: boolean; error?: string }> {
  if (!input.subject.trim() || !input.message.trim()) {
    return { ok: false, error: "Subject and message are required." };
  }
  if (!["low", "normal", "urgent"].includes(input.priority)) {
    return { ok: false, error: "Invalid priority." };
  }

  const svc = createServiceClient();
  const { error } = await svc.from("support_tickets").insert({
    subject: input.subject.trim(),
    message: input.message.trim(),
    priority: input.priority,
  });
  if (error) return { ok: false, error: error.message };

  const priorityLabel = { low: "Low", normal: "Normal", urgent: "URGENT" }[input.priority];
  await sendViaResend({
    subject: `[${priorityLabel}] Support: ${input.subject.trim()}`,
    html: `<p><strong>Priority:</strong> ${priorityLabel}</p><p><strong>Subject:</strong> ${input.subject}</p><p><strong>Message:</strong></p><p style="white-space:pre-wrap">${input.message}</p>`,
  });

  return { ok: true };
}

export async function submitFeedback(input: {
  type: "bug" | "idea" | "compliment" | "other";
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!input.message.trim()) {
    return { ok: false, error: "Message is required." };
  }
  if (!["bug", "idea", "compliment", "other"].includes(input.type)) {
    return { ok: false, error: "Invalid feedback type." };
  }

  const svc = createServiceClient();
  const { error } = await svc.from("feedback_submissions").insert({
    type: input.type,
    message: input.message.trim(),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1 | grep "support" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/lib/admin/support.ts
git commit -m "feat: add submitSupportTicket and submitFeedback server actions"
```

---

### Task 14: Replace SupportFormPanel stub with full implementation

**Files:**
- Replace: `src/components/admin/help-support/SupportFormPanel.tsx`

- [ ] **Step 1: Replace the stub**

Overwrite `apps/web/src/components/admin/help-support/SupportFormPanel.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { submitSupportTicket } from "@/lib/admin/support";

type Priority = "low" | "normal" | "urgent";

export function SupportFormPanel({ onClose }: { onClose: () => void }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitSupportTicket({ subject, message, priority });
      if (!result.ok) {
        setError(result.error ?? "Failed to submit ticket.");
        return;
      }
      setSubmitted(true);
    });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "9px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    fontSize: "13px",
    color: "#E0EDF8",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition: "border-color 120ms ease",
  };

  if (submitted) {
    return (
      <div
        style={{
          padding: "48px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          textAlign: "center",
        }}
      >
        <CheckCircle size={36} weight="duotone" style={{ color: "#10b981" }} />
        <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#E0EDF8" }}>
          Ticket submitted
        </p>
        <p style={{ margin: 0, fontSize: "12.5px", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
          We got your message and will follow up shortly.
        </p>
        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: "8px",
            padding: "8px 20px",
            borderRadius: "9px",
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.07)",
            color: "rgba(255,255,255,0.60)",
            fontSize: "12.5px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: "12px" }}
    >
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject"
        required
        style={inputStyle}
        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(2,170,235,0.50)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
      />

      {/* Priority picker */}
      <div style={{ display: "flex", gap: "6px" }}>
        {(["low", "normal", "urgent"] as Priority[]).map((p) => {
          const colors: Record<Priority, { active: string; label: string }> = {
            low: { active: "rgba(16,185,129,0.20)", label: "Low" },
            normal: { active: "rgba(2,170,235,0.20)", label: "Normal" },
            urgent: { active: "rgba(239,68,68,0.20)", label: "Urgent" },
          };
          const isActive = priority === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              style={{
                flex: 1,
                padding: "7px 0",
                borderRadius: "8px",
                border: `1px solid ${isActive ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)"}`,
                background: isActive ? colors[p].active : "rgba(255,255,255,0.04)",
                color: isActive ? "#E0EDF8" : "rgba(255,255,255,0.35)",
                fontSize: "12px",
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 120ms ease",
              }}
            >
              {colors[p].label}
            </button>
          );
        })}
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Describe the issue or question…"
        required
        rows={5}
        style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(2,170,235,0.50)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
      />

      {error && (
        <p style={{ margin: 0, fontSize: "12px", color: "#f87171" }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        style={{
          padding: "10px 0",
          borderRadius: "10px",
          border: "none",
          background: "linear-gradient(135deg, rgba(245,158,11,0.90), rgba(234,88,12,0.90))",
          color: "#fff",
          fontSize: "13px",
          fontWeight: 600,
          cursor: pending ? "wait" : "pointer",
          opacity: pending ? 0.6 : 1,
          fontFamily: "inherit",
          boxShadow: "0 2px 10px rgba(245,158,11,0.25)",
          transition: "opacity 120ms ease",
        }}
      >
        {pending ? "Sending…" : "Send ticket"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1 | grep "SupportFormPanel\|support" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/components/admin/help-support/SupportFormPanel.tsx
git commit -m "feat: implement SupportFormPanel with ticket submission"
```

---

### Task 15: Replace FeedbackFormPanel stub with full implementation

**Files:**
- Replace: `src/components/admin/help-support/FeedbackFormPanel.tsx`

- [ ] **Step 1: Replace the stub**

Overwrite `apps/web/src/components/admin/help-support/FeedbackFormPanel.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { CheckCircle, Bug, Lightbulb, Heart, ChatText } from "@phosphor-icons/react";
import { submitFeedback } from "@/lib/admin/support";

type FeedbackType = "bug" | "idea" | "compliment" | "other";

const TYPE_OPTIONS: {
  value: FeedbackType;
  label: string;
  icon: React.ComponentType<{ size?: number; weight?: string; style?: React.CSSProperties }>;
  color: string;
  bg: string;
}[] = [
  { value: "bug", label: "Bug", icon: Bug, color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  { value: "idea", label: "Idea", icon: Lightbulb, color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  { value: "compliment", label: "Thanks", icon: Heart, color: "#ec4899", bg: "rgba(236,72,153,0.15)" },
  { value: "other", label: "Other", icon: ChatText, color: "rgba(255,255,255,0.55)", bg: "rgba(255,255,255,0.08)" },
];

export function FeedbackFormPanel({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<FeedbackType>("idea");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitFeedback({ type, message });
      if (!result.ok) {
        setError(result.error ?? "Failed to submit.");
        return;
      }
      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <div
        style={{
          padding: "48px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          textAlign: "center",
        }}
      >
        <CheckCircle size={36} weight="duotone" style={{ color: "#10b981" }} />
        <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#E0EDF8" }}>
          Thanks for the feedback
        </p>
        <p style={{ margin: 0, fontSize: "12.5px", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
          It goes directly into the improvement queue.
        </p>
        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: "8px",
            padding: "8px 20px",
            borderRadius: "9px",
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.07)",
            color: "rgba(255,255,255,0.60)",
            fontSize: "12.5px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: "14px" }}
    >
      {/* Type selector */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
        {TYPE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = type === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 12px",
                borderRadius: "9px",
                border: `1px solid ${isActive ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.08)"}`,
                background: isActive ? opt.bg : "rgba(255,255,255,0.04)",
                color: isActive ? "#E0EDF8" : "rgba(255,255,255,0.35)",
                fontSize: "12.5px",
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 120ms ease",
                textAlign: "left",
              }}
            >
              <Icon size={15} weight="duotone" style={{ color: isActive ? opt.color : "rgba(255,255,255,0.30)", flexShrink: 0 }} />
              {opt.label}
            </button>
          );
        })}
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="What's on your mind?"
        required
        rows={5}
        style={{
          width: "100%",
          padding: "9px 12px",
          borderRadius: "9px",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.06)",
          fontSize: "13px",
          color: "#E0EDF8",
          outline: "none",
          fontFamily: "inherit",
          resize: "vertical",
          lineHeight: 1.6,
          boxSizing: "border-box",
          transition: "border-color 120ms ease",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(2,170,235,0.50)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
      />

      {error && (
        <p style={{ margin: 0, fontSize: "12px", color: "#f87171" }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        style={{
          padding: "10px 0",
          borderRadius: "10px",
          border: "none",
          background: "linear-gradient(135deg, rgba(236,72,153,0.85), rgba(239,68,68,0.85))",
          color: "#fff",
          fontSize: "13px",
          fontWeight: 600,
          cursor: pending ? "wait" : "pointer",
          opacity: pending ? 0.6 : 1,
          fontFamily: "inherit",
          boxShadow: "0 2px 10px rgba(236,72,153,0.20)",
          transition: "opacity 120ms ease",
        }}
      >
        {pending ? "Sending…" : "Send feedback"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1 | grep "FeedbackFormPanel\|feedback" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/components/admin/help-support/FeedbackFormPanel.tsx
git commit -m "feat: implement FeedbackFormPanel with feedback submission"
```

---

## Final Integration Check (All Workstreams)

After all three workstreams are merged:

- [ ] **Build verification**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1 | head -20
pnpm build 2>&1 | tail -20
```

Expected: zero TypeScript errors, build succeeds.

- [ ] **Full smoke test at port 4000**

1. Sidebar footer shows "Help & Support" button
2. Modal opens with spring animation on click and on `?` keypress
3. Help Center navigates to `/admin/help`
4. Ask AI opens the AI chat drawer
5. What's New shows changelog entries (or "No updates yet" if none)
6. Contact Support form submits, shows success state, email arrives at `jo@johanannunez.com`
7. Send Feedback form submits with type selector, shows success state
8. Keyboard Shortcuts renders all categories and kbd chips
9. Back navigation animates correctly in reverse direction
10. Pressing `Esc` on a detail panel goes back; on root panel closes

- [ ] **Final commit**

```bash
cd /Users/johanannunez/workspace/parcel
git commit --allow-empty -m "feat: Help & Support modal fully implemented"
```
