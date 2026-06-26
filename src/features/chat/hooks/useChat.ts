import { useState, useCallback } from 'react';
import type { Conversation, ChatMessage } from '../../../types/index';
import { CONVERSATIONS } from '../../../mocks/chat';
import { useAuthStore } from '../../../store/authStore';

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface UseChatReturn {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  setActiveConversation: (id: string | null) => void;
  sendMessage: (content: string) => void;
}

export function useChat(): UseChatReturn {
  const currentUser = useAuthStore((s) => s.currentUser);
  const [conversations, setConversations] = useState<Conversation[]>([...CONVERSATIONS]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null;

  const setActiveConversation = useCallback((id: string | null) => {
    setActiveConversationId(id);
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      if (!activeConversationId || !currentUser || !content.trim()) return;
      const now = new Date().toISOString();
      const newMessage: ChatMessage = {
        id: generateId(),
        conversationId: activeConversationId,
        senderId: currentUser.id,
        content: content.trim(),
        sentAt: now,
        readBy: [currentUser.id],
        attachments: [],
      };
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? { ...conv, messages: [...conv.messages, newMessage], lastMessageAt: now }
            : conv
        )
      );
    },
    [activeConversationId, currentUser]
  );

  return { conversations, activeConversation, setActiveConversation, sendMessage };
}
