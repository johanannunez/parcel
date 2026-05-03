"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CaretDown } from "@phosphor-icons/react";
import type { LifecycleStage } from "@/lib/admin/contact-types";
import { updateWorkspaceContactFields } from "./workspace-person-actions";
import styles from "./StagePopover.module.css";

type StageOption = { key: LifecycleStage; label: string; variant: string };

const STAGE_GROUPS: { label: string; options: StageOption[] }[] = [
  {
    label: "Pipeline",
    options: [
      { key: "lead_new",      label: "New Lead",      variant: "blue"   },
      { key: "qualified",     label: "Qualified",     variant: "blue"   },
      { key: "in_discussion", label: "In Discussion", variant: "violet" },
      { key: "contract_sent", label: "Contract Sent", variant: "violet" },
    ],
  },
  {
    label: "Active",
    options: [
      { key: "onboarding",   label: "Onboarding",   variant: "amber" },
      { key: "active_owner", label: "Active Owner",  variant: "green" },
    ],
  },
  {
    label: "Archived",
    options: [
      { key: "offboarding", label: "Offboarding", variant: "orange" },
      { key: "lead_cold",   label: "Cold Lead",   variant: "gray"   },
      { key: "paused",      label: "Paused",      variant: "gray"   },
      { key: "churned",     label: "Churned",     variant: "gray"   },
    ],
  },
];

function findOption(stage: LifecycleStage): StageOption {
  for (const group of STAGE_GROUPS) {
    const found = group.options.find((o) => o.key === stage);
    if (found) return found;
  }
  return { key: stage, label: stage, variant: "gray" };
}

export function StagePopover({
  contactId,
  stage,
  onSaved,
}: {
  contactId: string;
  stage: LifecycleStage;
  onSaved?: (stage: LifecycleStage) => void;
}) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(stage);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close]);

  const select = async (option: StageOption) => {
    if (option.key === current || saving) return;
    setSaving(true);
    close();
    const prev = current;
    setCurrent(option.key);
    const result = await updateWorkspaceContactFields(contactId, { lifecycleStage: option.key });
    if (!result.ok) {
      setCurrent(prev);
    } else {
      onSaved?.(option.key);
    }
    setSaving(false);
  };

  const active = findOption(current);

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        className={`${styles.trigger} ${styles[`trigger_${active.variant}`]}`}
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        type="button"
      >
        <span>{active.label}</span>
        <CaretDown size={11} weight="bold" className={`${styles.caret} ${open ? styles.caretOpen : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
          >
            {STAGE_GROUPS.map((group) => (
              <div key={group.label} className={styles.group}>
                <div className={styles.groupLabel}>{group.label}</div>
                <div className={styles.groupPills}>
                  {group.options.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      className={`${styles.pill} ${styles[option.variant]} ${current === option.key ? styles.pillActive : ""}`}
                      onMouseDown={() => select(option)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
