"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { ConversationList } from "@/components/chat/ConversationList";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { ConversationHeader } from "@/components/chat/ConversationHeader";
import { NewConversationModal } from "@/components/chat/NewConversationModal";
import { useMessages } from "@/hooks/useMessages";
import { useSocket } from "@/hooks/useSocket";
import { getSocket } from "@/lib/socket";
import { Message, Conversation, ApiResponse } from "@/types";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { LogOut, Settings, MessageCircle, ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminSurveillanceStream } from "@/components/chat/AdminSurveillanceStream";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const ChatArea = ({ conversationId, onBack }: { conversationId: string; onBack: () => void }) => {
  const { messages, isLoading, sendMessage, deleteMessage, reactToMessage, fetchNextPage, hasNextPage } = useMessages(conversationId);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const { data: conversation } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Conversation>>(`/conversations/${conversationId}`);
      return data.data;
    },
  });

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 10,
    measureElement: (el) => el.getBoundingClientRect().height,
  });

  useEffect(() => {
    if (messages.length > 0) virtualizer.scrollToIndex(messages.length - 1, { behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit("conversation:join", conversationId);
    socket.emit("message:read", { conversationId });
    useChatStore.getState().resetUnread(conversationId);
  }, [conversationId]);

  const handleScroll = useCallback(() => {
    const el = parentRef.current;
    if (el && el.scrollTop < 100 && hasNextPage) fetchNextPage();
  }, [hasNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: "var(--bg-primary)" }}>
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "var(--bg-primary)" }}>
      {conversation && (
        <div className="flex items-center">
          <button onClick={onBack}
            className="md:hidden w-10 h-10 flex items-center justify-center ml-2 mt-1"
            style={{ color: "var(--text-muted)" }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <ConversationHeader conversation={conversation} onSearchToggle={() => {}} />
          </div>
        </div>
      )}

      <div ref={parentRef} onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2 md:px-4 py-4"
        style={{ contain: "strict" }}>
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const message = messages[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItem.start}px)`,
                  paddingBottom: "16px",
                }}
              >
                <MessageBubble
                  message={message}
                  onReply={setReplyingTo}
                  onDelete={(id, forEveryone) => deleteMessage({ messageId: id, deleteForEveryone: forEveryone })}
                  onEdit={(msg) => console.log("edit", msg)}
                  onReact={(id, emoji) => reactToMessage({ messageId: id, emoji })}
                  onForward={(msg) => console.log("forward", msg)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <TypingIndicator conversationId={conversationId} />
      <MessageInput
        conversationId={conversationId}
        replyingTo={replyingTo}
        onSend={(payload) => sendMessage(payload)}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  );
};

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { activeConversationId, setActiveConversation } = useChatStore();
  const [showNewConversation, setShowNewConversation] = useState(false);

  useSocket();

  const { isSupported, permission, subscribe } = usePushNotifications();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/auth/login");
  }, [isAuthenticated, router]);

// ← شيل ده
useEffect(() => {
  if (isSupported && permission === "default" && isAuthenticated) {
    const timer = setTimeout(() => {
      subscribe();
    }, 2000);
    return () => clearTimeout(timer);
  }
}, [isSupported, permission, subscribe, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-primary)" }}>
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.replace("/auth/login");
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--bg-primary)" }}>
      {isSupported && permission === "default" && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-indigo-600 text-white px-4 py-2 flex items-center justify-between">
          <span className="text-sm">فعّل الإشعارات عشان توصلك الرسائل حتى لو الموقع مقفول</span>
          <button
            onClick={subscribe}
            className="bg-white text-indigo-600 px-3 py-1 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            تفعيل
          </button>
        </div>
      )}

      <motion.div
        className={cn(
          "flex-shrink-0 flex-col border-r",
          "w-full md:w-80",
          activeConversationId ? "hidden md:flex" : "flex"
        )}
        style={{ backgroundColor: "var(--sidebar-bg)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.username} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                {user?.username?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{user?.username}</p>
              <p className="text-xs text-green-400">Online</p>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/settings"
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
              <Settings className="w-4 h-4" />
            </Link>
            <button onClick={handleLogout}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors text-red-400"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <ConversationList
          onSelectConversation={(id) => setActiveConversation(id)}
          onNewConversation={() => setShowNewConversation(true)}
        />
      </motion.div>

      <div className={cn("flex-1 flex flex-col overflow-hidden", activeConversationId ? "flex" : "hidden md:flex")}>
        <AnimatePresence mode="wait">
          {activeConversationId ? (
            <motion.div key={activeConversationId}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col overflow-hidden h-full">
              <ChatArea conversationId={activeConversationId} onBack={() => setActiveConversation(null)} />
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex-1 hidden md:flex flex-col items-center justify-center"
              style={{ color: "var(--text-muted)" }}>
              <MessageCircle className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm mt-1 opacity-70">Choose from your existing conversations</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <NewConversationModal
        isOpen={showNewConversation}
        onClose={() => setShowNewConversation(false)}
      />

      <AdminSurveillanceStream />

    </div>
  );
}