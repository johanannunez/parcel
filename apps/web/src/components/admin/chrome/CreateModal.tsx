"use client";

import { useEffect, useState } from "react";
import { useCreateScope } from "./CreateScopeContext";
import { ScopePicker } from "./ScopePicker";
import type { CreateKind } from "./CreateMenu";
import { TaskForm } from "./create-forms/TaskForm";
import { ProjectForm } from "./create-forms/ProjectForm";
import { ContactForm } from "./create-forms/ContactForm";
import styles from "./CreateModal.module.css";

const KIND_TITLES: Record<CreateKind, string> = {
  task: "New task",
  email: "New email",
  meeting: "New meeting",
  note: "New note",
  property: "New property",
  invoice: "New invoice",
  owner: "New owner",
  contact: "New contact",
  project: "New project",
};

// Kinds that are always global (no scope chip).
const GLOBAL_KINDS = new Set<CreateKind>(["owner", "contact", "project"]);

export function CreateModal() {
  const { target, setTarget } = useCreateScope();
  const [kind, setKind] = useState<CreateKind | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const openHandler = (e: Event) => {
      const detail = (e as CustomEvent<{ kind: CreateKind }>).detail;
      if (detail?.kind) {
        setKind(detail.kind);
        setShowPicker(false);
      }
    };
    window.addEventListener("admin:create-open", openHandler);
    return () => window.removeEventListener("admin:create-open", openHandler);
  }, []);

  useEffect(() => {
    if (!kind) return;
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showPicker) {
          setShowPicker(false);
        } else {
          setKind(null);
        }
      }
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [kind, showPicker]);

  if (!kind) return null;

  const isGlobal = GLOBAL_KINDS.has(kind);
  const effectiveScope = isGlobal ? null : target;

  return (
    <div
      className={styles.scrim}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) setKind(null);
      }}
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={KIND_TITLES[kind]}
      >
        <div className={styles.head}>
          <h3 className={styles.title}>{KIND_TITLES[kind]}</h3>
          <button
            type="button"
            className={styles.close}
            aria-label="Close"
            onClick={() => setKind(null)}
          >
            ×
          </button>
        </div>

        <div className={styles.body}>
          {!isGlobal ? (
            <div className={styles.scopeRow}>
              <div className={styles.scopeLabel}>For</div>
              {effectiveScope ? (
                <button
                  type="button"
                  className={styles.chip}
                  onClick={() => setShowPicker((v) => !v)}
                >
                  <span className={styles.chipAvatar}>{effectiveScope.initials}</span>
                  <span>{effectiveScope.displayName}</span>
                  <span
                    className={styles.chipX}
                    role="button"
                    aria-label="Clear target"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTarget(null);
                    }}
                  >
                    ×
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  className={`${styles.chip} ${styles.chipEmpty}`}
                  onClick={() => setShowPicker((v) => !v)}
                >
                  <span>+ Add target (optional)</span>
                </button>
              )}
              <span className={styles.hint}>Click chip to change</span>
            </div>
          ) : null}

          {showPicker ? (
            <ScopePicker
              anchorStyle={{ top: 48, left: 74 }}
              onPick={(t) => {
                setTarget(t);
                setShowPicker(false);
              }}
            />
          ) : null}

          {kind === "task" ? (
            <TaskForm onClose={() => setKind(null)} />
          ) : kind === "project" ? (
            <ProjectForm onClose={() => setKind(null)} />
          ) : kind === "contact" ? (
            <ContactForm onClose={() => setKind(null)} />
          ) : (
            <div className={styles.placeholder}>
              <strong>{KIND_TITLES[kind]}</strong>
              Form coming in the next plan — this chrome is ready. When the form for &ldquo;{kind}&rdquo;
              ships, it will open here with the scope chip already filled in.
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <span>
            <kbd>Esc</kbd>to close
          </span>
          {kind !== "task" && kind !== "project" && kind !== "contact" ? (
            <div className={styles.footerActions}>
              <button
                type="button"
                className={styles.btn}
                onClick={() => setKind(null)}
              >
                Done
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
