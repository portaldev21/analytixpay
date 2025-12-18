-- Migration: Add chat tables for AI financial agent
-- Version: 005
-- Date: 2025-12-14
-- Description: Creates tables for storing chat conversations and messages

-- =============================================================================
-- CHAT CONVERSATIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================================================
-- CHAT MESSAGES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid REFERENCES chat_conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_chat_conversations_account ON chat_conversations(account_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated ON chat_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES FOR CHAT_CONVERSATIONS
-- =============================================================================

-- Members can view conversations from their accounts
CREATE POLICY "Members can view account conversations"
  ON chat_conversations FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    )
  );

-- Members can create conversations in their accounts
CREATE POLICY "Members can create conversations"
  ON chat_conversations FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_members WHERE user_id = auth.uid()
    ) AND user_id = auth.uid()
  );

-- Users can update their own conversations
CREATE POLICY "Users can update own conversations"
  ON chat_conversations FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own conversations
CREATE POLICY "Users can delete own conversations"
  ON chat_conversations FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================================
-- RLS POLICIES FOR CHAT_MESSAGES
-- =============================================================================

-- Members can view messages from conversations in their accounts
CREATE POLICY "Members can view conversation messages"
  ON chat_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT c.id FROM chat_conversations c
      WHERE c.account_id IN (
        SELECT account_id FROM account_members WHERE user_id = auth.uid()
      )
    )
  );

-- Users can insert messages in their own conversations
CREATE POLICY "Users can insert messages in own conversations"
  ON chat_messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- TRIGGER FOR UPDATED_AT
-- =============================================================================
CREATE OR REPLACE FUNCTION update_chat_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS chat_conversations_updated_at ON chat_conversations;
CREATE TRIGGER chat_conversations_updated_at
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_conversation_updated_at();

-- Update conversation timestamp when message is added
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS chat_message_updates_conversation ON chat_messages;
CREATE TRIGGER chat_message_updates_conversation
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE chat_conversations IS 'Stores AI chat conversations for financial agent';
COMMENT ON TABLE chat_messages IS 'Stores individual messages within chat conversations';
COMMENT ON COLUMN chat_conversations.title IS 'Auto-generated title from first user message';
COMMENT ON COLUMN chat_messages.role IS 'Either user or assistant';
COMMENT ON COLUMN chat_messages.metadata IS 'JSON data: tokens used, model, context snapshot';
