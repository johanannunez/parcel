"use client";

import { useCallback, useEffect, useState } from "react";
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
  type Icon,
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
  icon: Icon;
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

  useEffect(() => {
    function handleOpen() {
      setPanel("root");
      setDirection(1);
      setOpen(true);
    }
    window.addEventListener("admin:help-support", handleOpen);
    return () => window.removeEventListener("admin:help-support", handleOpen);
  }, []);

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

          {/* Centering wrapper — keeps motion.div free of translate(-50%,-50%) so spring transforms compose cleanly */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 201,
              pointerEvents: "none",
            }}
          >
          <motion.div
            role="dialog"
            aria-label="Help and Support"
            aria-modal="true"
            initial={{ scale: 0.93, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: -10 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            style={{
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
              pointerEvents: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
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
                                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                              }}
                            >
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
                    <div
                      style={{
                        padding: "10px 20px 14px",
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.22)",
                        textAlign: "center",
                      }}
                    >
                      Press <kbd style={{ fontFamily: "monospace" }}>?</kbd> to open anytime
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
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
