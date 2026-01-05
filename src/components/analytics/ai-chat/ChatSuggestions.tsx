"use client";

import { Button } from "@/components/ui/button";
import { SUGGESTED_QUESTIONS } from "@/lib/ai/prompts";

interface ChatSuggestionsProps {
  onSelect: (question: string) => void;
  disabled?: boolean;
}

export function ChatSuggestions({
  onSelect,
  disabled = false,
}: ChatSuggestionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SUGGESTED_QUESTIONS.map((question, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSelect(question)}
          disabled={disabled}
          className="text-xs h-auto py-2 px-3 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          {question}
        </Button>
      ))}
    </div>
  );
}
