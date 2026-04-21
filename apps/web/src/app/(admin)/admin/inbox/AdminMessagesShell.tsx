"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChatCircle,
  EnvelopeSimple,
  Megaphone,
  MagnifyingGlass,
  PaperPlaneTilt,
  FunnelSimple,
  PlusCircle,
  Eye,
  Clock,
  DeviceMobile,
  Desktop,
  ArrowLeft,
} from "@phosphor-icons/react";
import { RichTextEditor } from "@/components/messages/RichTextEditor";
import { SafeHtml } from "@/components/messages/SafeHtml";
import { sendMessage, sendBroadcast, getConversationMessages, getOwnerCount } from "./actions";
import { createClient } from "@/lib/supabase/client";

type Conversation = {
  id: string;
  ownerId: string | null;
  subject: string | null;
  type: "direct" | "announcement" | "email_log";
  lastMessageAt: string;
  ownerName: string | null;
  ownerEmail: string | null;
  lastMessage: {
    body: string;
    senderId: string;
    createdAt: string;
    deliveryMethod: string;
  } | null;
};

type Owner = {
  id: string;
  name: string;
  email: string;
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
  senderName: string;
  senderRole: string;
  senderAvatarUrl: string | null;
  reads: Array<{
    readerId: string;
    firstReadAt: string;
    readCount: number;
    lastReadAt: string;
    deviceInfo: string | null;
  }>;
};

type ConversationDetail = {
  id: string;
  owner_id: string | null;
  subject: string | null;
  type: string;
  ownerProfile: { id: string; full_name: string | null; email: string } | null;
};

const FILTERS = [
  { key: "all", label: "All messages" },
  { key: "unread", label: "Unread" },
  { key: "sent", label: "Sent" },
  { key: "announcements", label: "Announcements" },
  { key: "email_logs", label: "Email logs" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export function AdminMessagesShell({
  conversations: initialConversations,
  allOwners,
  selectedOwnerId,
  initialFilter,
}: {
  conversations: Conversation[];
  allOwners: Owner[];
  selectedOwnerId: string | null;
  initialFilter: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [filter, setFilter] = useState<FilterKey>(
    (initialFilter as FilterKey) || "all",
  );
  const [search, setSearch] = useState("");
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationDetail, setConversationDetail] =
    useState<ConversationDetail | null>(null);
  const [composeBody, setComposeBody] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"portal" | "email">("portal");
  const [emailSubject, setEmailSubject] = useState("");
  const [sending, setSending] = useState(false);
  const [showOwnerPicker, setShowOwnerPicker] = useState(false);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [expandedReads, setExpandedReads] = useState<Set<string>>(new Set());
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastDelivery, setBroadcastDelivery] = useState<"portal" | "portal_email">("portal");
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [ownerCount, setOwnerCount] = useState<number | null>(0);

  // Filter conversations
  const filtered = initialConversations.filter((c) => {
    if (filter === "announcements" && c.type !== "announcement") return false;
    if (filter === "email_logs" && c.type !== "email_log") return false;
    if (filter === "sent" && c.type !== "direct") return false;
    if (search) {
      const q = search.toLowerCase();
      const matchesName = c.ownerName?.toLowerCase().includes(q);
      const matchesEmail = c.ownerEmail?.toLowerCase().includes(q);
      const matchesSubject = c.subject?.toLowerCase().includes(q);
      const matchesBody = c.lastMessage?.body?.toLowerCase().includes(q);
      if (!matchesName && !matchesEmail && !matchesSubject && !matchesBody)
        return false;
    }
    return true;
  });

  // Load conversation messages when selected
  const loadConversation = useCallback(async (convId: string) => {
    setSelectedConvId(convId);
    const result = await getConversationMessages(convId);
    if (result.error) return;
    setMessages(result.messages as Message[]);
    setConversationDetail(result.conversation as ConversationDetail);
  }, []);

  // Auto-select conversation if owner filter is set
  useEffect(() => {
    if (selectedOwnerId) {
      const conv = initialConversations.find(
        (c) => c.ownerId === selectedOwnerId && c.type === "direct",
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (conv) loadConversation(conv.id);
    }
  }, [selectedOwnerId, initialConversations, loadConversation]);

  // Real-time subscription for new messages
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-messages")
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
  }, [selectedConvId, loadConversation, router]);

  const handleSend = async () => {
    if (!composeBody.trim() || !conversationDetail?.owner_id) return;
    if (deliveryMethod === "email" && !emailSubject.trim()) return;
    setSending(true);
    const result = await sendMessage({
      ownerId: conversationDetail.owner_id,
      body: composeBody,
      deliveryMethod,
      subject: deliveryMethod === "email" ? emailSubject : undefined,
    });
    setSending(false);
    if (result.error) return;
    setComposeBody("");
    setEmailSubject("");
    setDeliveryMethod("portal");
    if (result.conversationId) loadConversation(result.conversationId);
  };

  const handleBroadcast = async () => {
    if (!broadcastSubject.trim() || !broadcastBody.trim()) return;
    setBroadcastSending(true);
    const result = await sendBroadcast({
      subject: broadcastSubject,
      body: broadcastBody,
      deliveryMethod: broadcastDelivery,
    });
    setBroadcastSending(false);
    if (result.error) return;
    setBroadcastSubject("");
    setBroadcastBody("");
    setBroadcastDelivery("portal");
    setShowBroadcast(false);
    startTransition(() => router.refresh());
  };

  const openBroadcast = async () => {
    const count = await getOwnerCount();
    setOwnerCount(count);
    setShowBroadcast(true);
  };

  const handleNewMessage = async (ownerId: string) => {
    setShowOwnerPicker(false);
    setOwnerSearch("");
    const existing = initialConversations.find(
      (c) => c.ownerId === ownerId && c.type === "direct",
    );
    if (existing) {
      loadConversation(existing.id);
      return;
    }
    // Send an initial empty-body message to create the conversation
    const result = await sendMessage({ ownerId, body: "" });
    if (result.conversationId) {
      startTransition(() => router.refresh());
      loadConversation(result.conversationId);
    }
  };

  const toggleReads = (messageId: string) => {
    setExpandedReads((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  };

  const filteredOwners = allOwners.filter((o) => {
    if (!ownerSearch) return true;
    const q = ownerSearch.toLowerCase();
    return o.name.toLowerCase().includes(q) || o.email.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left Panel: Filters (hidden on mobile) */}
      <div
        className="hidden w-[220px] shrink-0 flex-col border-r lg:flex"
        style={{
          borderColor: "var(--color-warm-gray-200)",
          backgroundColor: "var(--color-warm-gray-50)",
        }}
      >
        <div className="px-4 pb-3 pt-6">
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Messages</h2>
        </div>

        <nav className="flex-1 px-2">
          <ul className="flex flex-col gap-0.5">
            {FILTERS.map((f) => {
              const count =
                f.key === "all"
                  ? initialConversations.length
                  : f.key === "announcements"
                    ? initialConversations.filter((c) => c.type === "announcement").length
                    : f.key === "email_logs"
                      ? initialConversations.filter((c) => c.type === "email_log").length
                      : 0;
              return (
                <li key={f.key}>
                  <button
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                    style={{
                      color: filter === f.key ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                      backgroundColor:
                        filter === f.key ? "var(--color-warm-gray-100)" : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (filter !== f.key)
                        e.currentTarget.style.backgroundColor = "var(--color-warm-gray-100)";
                    }}
                    onMouseLeave={(e) => {
                      if (filter !== f.key)
                        e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <FilterIcon filterKey={f.key} />
                      {f.label}
                    </span>
                    {count > 0 ? (
                      <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                        {count}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex flex-col gap-2 border-t p-3" style={{ borderColor: "var(--color-warm-gray-200)" }}>
          <button
            type="button"
            onClick={() => setShowOwnerPicker(true)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            style={{ color: "var(--color-brand-light)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-warm-gray-100)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <PlusCircle size={16} weight="bold" />
            New message
          </button>
          <button
            type="button"
            onClick={openBroadcast}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            style={{ color: "#f59e0b" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-warm-gray-100)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <Megaphone size={16} weight="bold" />
            New announcement
          </button>
        </div>
      </div>

      {/* Middle Panel: Conversation List */}
      <div
        className={`flex shrink-0 flex-col border-r ${
          selectedConvId ? "hidden md:flex" : "flex"
        } w-full md:w-[320px]`}
        style={{ borderColor: "var(--color-warm-gray-200)" }}
      >
        <div className="border-b px-3 py-3" style={{ borderColor: "var(--color-warm-gray-200)" }}>
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ backgroundColor: "var(--color-warm-gray-100)" }}
          >
            <MagnifyingGlass size={14} style={{ color: "var(--color-text-tertiary)" }} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm focus:outline-none"
              style={{ color: "var(--color-text-primary)" }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm" style={{ color: "var(--color-text-tertiary)" }}>
              No conversations found.
            </div>
          ) : (
            <ul>
              {filtered.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => loadConversation(c.id)}
                    className="flex w-full gap-3 border-b px-4 py-3 text-left transition-colors"
                    style={{
                      borderColor: "var(--color-warm-gray-100)",
                      backgroundColor: selectedConvId === c.id ? "var(--color-warm-gray-100)" : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (selectedConvId !== c.id)
                        e.currentTarget.style.backgroundColor = "var(--color-warm-gray-50)";
                    }}
                    onMouseLeave={(e) => {
                      if (selectedConvId !== c.id)
                        e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div className="shrink-0 pt-0.5">
                      {c.type === "announcement" ? (
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-full"
                          style={{ backgroundColor: "rgba(2, 170, 235, 0.12)", color: "var(--color-brand)" }}
                        >
                          <Megaphone size={16} weight="duotone" />
                        </span>
                      ) : c.type === "email_log" ? (
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-full"
                          style={{ backgroundColor: "var(--color-warm-gray-100)", color: "var(--color-text-tertiary)" }}
                        >
                          <EnvelopeSimple size={16} weight="duotone" />
                        </span>
                      ) : (
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold"
                          style={{ backgroundColor: "var(--color-warm-gray-100)", color: "var(--color-text-secondary)" }}
                        >
                          {buildInitials(c.ownerName ?? "")}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                          {c.type === "announcement" ? (c.subject ?? "Announcement") : (c.ownerName ?? "Unknown")}
                        </span>
                        <span className="shrink-0 text-[10px]" style={{ color: "var(--color-text-tertiary)" }}>
                          {formatRelative(c.lastMessageAt)}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        {c.lastMessage ? stripHtml(c.lastMessage.body).slice(0, 80) : "No messages yet"}
                      </div>
                      {c.lastMessage?.deliveryMethod === "email" ? (
                        <span className="mt-1 inline-flex items-center gap-1 text-[10px]" style={{ color: "var(--color-text-tertiary)" }}>
                          <EnvelopeSimple size={10} />
                          Email
                        </span>
                      ) : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Right Panel: Thread + Compose */}
      <div
        className={`flex min-w-0 flex-1 flex-col ${
          selectedConvId ? "flex" : "hidden md:flex"
        }`}
      >
        {!selectedConvId || !conversationDetail ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <ChatCircle size={48} weight="duotone" style={{ color: "var(--color-warm-gray-200)" }} className="mx-auto" />
              <p className="mt-3 text-sm" style={{ color: "var(--color-text-tertiary)" }}>
                Select a conversation to view messages.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="flex items-center gap-3 border-b px-4 py-4 md:px-6" style={{ borderColor: "var(--color-warm-gray-200)" }}>
              {/* Mobile back button */}
              <button
                type="button"
                onClick={() => { setSelectedConvId(null); setConversationDetail(null); }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg md:hidden"
                style={{ color: "var(--color-brand)" }}
                aria-label="Back to conversations"
              >
                <ArrowLeft size={18} weight="bold" />
              </button>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {conversationDetail.type === "announcement"
                    ? (conversationDetail.subject ?? "Announcement")
                    : (conversationDetail.ownerProfile?.full_name?.trim() ??
                      conversationDetail.ownerProfile?.email ??
                      "Unknown")}
                </div>
                {conversationDetail.ownerProfile?.email ? (
                  <div className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                    {conversationDetail.ownerProfile.email}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="mx-auto flex max-w-3xl flex-col gap-4">
                {messages.map((m) => {
                  const isAdmin = m.senderRole === "admin";
                  const isSystem = m.is_system;
                  return (
                    <div key={m.id}>
                      <div className={`flex items-end gap-2 ${isAdmin ? "flex-row-reverse" : "flex-row"}`}>
                        {/* Sender Avatar */}
                        {isSystem ? (
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: "rgba(2, 170, 235, 0.12)", color: "var(--color-brand-light)" }}
                          >
                            <Megaphone size={12} weight="bold" />
                          </span>
                        ) : m.senderAvatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.senderAvatarUrl}
                            alt={m.senderName}
                            className="h-7 w-7 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                            style={{
                              backgroundColor: isAdmin ? "var(--color-brand)" : "var(--color-warm-gray-200)",
                              color: isAdmin ? "white" : "var(--color-text-primary)",
                            }}
                          >
                            {buildInitials(m.senderName)}
                          </span>
                        )}

                        <div
                          className="max-w-[70%] rounded-xl px-4 py-3"
                          style={{
                            backgroundColor: isSystem
                              ? "rgba(2, 170, 235, 0.08)"
                              : isAdmin
                                ? "var(--color-brand)"
                                : "var(--color-warm-gray-100)",
                          }}
                        >
                          {isSystem ? (
                            <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase" style={{ color: "var(--color-brand-light)" }}>
                              <Megaphone size={10} />
                              Announcement
                            </div>
                          ) : null}
                          {m.delivery_method === "email" ? (
                            <div
                              className="mb-1 flex items-center gap-1 text-[10px]"
                              style={{ color: isAdmin ? "rgba(255,255,255,0.8)" : "var(--color-text-tertiary)" }}
                            >
                              <EnvelopeSimple size={10} />
                              Sent via email
                            </div>
                          ) : null}
                          <SafeHtml
                            html={m.body}
                            className="prose prose-sm max-w-none text-sm [&_a]:underline [&_img]:rounded-lg"
                            style={{ color: isAdmin ? "white" : "var(--color-text-primary)" }}
                          />
                          <div
                            className="mt-2 text-[10px]"
                            style={{ color: isAdmin ? "rgba(255,255,255,0.7)" : "var(--color-text-tertiary)" }}
                          >
                            {new Date(m.created_at).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Read tracking */}
                      {isAdmin && m.reads.length > 0 ? (
                        <div className={`mt-1 flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                          <button
                            type="button"
                            onClick={() => toggleReads(m.id)}
                            className="flex items-center gap-1 text-[10px] transition-colors"
                            style={{ color: "var(--color-text-tertiary)" }}
                          >
                            <Eye size={10} />
                            Read by {m.reads.length} {m.reads.length === 1 ? "person" : "people"}
                          </button>
                        </div>
                      ) : null}
                      {isAdmin && expandedReads.has(m.id) ? (
                        <div className={`mt-1 flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                          <div
                            className="rounded-lg p-3 text-[10px]"
                            style={{ backgroundColor: "var(--color-warm-gray-50)", color: "var(--color-text-secondary)" }}
                          >
                            {m.reads.map((r) => (
                              <div key={r.readerId} className="flex items-center gap-3 py-1">
                                <span className="flex items-center gap-1">
                                  <Clock size={10} />
                                  First: {new Date(r.firstReadAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                                </span>
                                <span>Opens: {r.readCount}</span>
                                {r.deviceInfo ? (
                                  <span className="flex items-center gap-1">
                                    {r.deviceInfo.includes("Mobile") ? <DeviceMobile size={10} /> : <Desktop size={10} />}
                                    {r.deviceInfo.includes("Mobile") ? "Mobile" : "Desktop"}
                                  </span>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Compose */}
            {conversationDetail.type === "direct" ? (
              <div className="border-t p-4" style={{ borderColor: "var(--color-warm-gray-200)" }}>
                <RichTextEditor dark={false} content="" onChange={setComposeBody} placeholder="Write a message..." />
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Delivery Toggle */}
                    <div
                      className="flex overflow-hidden rounded-lg border"
                      style={{ borderColor: "var(--color-warm-gray-200)" }}
                    >
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod("portal")}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: deliveryMethod === "portal" ? "var(--color-warm-gray-100)" : "transparent",
                          color: deliveryMethod === "portal" ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                        }}
                      >
                        <ChatCircle size={12} weight="bold" />
                        Portal
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod("email")}
                        className="flex items-center gap-1.5 border-l px-3 py-1.5 text-xs font-medium transition-colors"
                        style={{
                          borderColor: "var(--color-warm-gray-200)",
                          backgroundColor: deliveryMethod === "email" ? "var(--color-warm-gray-100)" : "transparent",
                          color: deliveryMethod === "email" ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                        }}
                      >
                        <EnvelopeSimple size={12} weight="bold" />
                        Email
                      </button>
                    </div>

                    {/* Subject field (email only) */}
                    {deliveryMethod === "email" ? (
                      <input
                        type="text"
                        placeholder="Email subject..."
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="rounded-lg border bg-transparent px-3 py-1.5 text-xs focus:outline-none"
                        style={{ borderColor: "var(--color-warm-gray-200)", color: "var(--color-text-primary)", minWidth: "200px" }}
                      />
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sending || !composeBody.trim() || (deliveryMethod === "email" && !emailSubject.trim())}
                    className="flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                    style={{ backgroundColor: "var(--color-brand)" }}
                  >
                    <PaperPlaneTilt size={16} weight="bold" />
                    {sending ? "Sending..." : deliveryMethod === "email" ? "Send email" : "Send"}
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Broadcast Modal */}
      {showBroadcast ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div
            className="w-[600px] rounded-xl border p-6"
            style={{ backgroundColor: "var(--color-white)", borderColor: "var(--color-warm-gray-200)" }}
          >
            <div className="mb-4 flex items-center gap-2">
              <Megaphone size={18} weight="duotone" style={{ color: "#d97706" }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>New announcement</h3>
            </div>

            <input
              type="text"
              placeholder="Subject line..."
              value={broadcastSubject}
              onChange={(e) => setBroadcastSubject(e.target.value)}
              className="mb-3 w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none"
              style={{ borderColor: "var(--color-warm-gray-200)", color: "var(--color-text-primary)" }}
              autoFocus
            />

            <RichTextEditor dark={false} content="" onChange={setBroadcastBody} placeholder="Write your announcement..." />

            {/* Delivery method */}
            <div className="mt-4 flex items-center gap-4">
              <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Deliver via:</span>
              <div className="flex overflow-hidden rounded-lg border" style={{ borderColor: "var(--color-warm-gray-200)" }}>
                <button
                  type="button"
                  onClick={() => setBroadcastDelivery("portal")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: broadcastDelivery === "portal" ? "var(--color-warm-gray-100)" : "transparent",
                    color: broadcastDelivery === "portal" ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                  }}
                >
                  Portal only
                </button>
                <button
                  type="button"
                  onClick={() => setBroadcastDelivery("portal_email")}
                  className="flex items-center gap-1.5 border-l px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    borderColor: "var(--color-warm-gray-200)",
                    backgroundColor: broadcastDelivery === "portal_email" ? "var(--color-warm-gray-100)" : "transparent",
                    color: broadcastDelivery === "portal_email" ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                  }}
                >
                  Portal + Email
                </button>
              </div>
            </div>

            {/* Owner count preview */}
            <div
              className="mt-3 rounded-lg px-3 py-2 text-xs"
              style={{ backgroundColor: "var(--color-warm-gray-50)", color: "var(--color-text-secondary)" }}
            >
              {ownerCount === null
                ? "Could not load owner count."
                : <>This will be sent to <strong style={{ color: "var(--color-text-primary)" }}>{ownerCount}</strong> owner{ownerCount !== 1 ? "s" : ""}
              {broadcastDelivery === "portal_email" ? " (portal + email)" : " (portal only)"}.</>
              }
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowBroadcast(false); setBroadcastSubject(""); setBroadcastBody(""); }}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                style={{ color: "var(--color-text-secondary)" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-warm-gray-100)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBroadcast}
                disabled={broadcastSending || !broadcastSubject.trim() || !broadcastBody.trim()}
                className="flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                style={{ backgroundColor: "#f59e0b" }}
              >
                <Megaphone size={14} weight="bold" />
                {broadcastSending ? "Sending..." : "Send announcement"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Owner Picker Modal */}
      {showOwnerPicker ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div
            className="w-[400px] rounded-xl border p-6"
            style={{ backgroundColor: "var(--color-white)", borderColor: "var(--color-warm-gray-200)" }}
          >
            <h3 className="mb-4 text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>New message</h3>
            <div className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: "var(--color-warm-gray-100)" }}>
              <MagnifyingGlass size={14} style={{ color: "var(--color-text-tertiary)" }} />
              <input
                type="text"
                placeholder="Search owners..."
                value={ownerSearch}
                onChange={(e) => setOwnerSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm focus:outline-none"
                style={{ color: "var(--color-text-primary)" }}
                autoFocus
              />
            </div>
            <ul className="max-h-[300px] overflow-y-auto">
              {filteredOwners.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => handleNewMessage(o.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors"
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-warm-gray-100)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                      style={{ backgroundColor: "var(--color-warm-gray-100)", color: "var(--color-text-secondary)" }}
                    >
                      {buildInitials(o.name)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{o.name}</div>
                      <div className="truncate text-xs" style={{ color: "var(--color-text-tertiary)" }}>{o.email}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => { setShowOwnerPicker(false); setOwnerSearch(""); }}
              className="mt-4 w-full rounded-lg py-2 text-sm font-medium transition-colors"
              style={{ color: "var(--color-text-secondary)" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-warm-gray-100)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ─── Helpers ─── */

function FilterIcon({ filterKey }: { filterKey: FilterKey }) {
  const size = 16;
  const weight = "duotone" as const;
  switch (filterKey) {
    case "all": return <ChatCircle size={size} weight={weight} />;
    case "unread": return <ChatCircle size={size} weight="fill" />;
    case "sent": return <PaperPlaneTilt size={size} weight={weight} />;
    case "announcements": return <Megaphone size={size} weight={weight} />;
    case "email_logs": return <EnvelopeSimple size={size} weight={weight} />;
    default: return <FunnelSimple size={size} weight={weight} />;
  }
}

function buildInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").trim();
}

function formatRelative(dateStr: string) {
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
