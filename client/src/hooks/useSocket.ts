"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { Message } from "@/types";

export const useSocket = () => {
  const { isAuthenticated, accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const deleteMessage = useChatStore((s) => s.deleteMessage);
  const addTypingUser = useChatStore((s) => s.addTypingUser);
  const removeTypingUser = useChatStore((s) => s.removeTypingUser);
  const setUserOnline = useChatStore((s) => s.setUserOnline);
  const setUserOffline = useChatStore((s) => s.setUserOffline);
  const incrementUnread = useChatStore((s) => s.incrementUnread);
  const updateConversation = useChatStore((s) => s.updateConversation);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const socket = getSocket();

    socket.on("message:new", (message: Message) => {
      addMessage(message.conversationId, message);
      updateConversation(message.conversationId, {
        lastMessage: message,
        updatedAt: new Date().toISOString(),
      });
      if (message.conversationId !== activeConversationId) {
        incrementUnread(message.conversationId);
      }
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });

    socket.on("message:updated", (message: Message) => {
      updateMessage(message.conversationId, message._id, message);
    });

    socket.on("message:deleted", ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
      deleteMessage(conversationId, messageId);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });

    socket.on("message:reaction", ({ messageId, conversationId, reactions }: {
      messageId: string;
      conversationId: string;
      reactions: Message["reactions"];
    }) => {
      updateMessage(conversationId, messageId, { reactions });
    });

    socket.on("message:read_receipt", ({ conversationId, userId: readerId }: {
      conversationId: string;
      userId: string;
      readAt: string;
    }) => {
      const msgs = useChatStore.getState().messages[conversationId] ?? [];
      msgs.forEach((msg) => {
        const senderId = typeof msg.senderId === "object" ? msg.senderId._id : msg.senderId;
        if (senderId === readerId) return;
        updateMessage(conversationId, msg._id, {
          readBy: [...msg.readBy, { userId: readerId, readAt: new Date().toISOString() }],
        });
      });
    });

    socket.on("typing:update", ({ userId, username, avatar, isTyping, conversationId }: {
      userId: string;
      username: string;
      avatar?: string;
      isTyping: boolean;
      conversationId: string;
    }) => {
      if (isTyping) {
        addTypingUser(conversationId, { userId, username, avatar });
      } else {
        removeTypingUser(conversationId, userId);
      }
    });

    socket.on("user:online", ({ userId }: { userId: string }) => setUserOnline(userId));
    socket.on("user:offline", ({ userId }: { userId: string }) => setUserOffline(userId));

    return () => {
      socket.off("message:new");
      socket.off("message:updated");
      socket.off("message:deleted");
      socket.off("message:reaction");
      socket.off("message:read_receipt");
      socket.off("typing:update");
      socket.off("user:online");
      socket.off("user:offline");
    };
  }, [
    isAuthenticated,
    accessToken,
    activeConversationId,
    addMessage,
    updateMessage,
    deleteMessage,
    addTypingUser,
    removeTypingUser,
    setUserOnline,
    setUserOffline,
    incrementUnread,
    updateConversation,
    queryClient,
  ]);
};