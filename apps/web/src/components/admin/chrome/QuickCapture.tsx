'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { createTask } from '@/lib/admin/task-actions';
import styles from './QuickCapture.module.css';

export function QuickCapture() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  useEffect(() => {
    if (open) {
      setValue('');
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  const submit = () => {
    const title = value.trim();
    if (!title) { setOpen(false); return; }
    startTransition(async () => {
      await createTask({ title });
      setOpen(false);
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            role="dialog"
            aria-label="Quick capture"
            aria-modal="true"
          >
            <input
              ref={inputRef}
              className={styles.input}
              placeholder="Add a task..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); submit(); }
                if (e.key === 'Escape') setOpen(false);
              }}
              disabled={isPending}
            />
            <div className={styles.hint}>
              <kbd>Return</kbd> save to Inbox
              <span className={styles.hintSep}>&nbsp;·&nbsp;</span>
              <kbd>Esc</kbd> cancel
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
