'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { DotsThree } from '@phosphor-icons/react';
import type { ContactSavedView } from '@/lib/admin/contact-types';
import { deleteSavedView, renameSavedView } from './actions';
import { useContactsFilters } from './ContactsFiltersProvider';
import styles from './SavedViewsTabs.module.css';

export function SavedViewsTabs({ views }: { views: ContactSavedView[] }) {
  const searchParams = useSearchParams();
  const { hiddenViews } = useContactsFilters();
  const activeViewId = searchParams?.get('view_id') ?? null;
  const activeKey = searchParams?.get('view') ?? 'lead-pipeline';
  const mode = searchParams?.get('mode');

  const visibleViews = views.filter(
    (v) => v.isPersonal || !hiddenViews.includes(v.key),
  );

  function hrefForShared(key: string): string {
    const params = new URLSearchParams();
    params.set('view', key);
    if (mode) params.set('mode', mode);
    return `/admin/contacts?${params.toString()}`;
  }

  function hrefForPersonal(view: ContactSavedView): string {
    const params = new URLSearchParams();
    const sp = view.searchParams ?? {};
    if (sp.view) params.set('view', sp.view);
    if (sp.mode) params.set('mode', sp.mode);
    if (sp.source) params.set('source', sp.source);
    if (sp.assignee) params.set('assignee', sp.assignee);
    if (sp.q) params.set('q', sp.q);
    params.set('view_id', view.id);
    return `/admin/contacts?${params.toString()}`;
  }

  return (
    <nav className={styles.row} aria-label="Saved views">
      {visibleViews.map((view) => {
        const isPersonal = view.isPersonal;
        const isActive = isPersonal
          ? activeViewId === view.id
          : activeViewId === null && view.key === activeKey;
        const href = isPersonal ? hrefForPersonal(view) : hrefForShared(view.key);

        return (
          <TabItem
            key={view.id}
            view={view}
            href={href}
            isActive={isActive}
          />
        );
      })}
    </nav>
  );
}

function TabItem({
  view,
  href,
  isActive,
}: {
  view: ContactSavedView;
  href: string;
  isActive: boolean;
}) {
  return (
    <div className={styles.tabWrap}>
      <Link
        href={href}
        aria-current={isActive ? 'page' : undefined}
        className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
        onMouseDown={(e) => e.preventDefault()}
      >
        <span>{view.name}</span>
        {view.count !== null ? (
          <span className={`${styles.count} ${isActive ? styles.countActive : ''}`}>
            {view.count}
          </span>
        ) : null}
      </Link>
      {view.isPersonal ? <PersonalMenu view={view} /> : null}
    </div>
  );
}

function PersonalMenu({ view }: { view: ContactSavedView }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(view.name);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setRenaming(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  function onRename() {
    setName(view.name);
    setRenaming(true);
    setError(null);
  }

  function submitRename(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name required.');
      return;
    }
    if (trimmed === view.name) {
      setOpen(false);
      setRenaming(false);
      return;
    }
    startTransition(async () => {
      const result = await renameSavedView({ id: view.id, name: trimmed });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setRenaming(false);
      router.refresh();
    });
  }

  function onDelete() {
    if (!confirm(`Delete the "${view.name}" view? This can't be undone.`)) return;
    startTransition(async () => {
      const result = await deleteSavedView({ id: view.id });
      if (!result.ok) {
        alert(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className={styles.menuWrap} ref={wrapRef}>
      <button
        type="button"
        className={`${styles.menuBtn} ${open ? styles.menuBtnOpen : ''}`}
        aria-label={`More options for ${view.name}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onMouseDown={(e) => e.preventDefault()}
      >
        <DotsThree size={16} weight="bold" />
      </button>
      {open ? (
        <div className={styles.menu} role="menu">
          {renaming ? (
            <form className={styles.renameForm} onSubmit={submitRename}>
              <input
                autoFocus
                type="text"
                value={name}
                maxLength={60}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setRenaming(false);
                    setOpen(false);
                  }
                }}
                className={styles.renameInput}
                placeholder="View name"
              />
              {error ? <div className={styles.renameError}>{error}</div> : null}
              <div className={styles.renameActions}>
                <button
                  type="button"
                  className={styles.renameCancel}
                  onClick={() => {
                    setRenaming(false);
                    setOpen(false);
                  }}
                  disabled={pending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.renameSubmit}
                  disabled={pending || !name.trim()}
                >
                  {pending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          ) : (
            <>
              <button
                type="button"
                className={styles.menuItem}
                onClick={onRename}
                disabled={pending}
              >
                Rename
              </button>
              <button
                type="button"
                className={`${styles.menuItem} ${styles.menuItemDanger}`}
                onClick={onDelete}
                disabled={pending}
              >
                Delete
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
