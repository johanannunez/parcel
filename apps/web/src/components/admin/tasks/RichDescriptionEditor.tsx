'use client';

import { useCallback, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import styles from './RichDescriptionEditor.module.css';

// ── Phosphor icon primitives (inline SVGs for zero-dep toolbar) ────────────
// We keep these minimal — just paths to avoid importing the full icon library
// for something so embedded.

function IconBold() {
  return (
    <svg width="12" height="12" viewBox="0 0 256 256" fill="currentColor">
      <path d="M176,121.06A56,56,0,0,0,112,32H72a8,8,0,0,0-8,8V200a8,8,0,0,0,8,8h96a56,56,0,0,0,8-111.94ZM80,48h32a40,40,0,0,1,0,80H80Zm88,144H80V144h88a40,40,0,0,1,0,80Z"/>
    </svg>
  );
}
function IconItalic() {
  return (
    <svg width="12" height="12" viewBox="0 0 256 256" fill="currentColor">
      <path d="M208,56a8,8,0,0,1-8,8H173.13L122.87,192H144a8,8,0,0,1,0,16H56a8,8,0,0,1,0-16H82.87L133.13,64H112a8,8,0,0,1,0-16Z"/>
    </svg>
  );
}
function IconUnderline() {
  return (
    <svg width="12" height="12" viewBox="0 0 256 256" fill="currentColor">
      <path d="M200,224a8,8,0,0,1-8,8H64a8,8,0,0,1,0-16H192A8,8,0,0,1,200,224Zm-72-24a72.08,72.08,0,0,0,72-72V56a8,8,0,0,0-16,0v72a56,56,0,0,1-112,0V56a8,8,0,0,0-16,0v72A72.08,72.08,0,0,0,128,200Z"/>
    </svg>
  );
}
function IconStrike() {
  return (
    <svg width="12" height="12" viewBox="0 0 256 256" fill="currentColor">
      <path d="M232,128a8,8,0,0,1-8,8H171.58c8.23,8.84,12.42,19,12.42,30.2,0,26.08-24.29,47.8-56,47.8-31.41,0-60.55-17.08-71.65-41.53a8,8,0,1,1,14.5-6.94C77.82,182.49,99.6,198,128,198c21.5,0,40-12.73,40-31.8,0-13.62-10.84-24.85-32.81-32.2H32a8,8,0,0,1,0-16H232A8,8,0,0,1,232,128ZM79.41,112c-.17-.2-.34-.39-.52-.58C72.19,104,68,94.56,68,84.2,68,58.12,92.29,36.4,124,36.4c25.94,0,48.77,13.39,58.89,34.07a8,8,0,0,1-14.38,7.06C161.3,62.12,143.74,52.4,124,52.4c-21.5,0-40,12.73-40,31.8a33.31,33.31,0,0,0,8,21.12,8,8,0,0,1-.59.68Z"/>
    </svg>
  );
}
function IconCode() {
  return (
    <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor">
      <path d="M69.12,94.15,28.5,128l40.62,33.85a8,8,0,1,1-10.24,12.29l-48-40a8,8,0,0,1,0-12.29l48-40a8,8,0,0,1,10.24,12.3Zm176,27.71-48-40a8,8,0,1,0-10.24,12.3L227.5,128l-40.62,33.85a8,8,0,1,0,10.24,12.29l48-40a8,8,0,0,0,0-12.29ZM162.73,32.48a8,8,0,0,0-10.25,4.79l-64,176a8,8,0,0,0,15,5.46l64-176A8,8,0,0,0,162.73,32.48Z"/>
    </svg>
  );
}
function IconH1() {
  return <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '-0.5px' }}>H1</span>;
}
function IconH2() {
  return <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '-0.5px' }}>H2</span>;
}
function IconParagraph() {
  return <span style={{ fontSize: 11, fontWeight: 500 }}>¶</span>;
}
function IconBullet() {
  return (
    <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor">
      <path d="M80,64a8,8,0,0,1,8-8H216a8,8,0,0,1,0,16H88A8,8,0,0,1,80,64Zm136,56H88a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Zm0,64H88a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16ZM44,52A16,16,0,1,0,60,68,16,16,0,0,0,44,52Zm0,64a16,16,0,1,0,16,16A16,16,0,0,0,44,116Zm0,64a16,16,0,1,0,16,16A16,16,0,0,0,44,180Z"/>
    </svg>
  );
}
function IconOrdered() {
  return (
    <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor">
      <path d="M224,128a8,8,0,0,1-8,8H104a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM104,72H216a8,8,0,0,0,0-16H104a8,8,0,0,0,0,16ZM216,184H104a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16ZM41.19,40a8,8,0,0,0-8,8H32a8,8,0,0,0,0,16h8v36H32a8,8,0,0,0,0,16H56a8,8,0,0,0,0-16H48V48A8,8,0,0,0,41.19,40ZM56,180H44l10.27-12.32A20,20,0,1,0,20.57,150a8,8,0,0,0,15.12,5.26A4,4,0,1,1,40,160a8,8,0,0,0-6,13.09L48,190.26V192H32a8,8,0,0,0,0,16H56a8,8,0,0,0,8-8V188A8,8,0,0,0,56,180Z"/>
    </svg>
  );
}
function IconQuote() {
  return (
    <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor">
      <path d="M116,72v88a48.05,48.05,0,0,1-48,48,8,8,0,0,1,0-16,32,32,0,0,0,32-32v-8H40a16,16,0,0,1-16-16V72A16,16,0,0,1,40,56h60A16,16,0,0,1,116,72Zm96-16H152a16,16,0,0,0-16,16v64a16,16,0,0,0,16,16h60v8a32,32,0,0,1-32,32,8,8,0,0,0,0,16,48.05,48.05,0,0,0,48-48V72A16,16,0,0,0,212,56Z"/>
    </svg>
  );
}
function IconCodeBlock() {
  return (
    <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor">
      <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,56H216V80H40ZM216,200H40V96H216V200ZM93.66,133.66l-24,24a8,8,0,0,1-11.32-11.32L73.37,136,58.34,121a8,8,0,0,1,11.32-11.31l24,24A8,8,0,0,1,93.66,133.66ZM192,168a8,8,0,0,1-8,8H120a8,8,0,0,1,0-16h64A8,8,0,0,1,192,168Z"/>
    </svg>
  );
}
function IconAlignLeft() {
  return (
    <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor">
      <path d="M32,64a8,8,0,0,1,8-8H216a8,8,0,0,1,0,16H40A8,8,0,0,1,32,64Zm8,48H168a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16Zm176,24H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Zm-48,40H40a8,8,0,0,0,0,16H168a8,8,0,0,0,0-16Z"/>
    </svg>
  );
}
function IconAlignCenter() {
  return (
    <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor">
      <path d="M32,64a8,8,0,0,1,8-8H216a8,8,0,0,1,0,16H40A8,8,0,0,1,32,64Zm48,40a8,8,0,0,1,8-8H168a8,8,0,0,1,0,16H88A8,8,0,0,1,80,104Zm128,24H48a8,8,0,0,0,0,16H208a8,8,0,0,0,0-16Zm-40,40H88a8,8,0,0,0,0,16h80a8,8,0,0,0,0-16Z"/>
    </svg>
  );
}
function IconAlignRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor">
      <path d="M32,64a8,8,0,0,1,8-8H216a8,8,0,0,1,0,16H40A8,8,0,0,1,32,64Zm184,40a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16H208A8,8,0,0,1,216,104ZM32,136a8,8,0,0,1,8-8H216a8,8,0,0,1,0,16H40A8,8,0,0,1,32,136Zm184,40a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16H208A8,8,0,0,1,216,176Z"/>
    </svg>
  );
}
function IconLink() {
  return (
    <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor">
      <path d="M137.54,186.36a8,8,0,0,1,0,11.31l-9.94,10A56,56,0,0,1,48.38,128.4L72.5,104.28A56,56,0,0,1,149,102.07a8,8,0,1,1-10.66,11.95,40,40,0,0,0-54.85,1.49L59.4,139.63a40,40,0,1,0,56.46,56.70l9.95-9.95A8,8,0,0,1,137.54,186.36Zm70.08-138a56.08,56.08,0,0,0-79.22,0l-9.94,9.95a8,8,0,0,0,11.32,11.31l9.94-9.94a40,40,0,0,1,56.46,56.69L172.11,140.4A40,40,0,0,1,117.37,142a8,8,0,1,0-10.66,11.94,56,56,0,0,0,76.48-2.21l24.12-24.12A56.08,56.08,0,0,0,207.62,48.38Z"/>
    </svg>
  );
}
function IconImage() {
  return (
    <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor">
      <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V158.75l-26.07-26.06a16,16,0,0,0-22.63,0l-20,20-44-44a16,16,0,0,0-22.62,0L40,149.37V56ZM40,172l52-52,80,80H40Zm176,28H194.63l-36-36,20-20L216,181.38V200ZM96,120a32,32,0,1,0-32-32A32,32,0,0,0,96,120Zm0-48a16,16,0,1,1-16,16A16,16,0,0,1,96,72Z"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  disabled?: boolean;
}

export function RichDescriptionEditor({
  value,
  onChange,
  placeholder = 'Write something...',
  minHeight = 100,
  disabled = false,
}: Props) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [aiPending, setAiPending] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 4200);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
      }),
      Placeholder.configure({ placeholder }),
      Image,
      TextStyle,
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    editable: !disabled && !aiPending,
    editorProps: {
      attributes: { class: styles.editor },
    },
    onUpdate({ editor: e }) {
      onChange(e.getHTML());
    },
  });

  // Sync value from outside (e.g. form reset) without overwriting user edits
  // We only update if the incoming value differs from current HTML AND is not
  // the result of our own onChange echo.
  // (Omitting complex sync logic; for a task form this is fine as-is.)

  const isActive = (mark: string, attrs?: Record<string, unknown>) =>
    editor ? editor.isActive(mark, attrs) : false;

  const applyLink = () => {
    if (!editor) return;
    const url = linkUrl.trim();
    if (!url) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
    setLinkOpen(false);
    setLinkUrl('');
  };

  const addImage = () => {
    if (!editor) return;
    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  // ── AI assist ─────────────────────────────────────────────────────────────
  const callAI = async (mode: 'correct' | 'rephrase' | 'complete') => {
    if (!editor || aiPending) return;
    const text = editor.getText();
    if (!text.trim()) {
      showToast('Add some text before using AI assist.');
      return;
    }
    setAiPending(true);
    try {
      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, text }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        showToast((body as { error?: string }).error ?? 'AI request failed.');
        return;
      }
      const { output } = (await res.json()) as { output: string };
      if (mode === 'complete') {
        // Append at the end
        editor.chain().focus().insertContentAt(editor.state.doc.content.size, output).run();
      } else {
        // Replace full content
        editor.commands.setContent(`<p>${output}</p>`);
      }
      onChange(editor.getHTML());
    } catch {
      showToast('Network error — please try again.');
    } finally {
      setAiPending(false);
    }
  };

  // ── Toolbar button helper ──────────────────────────────────────────────────
  const TB = ({
    onClick,
    active,
    title,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault(); // keep editor focused
        onClick();
      }}
      className={`${styles.btn}${active ? ` ${styles.btnActive}` : ''}`}
      disabled={!editor || disabled || aiPending}
    >
      {children}
    </button>
  );

  return (
    <div
      className={`${styles.wrapper}${disabled ? ` ${styles.wrapperDisabled}` : ''}`}
    >
      {/* ── Main toolbar ──────────────────────────────────────────────── */}
      <div className={`${styles.toolbar}${aiPending ? ` ${styles.toolbarDisabled}` : ''}`}>
        {/* Format */}
        <TB onClick={() => editor?.chain().focus().toggleBold().run()} active={isActive('bold')} title="Bold">
          <IconBold />
        </TB>
        <TB onClick={() => editor?.chain().focus().toggleItalic().run()} active={isActive('italic')} title="Italic">
          <IconItalic />
        </TB>
        <TB onClick={() => editor?.chain().focus().toggleUnderline().run()} active={isActive('underline')} title="Underline">
          <IconUnderline />
        </TB>
        <TB onClick={() => editor?.chain().focus().toggleStrike().run()} active={isActive('strike')} title="Strikethrough">
          <IconStrike />
        </TB>
        <TB onClick={() => editor?.chain().focus().toggleCode().run()} active={isActive('code')} title="Inline code">
          <IconCode />
        </TB>

        <div className={styles.divider} />

        {/* Headings */}
        <TB onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} active={isActive('heading', { level: 1 })} title="Heading 1">
          <IconH1 />
        </TB>
        <TB onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={isActive('heading', { level: 2 })} title="Heading 2">
          <IconH2 />
        </TB>
        <TB onClick={() => editor?.chain().focus().setParagraph().run()} active={isActive('paragraph')} title="Normal text">
          <IconParagraph />
        </TB>

        <div className={styles.divider} />

        {/* Lists */}
        <TB onClick={() => editor?.chain().focus().toggleBulletList().run()} active={isActive('bulletList')} title="Bullet list">
          <IconBullet />
        </TB>
        <TB onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={isActive('orderedList')} title="Ordered list">
          <IconOrdered />
        </TB>

        <div className={styles.divider} />

        {/* Block */}
        <TB onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={isActive('blockquote')} title="Blockquote">
          <IconQuote />
        </TB>
        <TB onClick={() => editor?.chain().focus().toggleCodeBlock().run()} active={isActive('codeBlock')} title="Code block">
          <IconCodeBlock />
        </TB>

        <div className={styles.divider} />

        {/* Alignment */}
        <TB onClick={() => editor?.chain().focus().setTextAlign('left').run()} active={editor?.isActive({ textAlign: 'left' }) ?? false} title="Align left">
          <IconAlignLeft />
        </TB>
        <TB onClick={() => editor?.chain().focus().setTextAlign('center').run()} active={editor?.isActive({ textAlign: 'center' }) ?? false} title="Align center">
          <IconAlignCenter />
        </TB>
        <TB onClick={() => editor?.chain().focus().setTextAlign('right').run()} active={editor?.isActive({ textAlign: 'right' }) ?? false} title="Align right">
          <IconAlignRight />
        </TB>

        <div className={styles.divider} />

        {/* Link */}
        <TB
          onClick={() => {
            if (!editor) return;
            const prev = editor.getAttributes('link').href ?? '';
            setLinkUrl(prev);
            setLinkOpen((v) => !v);
          }}
          active={isActive('link')}
          title="Insert link"
        >
          <IconLink />
        </TB>

        {/* Image */}
        <TB onClick={addImage} title="Insert image">
          <IconImage />
        </TB>

        {/* Link popover */}
        {linkOpen ? (
          <div className={styles.linkPopover}>
            <input
              className={styles.linkInput}
              type="url"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
                if (e.key === 'Escape') { setLinkOpen(false); }
              }}
              autoFocus
            />
            <button type="button" className={styles.linkApply} onClick={applyLink}>
              Apply
            </button>
          </div>
        ) : null}
      </div>

      {/* ── AI helpers row ───────────────────────────────────────────── */}
      <div className={styles.aiRow}>
        <span className={styles.aiLabel}>AI</span>
        {(['correct', 'rephrase', 'complete'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            className={styles.aiBtn}
            disabled={!editor || disabled || aiPending}
            onClick={() => callAI(mode)}
          >
            {aiPending ? <span className={styles.spin} /> : null}
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Editor content ───────────────────────────────────────────── */}
      <div
        className={styles.editorWrap}
        style={{ minHeight }}
        onClick={() => editor?.commands.focus()}
      >
        <EditorContent editor={editor} />

        {aiPending ? (
          <div className={styles.aiOverlay}>
            <span className={styles.overlaySpinner} />
          </div>
        ) : null}

        {toastMsg ? (
          <div key={toastMsg} className={styles.toast}>
            {toastMsg}
          </div>
        ) : null}
      </div>
    </div>
  );
}
