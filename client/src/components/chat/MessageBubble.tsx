// "use client";

// import { useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Reply, Forward, Trash2, Edit2, MoreHorizontal, Languages, Check, CheckCheck } from "lucide-react";
// import { Message, User } from "@/types";
// import { cn, formatMessageTime } from "@/lib/utils";
// import { useAuthStore } from "@/stores/authStore";
// import { useMessageTranslation } from "@/hooks/useTranslation";
// import { useUIStore } from "@/stores/uiStore";
// import { ImageViewer } from "@/components/media/ImageViewer";

// interface MessageBubbleProps {
//   message: Message;
//   onReply: (message: Message) => void;
//   onDelete: (messageId: string, deleteForEveryone: boolean) => void;
//   onEdit: (message: Message) => void;
//   onReact: (messageId: string, emoji: string) => void;
//   onForward: (message: Message) => void;
// }

// const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "🙏", "👍"];

// const ReadStatus = ({ message, currentUserId }: { message: Message; currentUserId: string }) => {
//   const senderId = typeof message.senderId === "string" ? message.senderId : message.senderId._id;
//   if (senderId !== currentUserId) return null;

//   if (message.status === "sending") return <Check className="w-3 h-3 text-gray-400" />;
//   if (message.readBy.length > 0) return <CheckCheck className="w-3 h-3 text-indigo-400" />;
//   if (message.deliveredTo.length > 0) return <CheckCheck className="w-3 h-3 text-gray-400" />;
//   return <Check className="w-3 h-3 text-gray-400" />;
// };

// export const MessageBubble = ({
//   message, onReply, onDelete, onEdit, onReact, onForward,
// }: MessageBubbleProps) => {
//   const { user } = useAuthStore();
//   useUIStore();
//   const { translations, translateMessage } = useMessageTranslation();
//   const [showActions, setShowActions] = useState(false);
//   const [showReactions, setShowReactions] = useState(false);
//   const [showDeleteMenu, setShowDeleteMenu] = useState(false);
//   const [viewingImage, setViewingImage] = useState<string | null>(null);

//   const senderId = typeof message.senderId === "string" ? message.senderId : message.senderId._id;
//   const isOwn = senderId === user?._id;
//   const sender = typeof message.senderId === "object" ? message.senderId as User : null;

//   if (message.isDeleted) {
//     return (
//       <div className={cn("flex mb-2", isOwn ? "justify-end" : "justify-start")}>
//         <div className="bg-gray-700/50 text-gray-500 text-xs italic px-4 py-2 rounded-full">
//           🚫 This message was deleted
//         </div>
//       </div>
//     );
//   }

//   const renderContent = () => {
//     switch (message.type) {
//       case "image":
//         return (
//           <div className="relative max-w-xs">
//             <img
//               src={message.media?.url}
//               alt="Image"
//               className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity"
//               loading="lazy"
//               onClick={() => setViewingImage(message.media?.url ?? null)}
//             />
//             {message.content && (
//               <p className="text-sm mt-1 text-white">{message.content}</p>
//             )}
//             <ImageViewer
//               src={viewingImage ?? ""}
//               isOpen={!!viewingImage}
//               onClose={() => setViewingImage(null)}
//               alt="Image"
//             />
//           </div>
//         );
//       case "video":
//         return (
//           <div className="relative max-w-xs">
//             <video
//               src={message.media?.url}
//               controls
//               poster={message.media?.thumbnail}
//               className="rounded-lg max-w-full"
//             />
//           </div>
//         );
//       case "voice_note":
//         return (
//           <div className="flex items-center gap-3 min-w-[200px]">
//             <button className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
//               <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
//                 <path d="M8 5v14l11-7z" />
//               </svg>
//             </button>
//             <div className="flex-1 h-1 bg-gray-600 rounded-full">
//               <div className="h-full w-0 bg-indigo-400 rounded-full" />
//             </div>
//             <span className="text-xs text-gray-400">
//               {message.media?.duration ? `${Math.round(message.media.duration)}s` : "0s"}
//             </span>
//           </div>
//         );
//       case "file":
//         return (
          
//            <a href={message.media?.url}
//             target="_blank"
//             rel="noopener noreferrer"
//             className="flex items-center gap-3 hover:opacity-80 transition-opacity"
//           >
//             <div className="w-10 h-10 bg-indigo-600/30 rounded-lg flex items-center justify-center flex-shrink-0">
//               <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//               </svg>
//             </div>
//             <div>
//               <p className="text-sm font-medium text-white truncate max-w-[150px]">
//                 {message.media?.originalName ?? "File"}
//               </p>
//               <p className="text-xs text-gray-400">
//                 {message.media?.size ? `${Math.round(message.media.size / 1024)} KB` : ""}
//               </p>
//             </div>
//           </a>
//         );
//       case "sticker":
//         return (
//           <img
//             src={message.media?.url}
//             alt="Sticker"
//             className="w-32 h-32 object-contain"
//           />
//         );
//       case "emoji_only":
//         return <span className="text-5xl">{message.content}</span>;
//       default:
//         return (
//           <div>
//             {message.replyTo && (
//               <div className="border-l-2 border-indigo-400 pl-2 mb-2 opacity-70">
//                 <p className="text-xs text-indigo-300 font-medium">
//                   {typeof message.replyTo.senderId === "object"
//                     ? (message.replyTo.senderId as User).username
//                     : "User"}
//                 </p>
//                 <p className="text-xs text-gray-300 truncate">{message.replyTo.content}</p>
//               </div>
//             )}
//             <p className={cn(
//               "text-sm leading-relaxed whitespace-pre-wrap break-words",
//               isOwn ? "text-white" : "text-gray-100"
//             )}>
//               {message.content}
//             </p>
//             {translations[message._id] && (
//               <div className="mt-2 pt-2 border-t border-white/10">
//                 <p className="text-xs text-gray-300 italic">{translations[message._id]}</p>
//               </div>
//             )}
//             {message.linkPreview && (
              
//               <a  href={message.linkPreview.url}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="block mt-2 bg-gray-700/50 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors"
//               >
//                 {message.linkPreview.image && (
//                   <img src={message.linkPreview.image} alt="" className="w-full h-32 object-cover" />
//                 )}
//                 <div className="p-2">
//                   <p className="text-xs font-medium text-white truncate">{message.linkPreview.title}</p>
//                   {message.linkPreview.description && (
//                     <p className="text-xs text-gray-400 truncate mt-0.5">{message.linkPreview.description}</p>
//                   )}
//                   <p className="text-xs text-indigo-400 mt-1">{message.linkPreview.siteName}</p>
//                 </div>
//               </a>
//             )}
//           </div>
//         );
//     }
//   };

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 10 }}
//       animate={{ opacity: 1, y: 0 }}
//       className={cn("flex gap-2 mb-2 group", isOwn ? "flex-row-reverse" : "flex-row")}
//       onMouseEnter={() => setShowActions(true)}
//       onMouseLeave={() => { setShowActions(false); setShowReactions(false); setShowDeleteMenu(false); }}
//     >
//       {!isOwn && (
//         <div className="flex-shrink-0 self-end">
//           {sender?.avatar ? (
//             <img src={sender.avatar} alt={sender.username} className="w-8 h-8 rounded-full object-cover" />
//           ) : (
//             <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-medium">
//               {sender?.username?.[0]?.toUpperCase() ?? "?"}
//             </div>
//           )}
//         </div>
//       )}

//       <div className={cn("flex flex-col max-w-[70%]", isOwn ? "items-end" : "items-start")}>
//         {!isOwn && sender && (
//           <span className="text-xs text-indigo-400 font-medium mb-1 px-1">{sender.username}</span>
//         )}

//         <div className="relative">
//           <AnimatePresence>
//             {showReactions && (
//               <motion.div
//                 initial={{ opacity: 0, scale: 0.8, y: 5 }}
//                 animate={{ opacity: 1, scale: 1, y: 0 }}
//                 exit={{ opacity: 0, scale: 0.8 }}
//                 className={cn(
//                   "absolute -top-12 bg-gray-700 rounded-full px-2 py-1.5 flex gap-1 shadow-xl border border-gray-600 z-10",
//                   isOwn ? "right-0" : "left-0"
//                 )}
//               >
//                 {QUICK_REACTIONS.map((emoji) => (
//                   <button
//                     key={emoji}
//                     onClick={() => { onReact(message._id, emoji); setShowReactions(false); }}
//                     className="text-lg hover:scale-125 transition-transform"
//                   >
//                     {emoji}
//                   </button>
//                 ))}
//               </motion.div>
//             )}
//           </AnimatePresence>

//           <AnimatePresence>
//             {showActions && (
//               <motion.div
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 exit={{ opacity: 0 }}
//                 className={cn(
//                   "absolute top-0 flex items-center gap-1 z-10",
//                   isOwn ? "-left-24" : "-right-24"
//                 )}
//               >
//                 <button
//                   onClick={() => setShowReactions(true)}
//                   className="w-7 h-7 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-gray-300 hover:text-white transition-colors"
//                 >
//                   😊
//                 </button>
//                 <button
//                   onClick={() => onReply(message)}
//                   className="w-7 h-7 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-gray-300 hover:text-white transition-colors"
//                 >
//                   <Reply className="w-3.5 h-3.5" />
//                 </button>
//                 <button
//                   onClick={() => translateMessage(message._id)}
//                   className="w-7 h-7 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-gray-300 hover:text-white transition-colors"
//                 >
//                   <Languages className="w-3.5 h-3.5" />
//                 </button>
//                 {isOwn && (
//                   <button
//                     onClick={() => setShowDeleteMenu(!showDeleteMenu)}
//                     className="w-7 h-7 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-gray-300 hover:text-white transition-colors"
//                   >
//                     <MoreHorizontal className="w-3.5 h-3.5" />
//                   </button>
//                 )}
//               </motion.div>
//             )}
//           </AnimatePresence>

//           <AnimatePresence>
//             {showDeleteMenu && isOwn && (
//               <motion.div
//                 initial={{ opacity: 0, scale: 0.9 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 exit={{ opacity: 0, scale: 0.9 }}
//                 className="absolute -top-24 right-0 bg-gray-700 rounded-xl shadow-xl border border-gray-600 overflow-hidden z-20 w-44"
//               >
//                 <button
//                   onClick={() => { onEdit(message); setShowDeleteMenu(false); }}
//                   className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-600 transition-colors"
//                 >
//                   <Edit2 className="w-3.5 h-3.5" /> Edit
//                 </button>
//                 <button
//                   onClick={() => { onForward(message); setShowDeleteMenu(false); }}
//                   className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-600 transition-colors"
//                 >
//                   <Forward className="w-3.5 h-3.5" /> Forward
//                 </button>
//                 <button
//                   onClick={() => { onDelete(message._id, false); setShowDeleteMenu(false); }}
//                   className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-gray-600 transition-colors"
//                 >
//                   <Trash2 className="w-3.5 h-3.5" /> Delete for me
//                 </button>
//                 <button
//                   onClick={() => { onDelete(message._id, true); setShowDeleteMenu(false); }}
//                   className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-gray-600 transition-colors border-t border-gray-600"
//                 >
//                   <Trash2 className="w-3.5 h-3.5" /> Delete for everyone
//                 </button>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           <div className={cn(
//             "px-4 py-2.5 rounded-2xl shadow-sm",
//             isOwn ? "bg-indigo-600 rounded-tr-sm" : "bg-gray-700 rounded-tl-sm",
//             message.type === "sticker" || message.type === "emoji_only" ? "bg-transparent shadow-none px-0" : ""
//           )}>
//             {renderContent()}
//           </div>

//           {message.reactions.length > 0 && (
//             <div className={cn("flex flex-wrap gap-1 mt-1", isOwn ? "justify-end" : "justify-start")}>
//               {message.reactions.map((reaction) => (
//                 <button
//                   key={reaction.emoji}
//                   onClick={() => onReact(message._id, reaction.emoji)}
//                   className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 rounded-full px-2 py-0.5 text-xs transition-colors border border-gray-600"
//                 >
//                   <span>{reaction.emoji}</span>
//                   <span className="text-gray-300">{reaction.users.length}</span>
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>

//         <div className={cn("flex items-center gap-1 mt-1 px-1", isOwn ? "flex-row-reverse" : "flex-row")}>
//           <span className="text-xs text-gray-500">{formatMessageTime(message.createdAt)}</span>
//           {message.isEdited && <span className="text-xs text-gray-500">• edited</span>}
//           <ReadStatus message={message} currentUserId={user?._id ?? ""} />
//         </div>
//       </div>
//     </motion.div>
//   );
// };


"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Reply, Forward, Trash2, Edit2, MoreHorizontal, Languages, Check, CheckCheck } from "lucide-react";
import { Message, User } from "@/types";
import { cn, formatMessageTime } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useMessageTranslation } from "@/hooks/useTranslation";
import { ImageViewer } from "@/components/media/ImageViewer";

interface MessageBubbleProps {
  message: Message;
  onReply: (message: Message) => void;
  onDelete: (messageId: string, deleteForEveryone: boolean) => void;
  onEdit: (message: Message) => void;
  onReact: (messageId: string, emoji: string) => void;
  onForward: (message: Message) => void;
}

const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "🙏", "👍"];

const ReadStatus = ({ message, currentUserId }: { message: Message; currentUserId: string }) => {
  const senderId = typeof message.senderId === "string" ? message.senderId : message.senderId._id;
  if (senderId !== currentUserId) return null;
  if (message.status === "sending") return <Check className="w-3 h-3 text-gray-400" />;
  if (message.readBy.length > 0) return <CheckCheck className="w-3 h-3 text-indigo-400" />;
  if (message.deliveredTo.length > 0) return <CheckCheck className="w-3 h-3 text-gray-400" />;
  return <Check className="w-3 h-3 text-gray-400" />;
};

const VoiceNotePlayer = ({ url, duration, isOwn }: { url: string; duration: number; isOwn: boolean }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.ontimeupdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
        setCurrentTime(audio.currentTime);
      }
    };

    audio.onended = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [url]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * audio.duration;
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = Math.floor(secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <button
        onClick={togglePlay}
        className="w-8 h-8 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
      >
        {isPlaying ? (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <div
        className="flex-1 h-1.5 rounded-full cursor-pointer"
        style={{ backgroundColor: isOwn ? "rgba(255,255,255,0.2)" : "var(--bg-tertiary)" }}
        onClick={handleSeek}
      >
        <div
          className="h-full bg-indigo-400 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs font-mono flex-shrink-0" style={{ color: isOwn ? "rgba(255,255,255,0.7)" : "var(--text-muted)" }}>
        {isPlaying ? formatTime(currentTime) : formatTime(duration)}
      </span>
    </div>
  );
};

export const MessageBubble = ({
  message, onReply, onDelete, onEdit, onReact, onForward,
}: MessageBubbleProps) => {
  const { user } = useAuthStore();
  const { translations, translateMessage } = useMessageTranslation();
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const senderId = typeof message.senderId === "string" ? message.senderId : message.senderId._id;
  const isOwn = senderId === user?._id;
  const sender = typeof message.senderId === "object" ? message.senderId as User : null;

  if (message.isDeleted) {
    return (
      <div className={cn("flex mb-4", isOwn ? "justify-end" : "justify-start")}>
        <div className="text-xs italic px-4 py-2 rounded-full" style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)" }}>
          🚫 This message was deleted
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (message.type) {
      case "image":
        return (
          <div className="relative max-w-xs">
            <img
              src={message.media?.url}
              alt="Image"
              className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity"
              loading="lazy"
              onClick={() => setViewingImage(message.media?.url ?? null)}
            />
            {message.content && <p className="text-sm mt-1">{message.content}</p>}
            <ImageViewer
              src={viewingImage ?? ""}
              isOpen={!!viewingImage}
              onClose={() => setViewingImage(null)}
              alt="Image"
            />
          </div>
        );
      case "video":
        return (
          <div className="relative max-w-xs">
            <video src={message.media?.url} controls poster={message.media?.thumbnail} className="rounded-lg max-w-full" />
          </div>
        );
      case "voice_note":
        return (
          <VoiceNotePlayer
            url={message.media?.url ?? ""}
            duration={message.media?.duration ?? 0}
            isOwn={isOwn}
          />
        );
      case "file":
        return (
          <a href={message.media?.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-indigo-600/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium truncate max-w-[150px]">{message.media?.originalName ?? "File"}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {message.media?.size ? `${Math.round(message.media.size / 1024)} KB` : ""}
              </p>
            </div>
          </a>
        );
      case "sticker":
        return <img src={message.media?.url} alt="Sticker" className="w-32 h-32 object-contain" />;
      case "emoji_only":
        return <span className="text-5xl">{message.content}</span>;
      default:
        return (
          <div>
            {message.replyTo && (
              <div className="border-l-2 border-indigo-400 pl-2 mb-4 opacity-70">
                <p className="text-xs text-indigo-300 font-medium">
                  {typeof message.replyTo.senderId === "object" ? (message.replyTo.senderId as User).username : "User"}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{message.replyTo.content}</p>
              </div>
            )}
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
            {translations[message._id] && (
              <div className="mt-2 pt-2 border-t border-white/10">
                <p className="text-xs italic" style={{ color: "var(--text-secondary)" }}>{translations[message._id]}</p>
              </div>
            )}
            {message.linkPreview && (
              <a href={message.linkPreview.url} target="_blank" rel="noopener noreferrer"
                className="block mt-2 rounded-lg overflow-hidden transition-colors"
                style={{ backgroundColor: "var(--bg-tertiary)" }}>
                {message.linkPreview.image && (
                  <img src={message.linkPreview.image} alt="" className="w-full h-32 object-cover" />
                )}
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{message.linkPreview.title}</p>
                  {message.linkPreview.description && (
                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{message.linkPreview.description}</p>
                  )}
                  <p className="text-xs text-indigo-400 mt-1">{message.linkPreview.siteName}</p>
                </div>
              </a>
            )}
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-2 mb-4 group", isOwn ? "flex-row-reverse" : "flex-row")}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReactions(false); setShowDeleteMenu(false); }}
    >
      {!isOwn && (
        <div className="flex-shrink-0 self-end">
          {sender?.avatar ? (
            <img src={sender.avatar} alt={sender.username} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-medium">
              {sender?.username?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
        </div>
      )}

      <div className={cn("flex flex-col max-w-[70%]", isOwn ? "items-end" : "items-start")}>
        {!isOwn && sender && (
          <span className="text-xs text-indigo-400 font-medium mb-1 px-1">{sender.username}</span>
        )}

        <div className="relative">
          <AnimatePresence>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={cn("absolute -top-12 rounded-full px-2 py-1.5 flex gap-1 shadow-xl z-10 border", isOwn ? "right-0" : "left-0")}
                style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border)" }}
              >
                {QUICK_REACTIONS.map((emoji) => (
                  <button key={emoji} onClick={() => { onReact(message._id, emoji); setShowReactions(false); }}
                    className="text-lg hover:scale-125 transition-transform">
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn("absolute top-0 flex items-center gap-1 z-10", isOwn ? "-left-24" : "-right-24")}
              >
                <button onClick={() => setShowReactions(true)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                  style={{ backgroundColor: "var(--bg-tertiary)" }}>
                  😊
                </button>
                <button onClick={() => onReply(message)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                  style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)" }}>
                  <Reply className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => translateMessage(message._id)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                  style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)" }}>
                  <Languages className="w-3.5 h-3.5" />
                </button>
                {isOwn && (
                  <button onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                    style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)" }}>
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showDeleteMenu && isOwn && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute -top-24 right-0 rounded-xl shadow-xl overflow-hidden z-20 w-44 border"
                style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border)" }}
              >
                <button onClick={() => { onEdit(message); setShowDeleteMenu(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--bg-hover)]"
                  style={{ color: "var(--text-primary)" }}>
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => { onForward(message); setShowDeleteMenu(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--bg-hover)]"
                  style={{ color: "var(--text-primary)" }}>
                  <Forward className="w-3.5 h-3.5" /> Forward
                </button>
                <button onClick={() => { onDelete(message._id, false); setShowDeleteMenu(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-[var(--bg-hover)]">
                  <Trash2 className="w-3.5 h-3.5" /> Delete for me
                </button>
                <button onClick={() => { onDelete(message._id, true); setShowDeleteMenu(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-[var(--bg-hover)] border-t"
                  style={{ borderColor: "var(--border)" }}>
                  <Trash2 className="w-3.5 h-3.5" /> Delete for everyone
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className={cn(
              "px-4 py-2.5 rounded-2xl shadow-sm",
              isOwn ? "rounded-tr-sm" : "rounded-tl-sm",
              message.type === "sticker" || message.type === "emoji_only" ? "shadow-none px-0" : ""
            )}
            style={{
              backgroundColor: message.type === "sticker" || message.type === "emoji_only"
                ? "transparent"
                : isOwn ? "var(--bubble-own)" : "var(--bubble-other)",
              color: isOwn ? "var(--bubble-own-text)" : "var(--bubble-other-text)",
            }}
          >
            {renderContent()}
          </div>

          {message.reactions.length > 0 && (
            <div className={cn("flex flex-wrap gap-1 mt-1", isOwn ? "justify-end" : "justify-start")}>
              {message.reactions.map((reaction) => (
                <button key={reaction.emoji} onClick={() => onReact(message._id, reaction.emoji)}
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors border"
                  style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
                  <span>{reaction.emoji}</span>
                  <span>{reaction.users.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={cn("flex items-center gap-1 mt-1 px-1", isOwn ? "flex-row-reverse" : "flex-row")}>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{formatMessageTime(message.createdAt)}</span>
          {message.isEdited && <span className="text-xs" style={{ color: "var(--text-muted)" }}>• edited</span>}
          <ReadStatus message={message} currentUserId={user?._id ?? ""} />
        </div>
      </div>
    </motion.div>
  );
};