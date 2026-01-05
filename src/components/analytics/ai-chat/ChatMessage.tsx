"use client";

import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({
  role,
  content,
  isStreaming = false,
}: ChatMessageProps) {
  const isAssistant = role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-3 p-4 rounded-xl",
        isAssistant
          ? "bg-[var(--color-surface-muted)]"
          : "bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
          isAssistant
            ? "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-white"
            : "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]",
        )}
      >
        {isAssistant ? (
          <Bot className="h-4 w-4" />
        ) : (
          <User className="h-4 w-4" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">
          {isAssistant ? "AnalytiX" : "Voce"}
        </div>
        <div className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap break-words">
          {content}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-[var(--color-primary)] rounded-sm animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
