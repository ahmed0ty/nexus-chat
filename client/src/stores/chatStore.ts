import { create } from "zustand";
import { Message, Conversation, TypingUser } from "@/types";

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  typingUsers: Record<string, TypingUser[]>;
  onlineUsers: Set<string>;

  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, data: Partial<Conversation>) => void;
  setActiveConversation: (id: string | null) => void;

  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, data: Partial<Message>) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  prependMessages: (conversationId: string, messages: Message[]) => void;

  setTypingUsers: (conversationId: string, users: TypingUser[]) => void;
  addTypingUser: (conversationId: string, user: TypingUser) => void;
  removeTypingUser: (conversationId: string, userId: string) => void;

  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;

  incrementUnread: (conversationId: string) => void;
  resetUnread: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  typingUsers: {},
  onlineUsers: new Set(),

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((state) => ({ conversations: [conversation, ...state.conversations] })),

  updateConversation: (id, data) =>
    set((state) => ({
      conversations: state.conversations.map((c) => c._id === id ? { ...c, ...data } : c),
    })),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setMessages: (conversationId, messages) =>
    set((state) => ({ messages: { ...state.messages, [conversationId]: messages } })),

  addMessage: (conversationId, message) =>
    set((state) => {
      const existing = state.messages[conversationId] ?? [];
      const withoutTemp = message.tempId
        ? existing.filter((m) => m.tempId !== message.tempId)
        : existing;
      return { messages: { ...state.messages, [conversationId]: [...withoutTemp, message] } };
    }),

  updateMessage: (conversationId, messageId, data) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] ?? []).map((m) =>
          m._id === messageId ? { ...m, ...data } : m
        ),
      },
    })),

  deleteMessage: (conversationId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] ?? []).map((m) =>
          m._id === messageId ? { ...m, isDeleted: true, content: "" } : m
        ),
      },
    })),

  prependMessages: (conversationId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...messages, ...(state.messages[conversationId] ?? [])],
      },
    })),

  setTypingUsers: (conversationId, users) =>
    set((state) => ({ typingUsers: { ...state.typingUsers, [conversationId]: users } })),

  addTypingUser: (conversationId, user) =>
    set((state) => {
      const existing = state.typingUsers[conversationId] ?? [];
      if (existing.some((u) => u.userId === user.userId)) return state;
      return { typingUsers: { ...state.typingUsers, [conversationId]: [...existing, user] } };
    }),

  removeTypingUser: (conversationId, userId) =>
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [conversationId]: (state.typingUsers[conversationId] ?? []).filter((u) => u.userId !== userId),
      },
    })),

  setUserOnline: (userId) =>
    set((state) => ({ onlineUsers: new Set([...state.onlineUsers, userId]) })),

  setUserOffline: (userId) =>
    set((state) => {
      const next = new Set(state.onlineUsers);
      next.delete(userId);
      return { onlineUsers: next };
    }),

  incrementUnread: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId ? { ...c, unreadCount: c.unreadCount + 1 } : c
      ),
    })),

  resetUnread: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId ? { ...c, unreadCount: 0 } : c
      ),
    })),
}));