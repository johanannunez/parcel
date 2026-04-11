"use client";

import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChatCircle,
  EnvelopeSimple,
  Megaphone,
  MagnifyingGlass,
  PaperPlaneTilt,
  Bell,
  ArrowRight,
  ArrowLeft,
  X,
} from "@phosphor-icons/react";
import { SafeHtml } from "@/components/messages/SafeHtml";
import {
  replyToConversation,
  getConversationMessagesForOwner,
  recordMessageRead,
} from "./actions";
import { createClient } from "@/lib/supabase/client";
import { PushPermissionCard } from "@/components/portal/PushSubscriptionManager";

/* ─── Types ─── */

type Conversation = {
  id: string;
  subject: string | null;
  type: "direct";
  lastMessageAt: string;
  lastMessage: {
    body: string;
    senderId: string;
    createdAt: string;
    isSystem: boolean;
  } | null;
  unreadCount: number;
};

type Alert = {
  id: string;
  subject: string | null;
  type: "announcement" | "email_log";
  lastMessageAt: string;
  lastMessage: {
    body: string;
    senderId: string;
    createdAt: string;
    isSystem: boolean;
  } | null;
  unreadCount: number;
};

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  is_system: boolean;
  delivery_method: string;
  metadata: Record<string, unknown>;
  created_at: string;
  senderName?: string;
  senderRole?: string;
  senderAvatarUrl?: string | null;
};

/* ─── Component ─── */

export function PortalMessagesShell({
  conversations,
  alerts,
  notifications,
  currentUserId,
}: {
  conversations: Conversation[];
  alerts: Alert[];
  notifications: Notification[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState("");
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.lastMessage?.body?.toLowerCase().includes(q);
  });

  const visibleAlerts = [...alerts, ...notifications.map((n) => ({
    id: `notif-${n.id}`,
    type: "notification" as const,
    title: n.title,
    body: n.body,
    link: n.link,
    read: n.read,
    createdAt: n.createdAt,
  }))].filter((a) => !dismissedAlerts.has(a.id));

  const loadConversation = useCallback(
    async (convId: string) => {
      setSelectedConvId(convId);
      const result = await getConversationMessagesForOwner(convId);
      if (result.error) return;
      setMessages(result.messages as Message[]);

      // Record reads silently
      const device = typeof navigator !== "undefined" ? navigator.userAgent : null;
      for (const m of result.messages ?? []) {
        if (m.sender_id !== currentUserId) {
          recordMessageRead({ messageId: m.id, deviceInfo: device ?? undefined });
        }
      }
    },
    [currentUserId],
  );

  // Auto-select first conversation if only one exists
  useEffect(() => {
    if (conversations.length === 1 && !selectedConvId) {
      loadConversation(conversations[0].id);
    }
  }, [conversations, selectedConvId, loadConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`owner-messages-${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          if (selectedConvId && payload.new.conversation_id === selectedConvId) {
            loadConversation(selectedConvId);
          }
          startTransition(() => router.refresh());
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConvId, currentUserId, loadConversation, router]);

  const handleReply = async () => {
    if (!replyText.trim() || !selectedConvId) return;
    setSending(true);
    const result = await replyToConversation({
      conversationId: selectedConvId,
      body: replyText,
    });
    setSending(false);
    if (result.error) return;
    setReplyText("");
    loadConversation(selectedConvId);
  };

  const dismissAlert = (id: string) => {
    setDismissedAlerts((prev) => new Set([...prev, id]));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Push Notification Prompt ─── */}
      <PushPermissionCard />

      {/* ─── Alerts Strip ─── */}
      {visibleAlerts.length > 0 ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Bell size={16} weight="duotone" style={{ color: "var(--color-brand)" }} />
            <h2
              className="text-xs font-semibold uppercase tracking-[0.1em]"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Updates &amp; Announcements
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleAlerts.slice(0, 6).map((alert) => {
              const isAnnouncement = "type" in alert && alert.type === "announcement";
              const isEmail = "type" in alert && alert.type === "email_log";
              const isNotification = alert.id.startsWith("notif-");

              return (
                <div
                  key={alert.id}
                  className="group relative rounded-xl border p-4 transition-shadow hover:shadow-sm"
                  style={{
                    borderColor: isAnnouncement
                      ? "rgba(2, 170, 235, 0.15)"
                      : "var(--color-warm-gray-200)",
                    backgroundColor: isAnnouncement
                      ? "rgba(2, 170, 235, 0.03)"
                      : "var(--color-white)",
                  }}
                >
                  {/* Dismiss button */}
                  <button
                    type="button"
                    onClick={() => dismissAlert(alert.id)}
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    <X size={12} />
                  </button>

                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: isAnnouncement
                          ? "rgba(2, 170, 235, 0.1)"
                          : isNotification
                            ? "rgba(245, 158, 11, 0.1)"
                            : "var(--color-warm-gray-100)",
                        color: isAnnouncement
                          ? "var(--color-brand)"
                          : isNotification
                            ? "#d97706"
                            : "var(--color-text-tertiary)",
                      }}
                    >
                      {isAnnouncement ? (
                        <Megaphone size={14} weight="duotone" />
                      ) : isEmail ? (
                        <EnvelopeSimple size={14} weight="duotone" />
                      ) : (
                        <Bell size={14} weight="duotone" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wide"
                          style={{
                            color: isAnnouncement
                              ? "var(--color-brand)"
                              : isNotification
                                ? "#d97706"
                                : "var(--color-text-tertiary)",
                          }}
                        >
                          {isAnnouncement ? "Announcement" : isEmail ? "Email" : "Notification"}
                        </span>
                        <span className="text-[10px]" style={{ color: "var(--color-text-tertiary)" }}>
                          {formatRelative("createdAt" in alert ? alert.createdAt : ("lastMessageAt" in alert ? (alert as Alert).lastMessageAt : ""))}
                        </span>
                      </div>
                      <p
                        className="mt-1 line-clamp-2 text-sm"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {"title" in alert && alert.title
                          ? alert.title
                          : "subject" in alert && (alert as Alert).subject
                            ? (alert as Alert).subject
                            : "lastMessage" in alert && (alert as Alert).lastMessage
                              ? stripHtml((alert as Alert).lastMessage!.body).slice(0, 120)
                              : "body" in alert
                                ? (alert as { body: string }).body
                                : ""}
                      </p>
                      {isNotification && "link" in alert && alert.link ? (
                        <Link
                          href={alert.link as string}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium transition-colors"
                          style={{ color: "var(--color-brand)" }}
                        >
                          View details <ArrowRight size={10} />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* ─── Split Inbox ─── */}
      <div
        className="flex overflow-hidden rounded-xl border"
        style={{
          borderColor: "var(--color-warm-gray-200)",
          height: visibleAlerts.length > 0 ? "calc(100dvh - 340px)" : "calc(100dvh - 180px)",
          minHeight: "400px",
        }}
      >
        {/* Left: Conversation List */}
        <div
          className={`flex shrink-0 flex-col border-r ${
            selectedConvId ? "hidden md:flex" : "flex"
          } w-full md:w-[300px]`}
          style={{ borderColor: "var(--color-warm-gray-200)", backgroundColor: "var(--color-warm-gray-50)" }}
        >
          <div className="border-b px-3 py-3" style={{ borderColor: "var(--color-warm-gray-200)" }}>
            <div
              className="flex items-center gap-2 rounded-lg border px-3 py-2"
              style={{ backgroundColor: "var(--color-white)", borderColor: "var(--color-warm-gray-200)" }}
            >
              <MagnifyingGlass size={14} style={{ color: "var(--color-text-tertiary)" }} />
              <input
                type="text"
                placeholder="Search messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm focus:outline-none"
                style={{ color: "var(--color-text-primary)" }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <ChatCircle size={32} weight="duotone" className="mx-auto" style={{ color: "var(--color-warm-gray-200)" }} />
                <p className="mt-2 text-sm" style={{ color: "var(--color-text-tertiary)" }}>
                  No conversations yet.
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                  Messages from The Parcel Company will appear here.
                </p>
              </div>
            ) : (
              <ul>
                {filtered.map((c) => {
                  const isSelected = selectedConvId === c.id;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => loadConversation(c.id)}
                        className="relative flex w-full gap-3 border-b px-4 py-3.5 text-left transition-colors"
                        style={{
                          borderColor: "var(--color-warm-gray-200)",
                          backgroundColor: isSelected ? "var(--color-white)" : "transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = "var(--color-warm-gray-100)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        {/* Active indicator */}
                        {isSelected ? (
                          <span
                            className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full"
                            style={{ backgroundColor: "var(--color-brand)" }}
                          />
                        ) : null}

                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: isSelected ? "var(--color-brand)" : "var(--color-warm-gray-200)",
                            color: isSelected ? "var(--color-white)" : "var(--color-text-secondary)",
                          }}
                        >
                          PC
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span
                              className="truncate text-sm font-semibold"
                              style={{ color: "var(--color-text-primary)" }}
                            >
                              The Parcel Company
                            </span>
                            <span className="shrink-0 text-[10px]" style={{ color: "var(--color-text-tertiary)" }}>
                              {formatRelative(c.lastMessageAt)}
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="truncate text-xs" style={{ color: "var(--color-text-secondary)" }}>
                              {c.lastMessage ? stripHtml(c.lastMessage.body).slice(0, 60) : "Start a conversation"}
                            </span>
                            {c.unreadCount > 0 ? (
                              <span
                                className="flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                                style={{ backgroundColor: "var(--color-brand)" }}
                              >
                                {c.unreadCount}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Right: Chat Thread */}
        <div
          className={`flex min-w-0 flex-1 flex-col ${
            selectedConvId ? "flex" : "hidden md:flex"
          }`}
          style={{ backgroundColor: "var(--color-white)" }}
        >
          {!selectedConvId ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <ChatCircle size={48} weight="duotone" className="mx-auto" style={{ color: "var(--color-warm-gray-200)" }} />
                <p className="mt-3 text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                  Select a conversation
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                  Choose a conversation from the left to view messages.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div
                className="flex items-center gap-3 border-b px-4 py-3.5 md:px-6"
                style={{ borderColor: "var(--color-warm-gray-200)" }}
              >
                {/* Mobile back button */}
                <button
                  type="button"
                  onClick={() => setSelectedConvId(null)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg md:hidden"
                  style={{ color: "var(--color-brand)" }}
                  aria-label="Back to conversations"
                >
                  <ArrowLeft size={18} weight="bold" />
                </button>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: "var(--color-brand)", color: "var(--color-white)" }}
                >
                  PC
                </span>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    The Parcel Company
                  </div>
                  <div className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
                    Direct message
                  </div>
                </div>
              </div>

              {/* Messages (iMessage Bubbles) */}
              <div
                className="flex-1 overflow-y-auto px-6 py-5"
                style={{ backgroundColor: "var(--color-off-white)" }}
              >
                <div className="mx-auto flex max-w-2xl flex-col gap-3">
                  {messages.map((m) => {
                    const isOwner = m.sender_id === currentUserId;
                    return (
                      <div key={m.id} className={`flex items-end gap-2 ${isOwner ? "flex-row-reverse" : "flex-row"}`}>
                        {/* Sender Avatar */}
                        {!isOwner ? (
                          m.senderAvatarUrl ? (
                            <img
                              src={m.senderAvatarUrl}
                              alt={m.senderName ?? "The Parcel Company"}
                              className="h-7 w-7 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <span
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                              style={{ backgroundColor: "var(--color-brand)", color: "var(--color-white)" }}
                            >
                              PC
                            </span>
                          )
                        ) : null}

                        <div className="flex max-w-[70%] flex-col">
                          {/* Sender name for non-owner messages */}
                          {!isOwner && m.senderName ? (
                            <span
                              className={`mb-1 text-[10px] font-medium ${isOwner ? "text-right" : "text-left"}`}
                              style={{ color: "var(--color-text-tertiary)" }}
                            >
                              {m.senderName}
                            </span>
                          ) : null}
                          <div
                            className="rounded-2xl px-4 py-2.5"
                            style={{
                              backgroundColor: isOwner ? "var(--color-brand)" : "var(--color-white)",
                              borderBottomRightRadius: isOwner ? "6px" : undefined,
                              borderBottomLeftRadius: !isOwner ? "6px" : undefined,
                              boxShadow: isOwner ? "none" : "0 1px 2px rgba(0,0,0,0.04)",
                            }}
                          >
                            {m.delivery_method === "email" ? (
                              <div
                                className="mb-1 flex items-center gap-1 text-[10px]"
                                style={{ color: isOwner ? "rgba(255,255,255,0.7)" : "var(--color-text-tertiary)" }}
                              >
                                <EnvelopeSimple size={10} />
                                Sent via email
                              </div>
                            ) : null}
                            <SafeHtml
                              html={m.body}
                              className="text-sm leading-relaxed [&_a]:underline [&_img]:rounded-lg"
                              style={{ color: isOwner ? "var(--color-white)" : "var(--color-text-primary)" }}
                            />
                          </div>
                          <span
                            className={`mt-1 text-[10px] ${isOwner ? "text-right" : "text-left"}`}
                            style={{ color: "var(--color-text-tertiary)" }}
                          >
                            {new Date(m.created_at).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Reply Input */}
              <div
                className="border-t px-4 py-3"
                style={{
                  borderColor: "var(--color-warm-gray-200)",
                  backgroundColor: "var(--color-white)",
                  paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))",
                }}
              >
                <div className="flex items-end gap-2">
                  <div
                    className="flex flex-1 items-center rounded-full border px-4 transition-colors focus-within:border-[var(--color-brand)]"
                    style={{
                      borderColor: "var(--color-warm-gray-200)",
                      backgroundColor: "var(--color-warm-gray-50)",
                    }}
                  >
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type a message..."
                      rows={1}
                      className="flex-1 resize-none bg-transparent py-2.5 text-sm focus:outline-none"
                      style={{ color: "var(--color-text-primary)" }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleReply();
                        }
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleReply}
                    disabled={sending || !replyText.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40"
                    style={{ backgroundColor: "var(--color-brand)" }}
                  >
                    <PaperPlaneTilt size={16} weight="bold" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").trim();
}

function formatRelative(dateStr: string) {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
