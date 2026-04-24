"use client";

import { useRef, useState, useTransition } from "react";
import { PaperPlaneRight, PushPin, User, Buildings } from "@phosphor-icons/react";
import { sendClientMessage, togglePinMessage } from "./messaging-actions";
import type { ClientMessage } from "@/lib/admin/client-messages";
import styles from "./MessagingTab.module.css";

type Props = {
  contactId: string;
  messages: ClientMessage[];
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function MessageBubble({
  message,
  onPin,
}: {
  message: ClientMessage;
  onPin: (id: string, currentlyPinned: boolean) => void;
}) {
  const [isPinning, startPinTransition] = useTransition();
  const isAdmin = message.senderType === "admin";

  function handlePin() {
    startPinTransition(async () => {
      onPin(message.id, message.pinned);
    });
  }

  return (
    <div className={`${styles.bubble} ${isAdmin ? styles.bubbleAdmin : styles.bubbleClient}`}>
      <div className={styles.bubbleHeader}>
        <span className={styles.senderName}>
          {isAdmin ? (
            <><Buildings size={12} className={styles.senderIcon} /> {message.senderName}</>
          ) : (
            <><User size={12} className={styles.senderIcon} /> {message.senderName}</>
          )}
        </span>
        <span className={styles.timestamp}>{formatTime(message.createdAt)}</span>
        <button
          className={`${styles.pinBtn} ${message.pinned ? styles.pinBtnActive : ""}`}
          onClick={handlePin}
          disabled={isPinning}
          title={message.pinned ? "Unpin" : "Pin message"}
          aria-label={message.pinned ? "Unpin" : "Pin"}
        >
          <PushPin size={12} weight={message.pinned ? "fill" : "regular"} />
        </button>
      </div>
      <p className={styles.bubbleBody}>{message.body}</p>
    </div>
  );
}

export function MessagingTab({ contactId, messages: initialMessages }: Props) {
  const [localMessages, setLocalMessages] = useState<ClientMessage[]>(initialMessages);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const pinned = localMessages.filter((m) => m.pinned);
  const thread = localMessages.filter((m) => !m.pinned);

  function handlePin(messageId: string, currentlyPinned: boolean) {
    setLocalMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, pinned: !currentlyPinned } : m)),
    );
    togglePinMessage(messageId, contactId, currentlyPinned).catch(() => {
      setLocalMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, pinned: currentlyPinned } : m)),
      );
    });
  }

  function handleSend() {
    if (!body.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await sendClientMessage(contactId, body);
      if (result.ok) {
        setBody("");
        textareaRef.current?.focus();
      } else {
        setError(result.message);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className={styles.root}>
      {pinned.length > 0 && (
        <div className={styles.pinnedSection}>
          <div className={styles.pinnedLabel}>
            <PushPin size={13} weight="fill" />
            Pinned
          </div>
          {pinned.map((m) => (
            <MessageBubble key={m.id} message={m} onPin={handlePin} />
          ))}
        </div>
      )}

      <div className={styles.thread}>
        {thread.length === 0 && pinned.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>No messages yet</p>
            <p className={styles.emptyBody}>
              Messages sent here are private notes and in-app communications with this client.
            </p>
          </div>
        ) : (
          thread.map((m) => (
            <MessageBubble key={m.id} message={m} onPin={handlePin} />
          ))
        )}
      </div>

      <div className={styles.compose}>
        {error && <p className={styles.composeError}>{error}</p>}
        <div className={styles.composeRow}>
          <textarea
            ref={textareaRef}
            className={styles.composeInput}
            placeholder="Write a message (Cmd+Enter to send)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            disabled={isPending}
          />
          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={isPending || !body.trim()}
            aria-label="Send message"
          >
            <PaperPlaneRight size={18} weight="fill" />
          </button>
        </div>
      </div>
    </div>
  );
}
