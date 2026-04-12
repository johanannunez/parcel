"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExt from "@tiptap/extension-image";
import LinkExt from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import {
  TextB,
  TextItalic,
  TextUnderline,
  TextStrikethrough,
  ListBullets,
  ListNumbers,
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
  LinkSimple,
  ImageSquare,
  ArrowCounterClockwise,
  ArrowClockwise,
  Quotes,
  TextHOne,
  TextHTwo,
  TextHThree,
  Minus,
  Code,
} from "@phosphor-icons/react";
import { useCallback, useRef, useState } from "react";

type Props = {
  content?: string;
  onChange?: (html: string) => void;
};

async function uploadImage(file: File): Promise<string | null> {
  const form = new FormData();
  form.append("file", file);

  try {
    const res = await fetch("/api/help/upload", { method: "POST", body: form });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url ?? null;
  } catch {
    return null;
  }
}

export function HelpArticleEditor({ content = "", onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      LinkExt.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "underline text-[var(--color-brand-light)]",
        },
      }),
      ImageExt.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: "Start writing your article..." }),
    ],
    content,
    onUpdate: ({ editor: e }) => {
      onChange?.(e.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[400px] px-5 py-4 text-[15px] leading-[1.75]",
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved || !event.dataTransfer?.files.length) return false;

        const file = event.dataTransfer.files[0];
        if (!file?.type.startsWith("image/")) return false;

        event.preventDefault();
        setUploading(true);

        uploadImage(file).then((url) => {
          setUploading(false);
          if (url) {
            const { schema } = view.state;
            const node = schema.nodes.image.create({ src: url });
            const pos = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            });
            if (pos) {
              const tr = view.state.tr.insert(pos.pos, node);
              view.dispatch(tr);
            }
          }
        });

        return true;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) return false;

            setUploading(true);

            uploadImage(file).then((url) => {
              setUploading(false);
              if (url) {
                const { schema } = view.state;
                const node = schema.nodes.image.create({ src: url });
                const tr = view.state.tr.replaceSelectionWith(node);
                view.dispatch(tr);
              }
            });

            return true;
          }
        }

        return false;
      },
    },
  });

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("URL");
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }, [editor]);

  const addImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;

      setUploading(true);
      const url = await uploadImage(file);
      setUploading(false);

      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }

      e.target.value = "";
    },
    [editor],
  );

  if (!editor) return null;

  const border = "var(--color-warm-gray-200)";
  const toolbarBg = "var(--color-warm-gray-50)";
  const mutedColor = "var(--color-text-tertiary)";

  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: border, backgroundColor: "var(--color-white)" }}>
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-1 border-b px-2 py-1.5"
        style={{ borderColor: border, backgroundColor: toolbarBg }}
      >
        <ToolbarBtn
          icon={<TextHOne size={16} />}
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
        />
        <ToolbarBtn
          icon={<TextHTwo size={16} />}
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        />
        <ToolbarBtn
          icon={<TextHThree size={16} />}
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
        />

        <Divider />

        <ToolbarBtn
          icon={<TextB size={16} weight="bold" />}
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        />
        <ToolbarBtn
          icon={<TextItalic size={16} />}
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        />
        <ToolbarBtn
          icon={<TextUnderline size={16} />}
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        />
        <ToolbarBtn
          icon={<TextStrikethrough size={16} />}
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        />
        <ToolbarBtn
          icon={<Code size={16} />}
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline code"
        />

        <Divider />

        <ToolbarBtn
          icon={<ListBullets size={16} />}
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        />
        <ToolbarBtn
          icon={<ListNumbers size={16} />}
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        />
        <ToolbarBtn
          icon={<Quotes size={16} />}
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
        />

        <Divider />

        <ToolbarBtn
          icon={<TextAlignLeft size={16} />}
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="Align left"
        />
        <ToolbarBtn
          icon={<TextAlignCenter size={16} />}
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="Align center"
        />
        <ToolbarBtn
          icon={<TextAlignRight size={16} />}
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="Align right"
        />

        <Divider />

        <ToolbarBtn
          icon={<LinkSimple size={16} />}
          active={editor.isActive("link")}
          onClick={addLink}
          title="Insert link"
        />
        <ToolbarBtn
          icon={<ImageSquare size={16} />}
          active={false}
          onClick={addImage}
          title="Insert image"
        />
        <ToolbarBtn
          icon={<Minus size={16} />}
          active={false}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal rule"
        />

        <Divider />

        <ToolbarBtn
          icon={<ArrowCounterClockwise size={16} />}
          active={false}
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
          disabled={!editor.can().undo()}
        />
        <ToolbarBtn
          icon={<ArrowClockwise size={16} />}
          active={false}
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
          disabled={!editor.can().redo()}
        />

        {uploading && (
          <span className="ml-2 text-xs font-medium" style={{ color: "var(--color-brand)" }}>
            Uploading image...
          </span>
        )}
      </div>

      {/* Editor */}
      <div style={{ color: "var(--color-text-primary)" }}>
        <EditorContent editor={editor} />
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Upload indicator overlay */}
      {uploading && (
        <div
          className="border-t px-4 py-2 text-xs"
          style={{
            borderColor: border,
            backgroundColor: "var(--color-warm-gray-50)",
            color: mutedColor,
          }}
        >
          Uploading image to storage...
        </div>
      )}
    </div>
  );
}

/* ─── Toolbar helpers ─── */

function ToolbarBtn({
  icon,
  active,
  onClick,
  title,
  disabled = false,
}: {
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded transition-colors disabled:opacity-30"
      style={{
        color: active ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
        backgroundColor: active ? "var(--color-warm-gray-200)" : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = "var(--color-warm-gray-100)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {icon}
    </button>
  );
}

function Divider() {
  return (
    <div
      className="mx-1 h-5 w-px"
      style={{ backgroundColor: "var(--color-warm-gray-200)" }}
    />
  );
}
