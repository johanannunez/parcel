"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, PaperPlaneRight, Robot, User } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function AIChatWidget({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Auto-scroll to bottom on new messages */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  /* Focus input when opened */
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);

    const assistantId = `a-${Date.now()}`;
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
    };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const res = await fetch("/api/help/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok || !res.body) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    "Sorry, I could not get an answer right now. Please try again.",
                }
              : m
          )
        );
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const current = accumulated;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: current } : m
          )
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  "Something went wrong. Please try again in a moment.",
              }
            : m
        )
      );
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, messages]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    },
    [send]
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/20"
            onClick={onClose}
            aria-hidden
          />

          {/* Chat drawer */}
          <motion.div
            initial={{ x: "100%", opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.8 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[61] flex w-full max-w-md flex-col border-l"
            style={{
              backgroundColor: "var(--color-off-white)",
              borderColor: "var(--color-warm-gray-200)",
            }}
            role="dialog"
            aria-label="AI Help Chat"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between border-b px-5 py-4"
              style={{ borderColor: "var(--color-warm-gray-200)" }}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: "rgba(2, 170, 235, 0.10)",
                    color: "var(--color-brand)",
                  }}
                >
                  <Robot size={18} weight="duotone" />
                </span>
                <div>
                  <h2
                    className="text-sm font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    AI Help Assistant
                  </h2>
                  <p
                    className="text-[11px]"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    Answers based on help articles
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-lg p-2 transition-colors duration-150 hover:bg-[var(--color-warm-gray-100)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-brand)] active:bg-[var(--color-warm-gray-200)]"
                style={{ color: "var(--color-text-secondary)" }}
                aria-label="Close chat"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Messages area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-5 py-5 space-y-4"
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center pt-16 text-center">
                  <span
                    className="inline-flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{
                      backgroundColor: "rgba(2, 170, 235, 0.08)",
                      color: "var(--color-brand)",
                    }}
                  >
                    <Robot size={28} weight="duotone" />
                  </span>
                  <p
                    className="mt-4 max-w-xs text-sm leading-relaxed"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Ask me anything about your properties, payouts, calendar, or
                    account. I will find the answer in our help articles.
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex max-w-[85%] gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Avatar */}
                    <span
                      className="mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
                      style={{
                        backgroundColor:
                          msg.role === "user"
                            ? "var(--color-brand)"
                            : "var(--color-warm-gray-100)",
                        color:
                          msg.role === "user"
                            ? "var(--color-white)"
                            : "var(--color-text-secondary)",
                      }}
                    >
                      {msg.role === "user" ? (
                        <User size={14} weight="bold" />
                      ) : (
                        <Robot size={14} weight="duotone" />
                      )}
                    </span>

                    {/* Bubble */}
                    <div
                      className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                      style={{
                        backgroundColor:
                          msg.role === "user"
                            ? "var(--color-brand)"
                            : "var(--color-white)",
                        color:
                          msg.role === "user"
                            ? "var(--color-white)"
                            : "var(--color-text-primary)",
                        border:
                          msg.role === "assistant"
                            ? "1px solid var(--color-warm-gray-200)"
                            : "none",
                        borderRadius:
                          msg.role === "user"
                            ? "20px 20px 4px 20px"
                            : "20px 20px 20px 4px",
                      }}
                    >
                      {msg.content || (
                        <span
                          className="inline-flex gap-1"
                          aria-label="Thinking"
                        >
                          <span className="animate-pulse">.</span>
                          <span className="animate-pulse [animation-delay:150ms]">
                            .
                          </span>
                          <span className="animate-pulse [animation-delay:300ms]">
                            .
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <div
              className="px-5 pb-2 text-center text-[11px] leading-snug"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              AI answers are based on our help articles. For account-specific
              questions, contact us directly.
            </div>

            {/* Input area */}
            <div
              className="border-t px-4 py-3"
              style={{ borderColor: "var(--color-warm-gray-200)" }}
            >
              <div
                className="flex items-center gap-2 rounded-xl border px-3 py-2 transition-shadow duration-200 focus-within:shadow-[0_0_0_3px_rgba(2,170,235,0.12)]"
                style={{
                  backgroundColor: "var(--color-white)",
                  borderColor: "var(--color-warm-gray-200)",
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question..."
                  disabled={streaming}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-tertiary)] disabled:opacity-60"
                  style={{ color: "var(--color-text-primary)" }}
                  aria-label="Type your question"
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={!input.trim() || streaming}
                  className="inline-flex items-center justify-center rounded-lg p-2 transition-opacity duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-brand)] active:opacity-80 disabled:opacity-30"
                  style={{
                    backgroundColor: "var(--color-brand)",
                    color: "var(--color-white)",
                  }}
                  aria-label="Send message"
                >
                  <PaperPlaneRight size={16} weight="fill" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
