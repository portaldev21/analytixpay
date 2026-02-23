"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireAccountAccess } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type {
  TApiResponse,
  TChatConversation,
  TChatMessage,
  TChatConversationWithMessages,
} from "@/db/types";

/**
 * Get all conversations for an account
 */
export async function getConversations(
  accountId: string,
): Promise<TApiResponse<TChatConversation[]>> {
  const startTime = Date.now();

  try {
    const { supabase } = await requireAccountAccess(accountId);

    logger.info("Fetching conversations", { accountId });

    const { data: conversations, error } = await (
      supabase.from("chat_conversations") as any
    )
      .select("*")
      .eq("account_id", accountId)
      .order("updated_at", { ascending: false });

    if (error) {
      logger.error("Failed to fetch conversations", error, { accountId });
      return { data: null, error: error.message, success: false };
    }

    const duration = Date.now() - startTime;
    logger.info("Conversations fetched", {
      accountId,
      duration,
      count: conversations?.length || 0,
    });

    return {
      data: (conversations as TChatConversation[]) || [],
      error: null,
      success: true,
    };
  } catch (error) {
    logger.error("Exception in getConversations", error, {
      accountId,
      duration: Date.now() - startTime,
    });
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Erro ao buscar conversas",
      success: false,
    };
  }
}

/**
 * Get a single conversation with all messages
 */
export async function getConversationWithMessages(
  conversationId: string,
): Promise<TApiResponse<TChatConversationWithMessages>> {
  const startTime = Date.now();

  try {
    const { supabase, user } = await requireAuth();

    logger.info("Fetching conversation with messages", {
      conversationId,
      userId: user.id,
    });

    // Get conversation (verify ownership via user_id)
    const { data: conversation, error: convError } = await (
      supabase.from("chat_conversations") as any
    )
      .select("*")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (convError) {
      logger.error("Failed to fetch conversation", convError, {
        conversationId,
      });
      return { data: null, error: convError.message, success: false };
    }

    // Get messages
    const { data: messages, error: msgError } = await (
      supabase.from("chat_messages") as any
    )
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (msgError) {
      logger.error("Failed to fetch messages", msgError, { conversationId });
      return { data: null, error: msgError.message, success: false };
    }

    const duration = Date.now() - startTime;
    logger.info("Conversation with messages fetched", {
      conversationId,
      duration,
      messageCount: messages?.length || 0,
    });

    return {
      data: {
        ...(conversation as TChatConversation),
        messages: (messages as TChatMessage[]) || [],
      },
      error: null,
      success: true,
    };
  } catch (error) {
    logger.error("Exception in getConversationWithMessages", error, {
      conversationId,
      duration: Date.now() - startTime,
    });
    return {
      data: null,
      error: error instanceof Error ? error.message : "Erro ao buscar conversa",
      success: false,
    };
  }
}

/**
 * Create a new conversation
 */
export async function createConversation(
  accountId: string,
  title?: string,
): Promise<TApiResponse<TChatConversation>> {
  const startTime = Date.now();

  try {
    const { supabase, user } = await requireAccountAccess(accountId);

    logger.info("Creating conversation", { accountId, userId: user.id });

    const { data: conversation, error } = await (
      supabase.from("chat_conversations") as any
    )
      .insert({
        account_id: accountId,
        user_id: user.id,
        title: title || null,
      })
      .select()
      .single();

    if (error) {
      logger.error("Failed to create conversation", error, { accountId });
      return { data: null, error: error.message, success: false };
    }

    const duration = Date.now() - startTime;
    logger.info("Conversation created", {
      accountId,
      duration,
      conversationId: conversation?.id,
    });

    revalidatePath("/analytics");

    return {
      data: conversation as TChatConversation,
      error: null,
      success: true,
    };
  } catch (error) {
    logger.error("Exception in createConversation", error, {
      accountId,
      duration: Date.now() - startTime,
    });
    return {
      data: null,
      error: error instanceof Error ? error.message : "Erro ao criar conversa",
      success: false,
    };
  }
}

/**
 * Add a message to a conversation
 */
export async function addMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  metadata?: Record<string, unknown>,
): Promise<TApiResponse<TChatMessage>> {
  const startTime = Date.now();

  try {
    const { supabase, user } = await requireAuth();

    logger.info("Adding message", {
      conversationId,
      role,
      userId: user.id,
      contentLength: content.length,
    });

    const { data: message, error } = await (
      supabase.from("chat_messages") as any
    )
      .insert({
        conversation_id: conversationId,
        role,
        content,
        metadata: metadata || null,
      })
      .select()
      .single();

    if (error) {
      logger.error("Failed to add message", error, { conversationId });
      return { data: null, error: error.message, success: false };
    }

    const duration = Date.now() - startTime;
    logger.info("Message added", {
      conversationId,
      duration,
      messageId: message?.id,
    });

    return {
      data: message as TChatMessage,
      error: null,
      success: true,
    };
  } catch (error) {
    logger.error("Exception in addMessage", error, {
      conversationId,
      duration: Date.now() - startTime,
    });
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Erro ao adicionar mensagem",
      success: false,
    };
  }
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string,
): Promise<TApiResponse<TChatConversation>> {
  const startTime = Date.now();

  try {
    const { supabase, user } = await requireAuth();

    logger.info("Updating conversation title", {
      conversationId,
      userId: user.id,
    });

    const { data: conversation, error } = await (
      supabase.from("chat_conversations") as any
    )
      .update({ title })
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      logger.error("Failed to update conversation title", error, {
        conversationId,
      });
      return { data: null, error: error.message, success: false };
    }

    const duration = Date.now() - startTime;
    logger.info("Conversation title updated", {
      conversationId,
      duration,
    });

    revalidatePath("/analytics");

    return {
      data: conversation as TChatConversation,
      error: null,
      success: true,
    };
  } catch (error) {
    logger.error("Exception in updateConversationTitle", error, {
      conversationId,
      duration: Date.now() - startTime,
    });
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao atualizar título da conversa",
      success: false,
    };
  }
}

/**
 * Delete a conversation and all its messages
 */
export async function deleteConversation(
  conversationId: string,
): Promise<TApiResponse<{ success: true }>> {
  const startTime = Date.now();

  try {
    const { supabase, user } = await requireAuth();

    logger.info("Deleting conversation", { conversationId, userId: user.id });

    const { error } = await (supabase.from("chat_conversations") as any)
      .delete()
      .eq("id", conversationId)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Failed to delete conversation", error, { conversationId });
      return { data: null, error: error.message, success: false };
    }

    const duration = Date.now() - startTime;
    logger.info("Conversation deleted", {
      conversationId,
      duration,
    });

    revalidatePath("/analytics");

    return {
      data: { success: true },
      error: null,
      success: true,
    };
  } catch (error) {
    logger.error("Exception in deleteConversation", error, {
      conversationId,
      duration: Date.now() - startTime,
    });
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Erro ao deletar conversa",
      success: false,
    };
  }
}

/**
 * Get messages for a conversation
 */
export async function getMessages(
  conversationId: string,
): Promise<TApiResponse<TChatMessage[]>> {
  const startTime = Date.now();

  try {
    const { supabase } = await requireAuth();

    logger.info("Fetching messages", { conversationId });

    const { data: messages, error } = await (
      supabase.from("chat_messages") as any
    )
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      logger.error("Failed to fetch messages", error, { conversationId });
      return { data: null, error: error.message, success: false };
    }

    const duration = Date.now() - startTime;
    logger.info("Messages fetched", {
      conversationId,
      duration,
      count: messages?.length || 0,
    });

    return {
      data: (messages as TChatMessage[]) || [],
      error: null,
      success: true,
    };
  } catch (error) {
    logger.error("Exception in getMessages", error, {
      conversationId,
      duration: Date.now() - startTime,
    });
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Erro ao buscar mensagens",
      success: false,
    };
  }
}
