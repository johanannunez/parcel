"use client";

import { useState } from "react";

type Mode = "human" | "machine" | "raw";

export default function LlmsToggle() {
  const [mode, setMode] = useState<Mode>("human");
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function fetchLlms() {
    if (content) return content;
    setLoading(true);
    try {
      const res = await fetch("/llms.txt");
      const text = await res.text();
      setContent(text);
      return text;
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(newMode: Mode) {
    if (newMode === mode) return;
    if (newMode !== "human") await fetchLlms();
    setMode(newMode);
  }

  function renderMarkdown(md: string) {
    return md.split("\n").map((line, i) => {
      if (line.startsWith("# "))
        return (
          <h1 key={i} className="mb-4 text-2xl font-bold text-white">
            {line.slice(2)}
          </h1>
        );
      if (line.startsWith("## "))
        return (
          <h2 key={i} className="mb-3 mt-6 text-xl font-semibold text-white/90">
            {line.slice(3)}
          </h2>
        );
      if (line.startsWith("> "))
        return (
          <blockquote
            key={i}
            className="mb-4 border-l-2 border-white/30 pl-4 italic text-white/70"
          >
            {line.slice(2)}
          </blockquote>
        );
      if (line.startsWith("- ")) {
        const text = line.slice(2);
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return (
          <li key={i} className="ml-4 list-disc text-sm text-white/70">
            {parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={j} className="text-white/90">
                  {part.slice(2, -2)}
                </strong>
              ) : part.includes("](") ? (
                <span key={j} dangerouslySetInnerHTML={{
                  __html: part.replace(
                    /\[([^\]]+)\]\(([^)]+)\)/g,
                    '<a href="$2" class="underline hover:text-white">$1</a>'
                  ),
                }} />
              ) : (
                <span key={j}>{part}</span>
              )
            )}
          </li>
        );
      }
      if (line.trim() === "") return <div key={i} className="h-2" />;
      return (
        <p key={i} className="text-sm leading-relaxed text-white/70">
          {line}
        </p>
      );
    });
  }

  return (
    <div className="mt-8">
      {/* Toggle buttons */}
      <div className="flex items-center gap-1 rounded-full bg-white/5 p-1 w-fit">
        {(["human", "machine", "raw"] as const).map((m) => (
          <button
            key={m}
            onClick={() => handleToggle(m)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-all duration-300 ${
              mode === m
                ? "bg-white/15 text-white shadow-sm"
                : "text-white/50 hover:text-white/70"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Content area */}
      {mode !== "human" && (
        <div className="mt-4 rounded-lg bg-white/5 p-6 backdrop-blur-sm">
          {loading ? (
            <p className="text-sm text-white/50">Loading llms.txt...</p>
          ) : mode === "machine" ? (
            <div className="space-y-0">{renderMarkdown(content)}</div>
          ) : (
            <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-white/60">
              {content}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
