"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CardGlass } from "@/components/ui/card-glass";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ChatSuggestions } from "./ChatSuggestions";
import { Bot, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatContainerProps {
  accountId: string;
}

export function ChatContainer({ accountId }: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // Send message
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingContent("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          conversationId,
          accountId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao enviar mensagem");
      }

      // Read streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.error) {
                  throw new Error(data.error);
                }

                if (data.conversationId && !conversationId) {
                  setConversationId(data.conversationId);
                }

                if (data.content) {
                  fullContent += data.content;
                  setStreamingContent(fullContent);
                }

                if (data.done) {
                  // Add assistant message
                  const assistantMessage: Message = {
                    id: `assistant-${Date.now()}`,
                    role: "assistant",
                    content: fullContent,
                  };
                  setMessages((prev) => [...prev, assistantMessage]);
                  setStreamingContent("");
                }
              } catch (e) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao processar resposta",
      );
      setStreamingContent("");
    } finally {
      setIsLoading(false);
    }
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    setConversationId(null);
    setStreamingContent("");
  };

  const hasMessages = messages.length > 0 || streamingContent;

  return (
    <CardGlass variant="default" size="lg" className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center shadow-[var(--shadow-md)]">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              AnalytiX
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              Assistente Financeiro
            </p>
          </div>
        </div>
        {hasMessages && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-negative)]"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-thin">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 rounded-2xl bg-[var(--color-surface-muted)] mb-4">
              <MessageSquare className="h-10 w-10 text-[var(--color-text-muted)]" />
            </div>
            <h4 className="font-medium text-[var(--color-text-primary)] mb-2">
              Ola! Sou o AnalytiX
            </h4>
            <p className="text-sm text-[var(--color-text-muted)] mb-4 max-w-sm">
              Posso ajudar a analisar seus gastos, identificar padroes e sugerir
              formas de economizar. Experimente uma pergunta abaixo!
            </p>
            <ChatSuggestions onSelect={sendMessage} disabled={isLoading} />
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
              />
            ))}
            {streamingContent && (
              <ChatMessage
                role="assistant"
                content={streamingContent}
                isStreaming
              />
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Suggestions (when has messages) */}
      {hasMessages && !isLoading && (
        <div className="mb-4">
          <ChatSuggestions onSelect={sendMessage} disabled={isLoading} />
        </div>
      )}

      {/* Input */}
      <ChatInput onSend={sendMessage} isLoading={isLoading} />
    </CardGlass>
  );
}
