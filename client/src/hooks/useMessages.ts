"use client";

import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import api from "@/lib/axios";
import { getSocket } from "@/lib/socket";
import { useChatStore } from "@/stores/chatStore";
import { Message, ApiResponse } from "@/types";
import { generateTempId } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

export const useMessages = (conversationId: string) => {
  const setMessages = useChatStore((s) => s.setMessages);
  const messages = useChatStore((s) => s.messages);
  const { user } = useAuthStore();

  const query = useInfiniteQuery({
    queryKey: ["messages", conversationId],
    queryFn: async ({ pageParam }) => {
      const params = pageParam ? `?cursor=${pageParam}` : "";
      const { data } = await api.get<ApiResponse<Message[]>>(
        `/messages/${conversationId}${params}`
      );
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.pagination?.nextCursor,
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (query.data) {
      const allMessages = query.data.pages
        .flatMap((p) => p.data ?? [])
        .reverse();
      setMessages(conversationId, allMessages);
    }
  }, [query.data, conversationId, setMessages]);

  const sendMutation = useMutation({
    mutationFn: async (payload: {
      type: Message["type"];
      content: string;
      media?: Message["media"];
      replyTo?: string;
      mentions?: string[];
    }) => {
      const socket = getSocket();
      const tempId = generateTempId();

      const optimisticMessage: Message = {
        _id: tempId,
        conversationId,
        senderId: user!,
        type: payload.type,
        content: payload.content,
        media: payload.media,
        reactions: [],
        readBy: [],
        deliveredTo: [],
        isEdited: false,
        isDeleted: false,
        isPinned: false,
        mentions: payload.mentions ?? [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tempId,
        status: "sending",
      };

      useChatStore.getState().addMessage(conversationId, optimisticMessage);
      socket.emit("message:send", { ...payload, conversationId, tempId });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      getSocket().emit("message:edit", { messageId, content });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ messageId, deleteForEveryone }: { messageId: string; deleteForEveryone: boolean }) => {
      useChatStore.getState().deleteMessage(conversationId, messageId);
      getSocket().emit("message:delete", { messageId, deleteForEveryone });
    },
  });

  const reactMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      getSocket().emit("message:react", { messageId, emoji });
    },
  });

  return {
    messages: messages[conversationId] ?? [],
    isLoading: query.isLoading,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    sendMessage: sendMutation.mutate,
    editMessage: editMutation.mutate,
    deleteMessage: deleteMutation.mutate,
    reactToMessage: reactMutation.mutate,
  };
};