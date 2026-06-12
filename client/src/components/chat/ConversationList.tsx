// "use client";

// import { useQuery } from "@tanstack/react-query";
// import { useEffect } from "react";
// import { motion } from "framer-motion";
// import { Search, Plus, MessageCircle } from "lucide-react";
// import api from "@/lib/axios";
// import { useChatStore } from "@/stores/chatStore";
// import { useAuthStore } from "@/stores/authStore";
// import { getSocket } from "@/lib/socket";
// import { Conversation, ApiResponse } from "@/types";
// import { cn, formatMessageTime, truncateText, getInitials } from "@/lib/utils";

// interface ConversationListProps {
//   onSelectConversation: (id: string) => void;
//   onNewConversation: () => void;
// }

// export const ConversationList = ({ onSelectConversation, onNewConversation }: ConversationListProps) => {
//   const { user } = useAuthStore();
//   const { conversations, setConversations, activeConversationId } = useChatStore();

//   const { data: conversationsData, isLoading } = useQuery({
//     queryKey: ["conversations"],
//     queryFn: async () => {
//       const { data } = await api.get<ApiResponse<Conversation[]>>("/conversations");
//       return data.data ?? [];
//     },
//     refetchInterval: 3000,
//   });

//   useEffect(() => {
//     if (conversationsData) {
//       setConversations(conversationsData);
//     }
//   }, [conversationsData, setConversations]);

//   useEffect(() => {
//     if (conversations.length > 0) {
//       const socket = getSocket();
//       conversations.forEach((conv) => {
//         socket.emit("conversation:join", conv._id);
//       });
//     }
//   }, [conversations]);

//   const getConversationName = (conv: Conversation): string => {
//     if (conv.type !== "direct") return conv.name ?? "Unnamed Group";
//     const other = conv.participants.find((p) => {
//       const id = typeof p.userId === "string" ? p.userId : p.userId?._id;
//       return id !== user?._id;
//     });
//     if (!other) return "Unknown";
//     if (typeof other.userId === "object" && other.userId?.username) {
//       return other.userId.username;
//     }
//     return "Unknown";
//   };

//   const getConversationAvatar = (conv: Conversation): string | undefined => {
//     if (conv.type !== "direct") return conv.avatar;
//     const other = conv.participants.find((p) => {
//       const participantId = typeof p.userId === "object" ? p.userId._id : p.userId;
//       return participantId !== user?._id;
//     });
//     if (!other || typeof other.userId !== "object") return undefined;
//     return other.userId.avatar;
//   };

//   const getLastMessagePreview = (conv: Conversation): string => {
//     if (!conv.lastMessage) return "No messages yet";
//     if (conv.lastMessage.isDeleted) return "🚫 Message deleted";
//     switch (conv.lastMessage.type) {
//       case "image": return "📷 Photo";
//       case "video": return "🎥 Video";
//       case "audio": return "🎵 Audio";
//       case "voice_note": return "🎤 Voice note";
//       case "file": return "📎 File";
//       case "sticker": return "🎭 Sticker";
//       case "gif": return "GIF";
//       case "location": return "📍 Location";
//       default: return truncateText(conv.lastMessage.content ?? "", 40);
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="flex-1 overflow-y-auto">
//         {Array.from({ length: 8 }).map((_, i) => (
//           <div key={i} className="flex items-center gap-3 px-4 py-3">
//             <div className="w-12 h-12 rounded-full bg-gray-700 animate-pulse" />
//             <div className="flex-1 space-y-2">
//               <div className="h-4 bg-gray-700 rounded animate-pulse w-3/4" />
//               <div className="h-3 bg-gray-700 rounded animate-pulse w-1/2" />
//             </div>
//           </div>
//         ))}
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col h-full">
//       <div className="px-4 py-4 border-b border-gray-700">
//         <div className="flex items-center justify-between mb-3">
//           <h2 className="text-lg font-semibold text-white">Messages</h2>
//           <button
//             onClick={onNewConversation}
//             className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors"
//           >
//             <Plus className="w-4 h-4 text-white" />
//           </button>
//         </div>
//         <div className="relative">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//           <input
//             placeholder="Search conversations..."
//             className="w-full bg-gray-700 text-white placeholder-gray-500 rounded-lg pl-9 pr-4 py-2 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//           />
//         </div>
//       </div>

//       <div className="flex-1 overflow-y-auto">
//         {conversations.length === 0 ? (
//           <div className="flex flex-col items-center justify-center h-full text-gray-500">
//             <MessageCircle className="w-12 h-12 mb-3 opacity-50" />
//             <p className="text-sm">No conversations yet</p>
//           </div>
//         ) : (
//           conversations.map((conv) => {
//             const name = getConversationName(conv);
//             const avatar = getConversationAvatar(conv);
//             const preview = getLastMessagePreview(conv);
//             const isActive = conv._id === activeConversationId;
//             const isMuted = conv.mutedBy.some((m) => m.userId === user?._id);
//             const otherParticipant = conv.participants.find((p) => {
//               const id = typeof p.userId === "string" ? p.userId : p.userId?._id;
//               return id !== user?._id;
//             });
//             const isOnline = typeof otherParticipant?.userId === "object"
//               ? otherParticipant.userId.isOnline
//               : false;

//             return (
//               <motion.button
//                 key={conv._id}
//                 onClick={() => onSelectConversation(conv._id)}
//                 whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
//                 className={cn(
//                   "w-full flex items-center gap-3 px-4 py-3 transition-colors text-left",
//                   isActive ? "bg-indigo-600/20 border-r-2 border-indigo-500" : ""
//                 )}
//               >
//                 <div className="relative flex-shrink-0">
//                   {avatar ? (
//                     <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover" />
//                   ) : (
//                     <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-sm">
//                       {getInitials(name)}
//                     </div>
//                   )}
//                   {conv.type === "direct" && (
//                     <div className={cn(
//                       "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800",
//                       isOnline ? "bg-green-500" : "bg-gray-500"
//                     )} />
//                   )}
//                 </div>

//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center justify-between">
//                     <span className="text-sm font-medium text-white truncate">{name}</span>
//                     <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
//                       {conv.lastMessage ? formatMessageTime(conv.lastMessage.createdAt) : ""}
//                     </span>
//                   </div>
//                   <div className="flex items-center justify-between mt-0.5">
//                     <span className="text-xs text-gray-400 truncate">
//                       {isMuted ? "🔇 " : ""}{preview}
//                     </span>
//                     {conv.unreadCount > 0 && (
//                       <span className="ml-2 flex-shrink-0 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
//                         {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               </motion.button>
//             );
//           })
//         )}
//       </div>
//     </div>
//   );
// };
"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Plus, MessageCircle } from "lucide-react";
import api from "@/lib/axios";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { getSocket } from "@/lib/socket";
import { Conversation, ApiResponse } from "@/types";
import { cn, formatMessageTime, truncateText, getInitials } from "@/lib/utils";

interface ConversationListProps {
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

export const ConversationList = ({ onSelectConversation, onNewConversation }: ConversationListProps) => {
  const { user } = useAuthStore();
  const { conversations, setConversations, activeConversationId } = useChatStore();

  const { data: conversationsData, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Conversation[]>>("/conversations");
      return data.data ?? [];
    },
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (conversationsData) setConversations(conversationsData);
  }, [conversationsData, setConversations]);

  useEffect(() => {
    if (conversations.length > 0) {
      const socket = getSocket();
      conversations.forEach((conv) => socket.emit("conversation:join", conv._id));
    }
  }, [conversations]);

  const getConversationName = (conv: Conversation): string => {
    if (conv.type !== "direct") return conv.name ?? "Unnamed Group";
    const other = conv.participants.find((p) => {
      const id = typeof p.userId === "string" ? p.userId : p.userId?._id;
      return id !== user?._id;
    });
    if (!other) return "Unknown";
    if (typeof other.userId === "object" && other.userId?.username) return other.userId.username;
    return "Unknown";
  };

  const getConversationAvatar = (conv: Conversation): string | undefined => {
    if (conv.type !== "direct") return conv.avatar;
    const other = conv.participants.find((p) => {
      const participantId = typeof p.userId === "object" ? p.userId._id : p.userId;
      return participantId !== user?._id;
    });
    if (!other || typeof other.userId !== "object") return undefined;
    return other.userId.avatar;
  };

  const getLastMessagePreview = (conv: Conversation): string => {
    if (!conv.lastMessage) return "No messages yet";
    if (conv.lastMessage.isDeleted) return "🚫 Message deleted";
    switch (conv.lastMessage.type) {
      case "image": return "📷 Photo";
      case "video": return "🎥 Video";
      case "audio": return "🎵 Audio";
      case "voice_note": return "🎤 Voice note";
      case "file": return "📎 File";
      case "sticker": return "🎭 Sticker";
      case "gif": return "GIF";
      case "location": return "📍 Location";
      default: return truncateText(conv.lastMessage.content ?? "", 40);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="w-12 h-12 rounded-full animate-pulse" style={{ backgroundColor: "var(--bg-tertiary)" }} />
            <div className="flex-1 space-y-2">
              <div className="h-4 rounded animate-pulse w-3/4" style={{ backgroundColor: "var(--bg-tertiary)" }} />
              <div className="h-3 rounded animate-pulse w-1/2" style={{ backgroundColor: "var(--bg-tertiary)" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Messages</h2>
          <button
            onClick={onNewConversation}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <input
            placeholder="Search conversations..."
            className="w-full rounded-lg pl-9 pr-4 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500"
            style={{
              backgroundColor: "var(--input-bg)",
              color: "var(--text-primary)",
              borderColor: "var(--border)",
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full" style={{ color: "var(--text-muted)" }}>
            <MessageCircle className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No conversations yet</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const name = getConversationName(conv);
            const avatar = getConversationAvatar(conv);
            const preview = getLastMessagePreview(conv);
            const isActive = conv._id === activeConversationId;
            const isMuted = conv.mutedBy.some((m) => m.userId === user?._id);
            const otherParticipant = conv.participants.find((p) => {
              const id = typeof p.userId === "string" ? p.userId : p.userId?._id;
              return id !== user?._id;
            });
            const isOnline = typeof otherParticipant?.userId === "object"
              ? otherParticipant.userId.isOnline
              : false;

            return (
              <motion.button
                key={conv._id}
                onClick={() => onSelectConversation(conv._id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 transition-colors text-left",
                  isActive ? "bg-indigo-600/20 border-r-2 border-indigo-500" : "hover:bg-[var(--bg-hover)]"
                )}
              >
                <div className="relative flex-shrink-0">
                  {avatar ? (
                    <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-sm">
                      {getInitials(name)}
                    </div>
                  )}
                  {conv.type === "direct" && (
                    <div className={cn(
                      "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2",
                      isOnline ? "bg-green-500" : "bg-gray-500"
                    )} style={{ borderColor: "var(--sidebar-bg)" }} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{name}</span>
                    <span className="text-xs flex-shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>
                      {conv.lastMessage ? formatMessageTime(conv.lastMessage.createdAt) : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                      {isMuted ? "🔇 " : ""}{preview}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 flex-shrink-0 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
};