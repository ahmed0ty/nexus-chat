"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Video, Search, MoreVertical, Bell, Trash2, UserX, Info, X } from "lucide-react";
import { Conversation, User } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { cn, getInitials, formatLastSeen } from "@/lib/utils";
import { useChatStore } from "@/stores/chatStore";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useCall } from "@/hooks/useCall";
import { CallOverlay } from "@/components/chat/CallOverlay";

interface ConversationHeaderProps {
  conversation: Conversation;
  onSearchToggle: () => void;
}

export const ConversationHeader = ({ conversation, onSearchToggle }: ConversationHeaderProps) => {
  const { user } = useAuthStore();
  const { onlineUsers, setActiveConversation } = useChatStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const queryClient = useQueryClient();

  const {
    callState,
    callerName,
    callDuration,
    isMuted,
    isSpeaker,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleSpeaker,
  } = useCall();

  const getOtherParticipant = (): User | null => {
    if (conversation.type !== "direct") return null;
    const other = conversation.participants.find((p) => {
      const id = typeof p.userId === "object" ? p.userId._id : p.userId;
      return id !== user?._id;
    });
    if (!other || typeof other.userId !== "object") return null;
    return other.userId as User;
  };

  const otherUser = getOtherParticipant();
  const getName = (): string =>
    conversation.type !== "direct"
      ? conversation.name ?? "Group"
      : otherUser?.username ?? "Unknown";
  const getAvatar = (): string | undefined =>
    conversation.type !== "direct" ? conversation.avatar : otherUser?.avatar;
  const isOnline = otherUser ? onlineUsers.has(otherUser._id) : false;

  const getStatusText = (): string => {
    if (conversation.type !== "direct")
      return `${conversation.participants.length} members`;
    if (isOnline) return "Online";
    if (otherUser?.lastSeen)
      return `Last seen ${formatLastSeen(otherUser.lastSeen)}`;
    return "Offline";
  };

  const name = getName();
  const avatar = getAvatar();

  const handleDeleteConversation = async () => {
    try {
      await api.delete(`/conversations/${conversation._id}`);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setActiveConversation(null);
      setShowMenu(false);
    } catch {
      alert("Failed to delete conversation");
    }
  };

  return (
    <>
      <div
        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ backgroundColor: "var(--header-bg)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            {avatar ? (
              <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-sm">
                {getInitials(name)}
              </div>
            )}
            {conversation.type === "direct" && (
              <div
                className={cn(
                  "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2",
                  isOnline ? "bg-green-500" : "bg-gray-500"
                )}
                style={{ borderColor: "var(--header-bg)" }}
              />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {name}
            </h3>
            <p
              className={cn("text-xs", isOnline ? "text-green-400" : "")}
              style={!isOnline ? { color: "var(--text-muted)" } : {}}
            >
              {getStatusText()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {[
            { icon: <Phone className="w-4 h-4" />, onClick: () => startCall(conversation._id) },
            { icon: <Video className="w-4 h-4" />, onClick: () => {} },
            { icon: <Search className="w-4 h-4" />, onClick: onSearchToggle },
            { icon: <Info className="w-4 h-4" />, onClick: () => setShowInfo(true) },
          ].map((btn, i) => (
            <button
              key={i}
              onClick={btn.onClick}
              className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              {btn.icon}
            </button>
          ))}

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-10 w-48 rounded-xl shadow-xl overflow-hidden z-20 border"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--bg-hover)]"
                      style={{ color: "var(--text-primary)" }}
                    >
                      <Bell className="w-4 h-4" /> Mute notifications
                    </button>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--bg-hover)]"
                      style={{ color: "var(--text-primary)" }}
                    >
                      <Search className="w-4 h-4" /> Search messages
                    </button>
                    {conversation.type === "direct" && (
                      <button
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-[var(--bg-hover)] border-t"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <UserX className="w-4 h-4" /> Block user
                      </button>
                    )}
                    <button
                      onClick={handleDeleteConversation}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-[var(--bg-hover)]"
                    >
                      <Trash2 className="w-4 h-4" /> Delete conversation
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Call Overlay */}
      <CallOverlay
        callState={callState}
        callerName={callerName}
        callDuration={callDuration}
        isMuted={isMuted}
        isSpeaker={isSpeaker}
        onAccept={acceptCall}
        onReject={rejectCall}
        onEnd={endCall}
        onToggleMute={toggleMute}
        onToggleSpeaker={toggleSpeaker}
      />

      <AnimatePresence>
        {showInfo && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setShowInfo(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="fixed right-0 top-0 h-full w-80 border-l z-50 overflow-y-auto"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border)",
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-4 border-b"
                style={{ borderColor: "var(--border)" }}
              >
                <h3
                  className="text-lg font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {conversation.type === "direct" ? "Contact Info" : "Group Info"}
                </h3>
                <button
                  onClick={() => setShowInfo(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div
                className="flex flex-col items-center py-6 border-b"
                style={{ borderColor: "var(--border)" }}
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name}
                    className="w-20 h-20 rounded-full object-cover mb-3"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-medium mb-3">
                    {getInitials(name)}
                  </div>
                )}
                <h4
                  className="text-lg font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {name}
                </h4>
                <p
                  className={cn("text-sm mt-1", isOnline ? "text-green-400" : "")}
                  style={!isOnline ? { color: "var(--text-muted)" } : {}}
                >
                  {getStatusText()}
                </p>
              </div>

              {conversation.type !== "direct" && (
                <div className="px-4 py-4">
                  <h5
                    className="text-xs font-medium uppercase mb-3"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Members ({conversation.participants.length})
                  </h5>
                  <div className="space-y-2">
                    {conversation.participants.map((p) => {
                      const participant =
                        typeof p.userId === "object" ? (p.userId as User) : null;
                      if (!participant) return null;
                      return (
                        <div key={participant._id} className="flex items-center gap-3">
                          {participant.avatar ? (
                            <img
                              src={participant.avatar}
                              alt={participant.username}
                              className="w-9 h-9 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                              {getInitials(participant.username)}
                            </div>
                          )}
                          <div className="flex-1">
                            <p
                              className="text-sm font-medium"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {participant.username}
                            </p>
                            <p
                              className="text-xs capitalize"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {p.role}
                            </p>
                          </div>
                          {onlineUsers.has(participant._id) && (
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};