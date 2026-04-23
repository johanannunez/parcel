'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { DotsThree } from '@phosphor-icons/react';
import type { ContactSavedView } from '@/lib/admin/contact-types';
import { deleteSavedView, renameSavedView } from './actions';
import { useContactsFilters } from './ContactsFiltersProvider';
import styles from './SavedViewsTabs.module.css';

export function SavedViewsTabs({ views }: { views: ContactSavedView[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { hiddenViews } = useContactsFilters();
  const activeViewId = searchParams?.get('view_id') ?? null;
  const activeKey = searchParams?.get('view') ?? 'lead-pipeline';
  const mode = searchParams?.get('mode');

  const basePath = pathname?.startsWith('/admin/owners')
    ? '/admin/owners'
    : pathname?.startsWith('/admin/leads')
    ? '/admin/leads'
    : '/admin/contacts';

  const visibleViews = views.filter(
    (v) => v.isPersonal || !hiddenViews.includes(v.key),
  );

  function hrefForShared(key: string): string {
    const params = new URLSearchParams();
    params.set('view', key);
    if (mode) params.set('mode', mode);
    return `${basePath}?${params.toString()}`;
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
    return `${basePath}?${params.toString()}`;
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

type MenuState = 'idle' | 'renaming' | 'confirming';

function PersonalMenu({ view }: { view: ContactSavedView }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [menuState, setMenuState] = useState<MenuState>('idle');
  const [name, setName] = useState(view.name);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  function closeMenu() {
    setOpen(false);
    setMenuState('idle');
    setError(null);
  }

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        !btnRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) {
        closeMenu();
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  function openMenu() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
        left: 'auto',
      });
    }
    setOpen((v) => !v);
    setMenuState('idle');
    setError(null);
  }

  function onRename() {
    setName(view.name);
    setMenuState('renaming');
    setError(null);
  }

  function submitRename(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Name is required.'); return; }
    if (trimmed === view.name) { closeMenu(); return; }
    startTransition(async () => {
      const result = await renameSavedView({ id: view.id, name: trimmed });
      if (!result.ok) { setError(result.error); return; }
      closeMenu();
      router.refresh();
    });
  }

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteSavedView({ id: view.id });
      if (!result.ok) {
        setMenuState('idle');
        setError(result.error);
        return;
      }
      closeMenu();
      router.refresh();
    });
  }

  const menuContent = open
    ? createPortal(
        <div className={styles.menu} style={menuStyle} ref={menuRef} role="menu">
          {menuState === 'renaming' ? (
            <form className={styles.renameForm} onSubmit={submitRename}>
              <input
                autoFocus
                type="text"
                value={name}
                maxLength={60}
                onChange={(e) => { setName(e.target.value); if (error) setError(null); }}
                onKeyDown={(e) => { if (e.key === 'Escape') closeMenu(); }}
                className={styles.renameInput}
                placeholder="View name"
              />
              {error ? <div className={styles.renameError}>{error}</div> : null}
              <div className={styles.renameActions}>
                <button type="button" className={styles.renameCancel} onClick={closeMenu} disabled={pending}>
                  Cancel
                </button>
                <button type="submit" className={styles.renameSubmit} disabled={pending || !name.trim()}>
                  {pending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          ) : menuState === 'confirming' ? (
            <div className={styles.confirmState}>
              <p className={styles.confirmText}>
                Delete <strong>{view.name}</strong>?
              </p>
              <p className={styles.confirmSub}>This cannot be undone.</p>
              <div className={styles.confirmActions}>
                <button type="button" className={styles.confirmCancel} onClick={() => { setMenuState('idle'); setError(null); }} disabled={pending}>
                  Cancel
                </button>
                <button type="button" className={styles.confirmDelete} onClick={confirmDelete} disabled={pending}>
                  {pending ? 'Deleting…' : 'Delete'}
                </button>
              </div>
              {error ? <div className={styles.renameError} style={{ marginTop: 6 }}>{error}</div> : null}
            </div>
          ) : (
            <>
              {error ? <div className={styles.inlineError}>{error}</div> : null}
              <button type="button" className={styles.menuItem} onClick={onRename} disabled={pending}>
                Rename
              </button>
              <button type="button" className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={() => { setMenuState('confirming'); setError(null); }} disabled={pending}>
                Delete
              </button>
            </>
          )}
        </div>,
        document.body,
      )
    : null;

  return (
    <div className={styles.menuWrap}>
      <button
        ref={btnRef}
        type="button"
        className={`${styles.menuBtn} ${open ? styles.menuBtnOpen : ''}`}
        aria-label={`More options for ${view.name}`}
        aria-expanded={open}
        onClick={openMenu}
        onMouseDown={(e) => e.preventDefault()}
      >
        <DotsThree size={16} weight="bold" />
      </button>
      {menuContent}
    </div>
  );
}
