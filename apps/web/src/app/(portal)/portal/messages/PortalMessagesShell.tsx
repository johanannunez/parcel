"use client";

import { useState, useEffect, useLayoutEffect, useCallback, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChatCircle,
  EnvelopeSimple,
  MagnifyingGlass,
  PaperPlaneTilt,
  ArrowLeft,
  ArrowDown,
  Plus,
} from "@phosphor-icons/react";
import { SafeHtml } from "@/components/messages/SafeHtml";
import {
  replyToConversation,
  getConversationMessagesForOwner,
  recordMessagesRead,
  createDirectConversation,
} from "./actions";
import { createClient } from "@/lib/supabase/client";

/* ─── Parcel Company Avatar ─── */

function ParcelAvatar({ size = 40, highlighted = false }: { size?: number; highlighted?: boolean }) {
  const imgSize = Math.round(size * 0.6);
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: highlighted ? "var(--color-brand)" : "var(--color-warm-gray-100)",
      }}
    >
      <img
        src="/brand/logo-mark.png"
        alt="The Parcel Company"
        width={imgSize}
        height={imgSize}
        className="object-contain"
      />
    </span>
  );
}

/* ─── Types ─── */

type Conversation = {
  id: string;
  subject: string | null;
  type: "direct" | "announcement" | "email_log";
  lastMessageAt: string;
  lastMessage: {
    body: string;
    senderId: string;
    createdAt: string;
    isSystem: boolean;
  } | null;
  unreadCount: number;
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

type Tab = "messages" | "emails";

/* ─── Component ─── */

export function PortalMessagesShell({
  conversations,
  emailConversations,
  currentUserId,
}: {
  conversations: Conversation[];
  emailConversations: Conversation[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>("messages");
  const [search, setSearch] = useState("");
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  // Track conversations the user has opened this session (optimistic unread clear)
  const [readConvIds, setReadConvIds] = useState<Set<string>>(new Set());

  const filtered = conversations.map((c) => ({
    ...c,
    unreadCount: readConvIds.has(c.id) ? 0 : c.unreadCount,
  })).filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.subject?.toLowerCase().includes(q) ||
      c.lastMessage?.body?.toLowerCase().includes(q)
    );
  });

  const filteredEmails = emailConversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.subject?.toLowerCase().includes(q) ||
      c.lastMessage?.body?.toLowerCase().includes(q)
    );
  });

  const loadConversation = useCallback(
    async (convId: string) => {
      setSelectedConvId(convId);
      // Optimistically clear unread badge immediately
      setReadConvIds((prev) => new Set([...prev, convId]));
      const result = await getConversationMessagesForOwner(convId);
      if (result.error) return;
      setMessages(result.messages as Message[]);

      // Record reads in a single bulk call (not N individual round-trips)
      const unreadIds = (result.messages ?? [])
        .filter((m) => m.sender_id !== currentUserId)
        .map((m) => m.id);
      if (unreadIds.length > 0) {
        const device = typeof navigator !== "undefined" ? navigator.userAgent : null;
        recordMessagesRead({ messageIds: unreadIds, deviceInfo: device ?? undefined });
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

  // Scroll handled inside ChatThread via useLayoutEffect

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

  const handleBack = () => {
    setSelectedConvId(null);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ─── Left Panel: Tabs + Search + List ─── */}
      <div
        className={`flex shrink-0 flex-col border-r ${
          selectedConvId ? "hidden md:flex" : "flex"
        } w-full md:w-[320px] lg:w-[340px]`}
        style={{
          borderColor: "var(--color-warm-gray-200)",
          backgroundColor: "var(--color-warm-gray-50)",
        }}
      >
        {/* Tab switcher */}
        <div
          className="flex items-center gap-1 border-b px-3 pt-3 pb-0"
          style={{ borderColor: "var(--color-warm-gray-200)" }}
        >
          <TabButton
            active={activeTab === "messages"}
            onClick={() => { setActiveTab("messages"); setSearch(""); }}
            label="Messages"
            count={conversations.reduce((sum, c) => sum + (readConvIds.has(c.id) ? 0 : c.unreadCount), 0)}
          />
          <TabButton
            active={activeTab === "emails"}
            onClick={() => { setActiveTab("emails"); setSearch(""); }}
            label="Emails"
          />
          {activeTab === "messages" ? (
            <button
              type="button"
              className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-warm-gray-100)]"
              style={{ color: "var(--color-brand)" }}
              title="New message"
              aria-label="New message"
              onClick={async () => {
                // Check if a direct conversation already exists locally
                const existingDirect = conversations.find((c) => c.type === "direct");
                if (existingDirect) {
                  loadConversation(existingDirect.id);
                  return;
                }
                // Create one via server action
                const result = await createDirectConversation();
                if (result.conversationId) {
                  loadConversation(result.conversationId);
                  startTransition(() => router.refresh());
                }
              }}
            >
              <Plus size={18} weight="bold" />
            </button>
          ) : null}
        </div>

        {/* Search */}
        <div
          className="border-b px-3 py-2.5"
          style={{ borderColor: "var(--color-warm-gray-200)" }}
        >
          <div
            className="flex items-center gap-2 rounded-lg border px-3 py-2"
            style={{
              backgroundColor: "var(--color-white)",
              borderColor: "var(--color-warm-gray-200)",
            }}
          >
            <MagnifyingGlass size={14} style={{ color: "var(--color-text-tertiary)" }} />
            <input
              type="text"
              placeholder={activeTab === "messages" ? "Search messages..." : "Search emails..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm focus:outline-none"
              style={{ color: "var(--color-text-primary)" }}
            />
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "messages" ? (
            <ConversationList
              conversations={filtered}
              selectedConvId={selectedConvId}
              onSelect={loadConversation}
            />
          ) : (
            <EmailList
              emails={filteredEmails}
              selectedConvId={selectedConvId}
              onSelect={loadConversation}
            />
          )}
        </div>
      </div>

      {/* ─── Right Panel: Thread or Activity Detail ─── */}
      <div
        className={`flex min-w-0 flex-1 flex-col ${
          selectedConvId ? "flex" : "hidden md:flex"
        }`}
        style={{ backgroundColor: "var(--color-white)" }}
      >
        {selectedConvId ? (
          <ChatThread
            messages={messages}
            currentUserId={currentUserId}
            replyText={replyText}
            setReplyText={setReplyText}
            sending={sending}
            onReply={handleReply}
            onBack={handleBack}
            messagesEndRef={messagesEndRef}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

/* ─── Tab Button ─── */

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative px-3 pb-2.5 pt-1.5 text-sm font-semibold transition-colors"
      style={{
        color: active ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
      }}
    >
      <span className="flex items-center gap-1.5">
        {label}
        {count && count > 0 ? (
          <span
            className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{ backgroundColor: "var(--color-brand)" }}
          >
            {count}
          </span>
        ) : null}
      </span>
      {active ? (
        <span
          className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
          style={{ backgroundColor: "var(--color-brand)" }}
        />
      ) : null}
    </button>
  );
}

/* ─── Conversation List ─── */

function ConversationList({
  conversations,
  selectedConvId,
  onSelect,
}: {
  conversations: Conversation[];
  selectedConvId: string | null;
  onSelect: (id: string) => void;
}) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16">
        <ChatCircle
          size={40}
          weight="duotone"
          style={{ color: "var(--color-warm-gray-200)" }}
        />
        <p
          className="mt-3 text-sm font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          No conversations yet
        </p>
        <p
          className="mt-1 text-center text-xs leading-relaxed"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Messages from The Parcel Company will appear here.
        </p>
      </div>
    );
  }

  return (
    <ul>
      {conversations.map((c) => {
        const isSelected = selectedConvId === c.id;
        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c.id)}
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

              <ParcelAvatar size={40} highlighted={isSelected} />

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span
                    className="truncate text-sm font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {c.type === "announcement" ? c.subject ?? "Announcement" : "The Parcel Company"}
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
  );
}


/* ─── Email List ─── */

function EmailList({
  emails,
  selectedConvId,
  onSelect,
}: {
  emails: Conversation[];
  selectedConvId: string | null;
  onSelect: (id: string) => void;
}) {
  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16">
        <EnvelopeSimple
          size={40}
          weight="duotone"
          style={{ color: "var(--color-warm-gray-200)" }}
        />
        <p
          className="mt-3 text-sm font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          No emails yet
        </p>
        <p
          className="mt-1 text-center text-xs leading-relaxed"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Email threads from The Parcel Company will appear here.
        </p>
      </div>
    );
  }

  return (
    <ul>
      {emails.map((c) => {
        const isSelected = selectedConvId === c.id;
        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c.id)}
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
              {isSelected ? (
                <span
                  className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full"
                  style={{ backgroundColor: "var(--color-brand)" }}
                />
              ) : null}
              <ParcelAvatar size={36} highlighted={isSelected} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className="truncate text-sm font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {c.subject ?? "Email"}
                  </span>
                  <span className="shrink-0 text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
                    {formatRelative(c.lastMessageAt)}
                  </span>
                </div>
                {c.lastMessage ? (
                  <p className="mt-0.5 truncate text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {c.lastMessage.body}
                  </p>
                ) : null}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ─── Chat Thread ─── */

function ChatThread({
  messages,
  currentUserId,
  replyText,
  setReplyText,
  sending,
  onReply,
  onBack,
  messagesEndRef,
}: {
  messages: Message[];
  currentUserId: string;
  replyText: string;
  setReplyText: (v: string) => void;
  sending: boolean;
  onReply: () => void;
  onBack: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const prevMessageCountRef = useRef(messages.length);

  // Scroll to bottom on initial load, or when new messages arrive and user is near bottom
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      // First render: always snap to bottom
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      return;
    }
    const distFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    // Only auto-scroll if this is the first load or user is near the bottom
    if (prevMessageCountRef.current === 0 || distFromBottom <= 150) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [messages, messagesEndRef]);

  // Track scroll position to show/hide the floating button
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const distFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollBtn(distFromBottom > 100);
    if (distFromBottom <= 100) {
      setNewMsgCount(0);
    }
  }, []);

  // When new messages arrive while scrolled up, increment new message count
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current && showScrollBtn) {
      setNewMsgCount((c) => c + (messages.length - prevMessageCountRef.current));
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, showScrollBtn]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setNewMsgCount(0);
  }, [messagesEndRef]);

  return (
    <>
      {/* Chat Header */}
      <div
        className="flex shrink-0 items-center gap-3 border-b px-4 py-3.5 md:px-6"
        style={{ borderColor: "var(--color-warm-gray-200)" }}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg md:hidden"
          style={{ color: "var(--color-brand)" }}
          aria-label="Back to conversations"
        >
          <ArrowLeft size={18} weight="bold" />
        </button>
        <ParcelAvatar size={36} highlighted />
        <div>
          <div className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            The Parcel Company
          </div>
          <div className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
            Direct message
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto px-4 py-5 md:px-6"
        style={{ backgroundColor: "var(--color-off-white)" }}
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {messages.map((m, idx) => {
            const isOwner = m.sender_id === currentUserId;
            const msgDate = new Date(m.created_at);
            const prevDate = idx > 0 ? new Date(messages[idx - 1].created_at) : null;
            const showDateSeparator =
              idx === 0 ||
              (prevDate &&
                msgDate.toDateString() !== prevDate.toDateString());

            return (
              <div key={m.id}>
                {showDateSeparator ? (
                  <div className="flex items-center gap-3 py-3">
                    <span
                      className="h-px flex-1"
                      style={{ backgroundColor: "var(--color-warm-gray-200)" }}
                    />
                    <span
                      className="shrink-0 text-[11px] font-medium"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {formatDateSeparator(msgDate)}
                    </span>
                    <span
                      className="h-px flex-1"
                      style={{ backgroundColor: "var(--color-warm-gray-200)" }}
                    />
                  </div>
                ) : null}
              <div className={`flex items-end gap-2 ${isOwner ? "flex-row-reverse" : "flex-row"}`}>
                {!isOwner ? (
                  m.senderAvatarUrl ? (
                    <img
                      src={m.senderAvatarUrl}
                      alt={m.senderName ?? "The Parcel Company"}
                      className="h-7 w-7 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <ParcelAvatar size={28} highlighted />
                  )
                ) : null}

                <div className="flex max-w-[70%] flex-col">
                  {!isOwner && m.senderName ? (
                    <span
                      className="mb-1 text-[10px] font-medium text-left"
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
                      style={{ color: isOwner ? "#ffffff" : "var(--color-text-primary)" }}
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
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating scroll-to-bottom button */}
        {showScrollBtn ? (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
            style={{
              backgroundColor: "var(--color-white)",
              border: "1px solid var(--color-warm-gray-200)",
              color: "var(--color-text-secondary)",
            }}
            aria-label="Scroll to latest message"
          >
            <ArrowDown size={16} weight="bold" />
            {newMsgCount > 0 ? (
              <span
                className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold"
                style={{ backgroundColor: "var(--color-brand)", color: "#ffffff" }}
              >
                {newMsgCount}
              </span>
            ) : null}
          </button>
        ) : null}
      </div>

      {/* Reply Input */}
      <div
        className="shrink-0 border-t px-4 py-3 md:px-6"
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
                  onReply();
                }
              }}
            />
          </div>
          <button
            type="button"
            onClick={onReply}
            disabled={sending || !replyText.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40"
            style={{ backgroundColor: "var(--color-brand)" }}
          >
            <PaperPlaneTilt size={16} weight="bold" />
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Empty State ─── */

function EmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <ChatCircle
          size={48}
          weight="duotone"
          className="mx-auto"
          style={{ color: "var(--color-warm-gray-200)" }}
        />
        <p
          className="mt-3 text-sm font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Select a conversation
        </p>
        <p
          className="mt-1 text-xs"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Choose a conversation from the left to view messages.
        </p>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */

function formatDateSeparator(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

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
