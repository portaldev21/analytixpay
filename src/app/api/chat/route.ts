import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { env, hasAnthropic } from "@/lib/env";
import { logger } from "@/lib/logger";
import { apiLimiter } from "@/lib/rate-limit";
import { buildFinancialContext } from "@/lib/ai/financial-agent";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import type { TChatMessage } from "@/db/types";

const MAX_MESSAGE_LENGTH = 2000;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatRequest {
  message: string;
  conversationId: string | null;
  accountId: string;
}

/**
 * POST /api/chat
 * Streaming chat endpoint for AI financial agent
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Validate API key
    if (!hasAnthropic()) {
      return new Response(
        JSON.stringify({
          error:
            "ANTHROPIC_API_KEY nao configurada. Configure no arquivo .env.local",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Parse request body
    const body: ChatRequest = await request.json();
    const { message, conversationId, accountId } = body;

    if (!message || !accountId) {
      return new Response(
        JSON.stringify({ error: "message e accountId sao obrigatorios" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({
          error: `Mensagem muito longa (maximo ${MAX_MESSAGE_LENGTH} caracteres)`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Create Supabase client and verify auth
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Nao autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify account access
    const { data: membership } = await supabase
      .from("account_members")
      .select("id")
      .eq("account_id", accountId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return new Response(
        JSON.stringify({ error: "Sem acesso a esta conta" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    // Rate limit: 20 messages per minute per user
    try {
      await apiLimiter.check(20, user.id);
    } catch {
      return new Response(
        JSON.stringify({
          error:
            "Limite de mensagens excedido. Aguarde um momento antes de enviar outra mensagem.",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }

    logger.info("Chat request received", {
      userId: user.id,
      accountId,
      conversationId,
      messageLength: message.length,
    });

    // Create or get conversation
    let convId = conversationId;
    if (!convId) {
      // Create new conversation
      const { data: newConv, error: convError } = await (
        supabase.from("chat_conversations") as any
      )
        .insert({
          account_id: accountId,
          user_id: user.id,
          title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
        })
        .select("id")
        .single();

      if (convError) {
        logger.error("Failed to create conversation", convError);
        return new Response(
          JSON.stringify({ error: "Erro ao criar conversa" }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }

      convId = newConv.id;
    }

    // Save user message
    const { error: msgError } = await (
      supabase.from("chat_messages") as any
    ).insert({
      conversation_id: convId,
      role: "user",
      content: message,
    });

    if (msgError) {
      logger.error("Failed to save user message", msgError);
    }

    // Get conversation history
    const { data: history } = await (supabase.from("chat_messages") as any)
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(20); // Limit context window

    // Build financial context
    const context = await buildFinancialContext(supabase, accountId);
    const systemPrompt = buildSystemPrompt(context);

    // Prepare messages for Claude
    const messages: Anthropic.MessageParam[] = (
      (history as TChatMessage[]) || []
    ).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Initialize Anthropic client
    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    // Create streaming response
    const encoder = new TextEncoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream response from Claude
          const response = await anthropic.messages.stream({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 2048,
            system: systemPrompt,
            messages,
          });

          for await (const event of response) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const text = event.delta.text;
              fullResponse += text;

              // Send chunk as SSE
              const data = JSON.stringify({
                content: text,
                done: false,
                conversationId: convId,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          // Save assistant message
          await (supabase.from("chat_messages") as any).insert({
            conversation_id: convId,
            role: "assistant",
            content: fullResponse,
            metadata: {
              model: "claude-haiku-4-5-20251001",
              contextSize: messages.length,
            },
          });

          // Send done signal
          const doneData = JSON.stringify({
            done: true,
            conversationId: convId,
          });
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));

          const duration = Date.now() - startTime;
          logger.info("Chat response completed", {
            conversationId: convId,
            duration,
            responseLength: fullResponse.length,
          });

          controller.close();
        } catch (error) {
          logger.error("Streaming error", error);

          const errorData = JSON.stringify({
            error: "Erro ao processar resposta",
            done: true,
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    logger.error("Chat API error", error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Erro interno do servidor",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
