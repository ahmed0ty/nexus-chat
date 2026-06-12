// "use client";

// import { useState, useRef, useCallback, KeyboardEvent } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Send, Paperclip, Smile, Mic, X } from "lucide-react";
// import { useDropzone } from "react-dropzone";
// import { Message, MediaContent } from "@/types";
// import { useTyping } from "@/hooks/useTyping";
// import { useMediaUpload } from "@/hooks/useMediaUpload";
// import { EmojiPicker } from "@/components/emoji/EmojiPicker";
// import { VoiceRecorder } from "@/components/chat/VoiceRecorder";
// import { cn, isEmojiOnly } from "@/lib/utils";

// interface MessageInputProps {
//   conversationId: string;
//   replyingTo: Message | null;
//   onSend: (payload: {
//     type: Message["type"];
//     content: string;
//     media?: Message["media"];
//     replyTo?: string;
//   }) => void;
//   onCancelReply: () => void;
// }

// export const MessageInput = ({
//   conversationId, replyingTo, onSend, onCancelReply,
// }: MessageInputProps) => {
//   const [content, setContent] = useState("");
//   const [showEmoji, setShowEmoji] = useState(false);
//   const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
//   const textareaRef = useRef<HTMLTextAreaElement>(null);
//   const { startTyping, stopTyping } = useTyping(conversationId);
//   const { uploadFile, uploads } = useMediaUpload();

//   const handleSend = useCallback(() => {
//     const trimmed = content.trim();
//     if (!trimmed) return;
//     const type = isEmojiOnly(trimmed) ? "emoji_only" : "text";
//     onSend({ type, content: trimmed, replyTo: replyingTo?._id });
//     setContent("");
//     stopTyping();
//     if (textareaRef.current) textareaRef.current.style.height = "auto";
//   }, [content, replyingTo, onSend, stopTyping]);

//   const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       handleSend();
//     }
//   };

//   const handleChange = (value: string) => {
//     setContent(value);
//     if (value.trim()) startTyping();
//     else stopTyping();
//     if (textareaRef.current) {
//       textareaRef.current.style.height = "auto";
//       textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
//     }
//   };

//   const handleEmojiSelect = (emoji: string) => {
//     setContent((prev) => prev + emoji);
//     textareaRef.current?.focus();
//   };

//   const handleVoiceSend = (media: MediaContent, duration: number) => {
//     onSend({
//       type: "voice_note",
//       content: "",
//       media: { ...media, duration },
//     });
//     setShowVoiceRecorder(false);
//   };

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     noClick: true,
//     onDrop: async (files) => {
//       for (const file of files) {
//         const media = await uploadFile(file);
//         if (media) {
//           const type = file.type.startsWith("image/") ? "image"
//             : file.type.startsWith("video/") ? "video"
//             : file.type.startsWith("audio/") ? "audio" : "file";
//           onSend({ type, content: "", media });
//         }
//       }
//     },
//   });

//   const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = Array.from(e.target.files ?? []);
//     for (const file of files) {
//       const media = await uploadFile(file);
//       if (media) {
//         const type = file.type.startsWith("image/") ? "image"
//           : file.type.startsWith("video/") ? "video"
//           : file.type.startsWith("audio/") ? "audio" : "file";
//         onSend({ type, content: "", media });
//       }
//     }
//     e.target.value = "";
//   };

//   const handlePaste = async (e: React.ClipboardEvent) => {
//     const items = Array.from(e.clipboardData.items);
//     const imageItem = items.find((item) => item.type.startsWith("image/"));
//     if (imageItem) {
//       e.preventDefault();
//       const file = imageItem.getAsFile();
//       if (file) {
//         const media = await uploadFile(file);
//         if (media) onSend({ type: "image", content: "", media });
//       }
//     }
//   };

//   if (showVoiceRecorder) {
//     return (
//       <AnimatePresence>
//         <VoiceRecorder
//           onSend={handleVoiceSend}
//           onCancel={() => setShowVoiceRecorder(false)}
//         />
//       </AnimatePresence>
//     );
//   }

//   return (
//     <div {...getRootProps()} className="relative">
//       <input {...getInputProps()} />

//       {isDragActive && (
//         <div className="absolute inset-0 bg-indigo-600/20 border-2 border-dashed border-indigo-500 rounded-xl flex items-center justify-center z-10">
//           <p className="text-indigo-400 font-medium">Drop files here</p>
//         </div>
//       )}

//       {/* Upload Progress */}
//       <AnimatePresence>
//         {uploads.filter((u) => u.status === "uploading").length > 0 && (
//           <motion.div
//             initial={{ opacity: 0, y: 10 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0 }}
//             className="px-4 pb-2 space-y-1"
//           >
//             {uploads.filter((u) => u.status === "uploading").map((upload) => (
//               <div key={upload.fileId} className="flex items-center gap-2">
//                 <span className="text-xs text-gray-400 truncate flex-1">{upload.fileName}</span>
//                 <div className="w-24 h-1 bg-gray-700 rounded-full overflow-hidden">
//                   <div
//                     className="h-full bg-indigo-500 rounded-full transition-all duration-300"
//                     style={{ width: `${upload.progress}%` }}
//                   />
//                 </div>
//                 <span className="text-xs text-gray-500">{upload.progress}%</span>
//               </div>
//             ))}
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Reply Preview */}
//       <AnimatePresence>
//         {replyingTo && (
//           <motion.div
//             initial={{ opacity: 0, height: 0 }}
//             animate={{ opacity: 1, height: "auto" }}
//             exit={{ opacity: 0, height: 0 }}
//             className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 border-t border-gray-600"
//           >
//             <div className="flex-1 border-l-2 border-indigo-400 pl-2">
//               <p className="text-xs text-indigo-400 font-medium">
//                 {typeof replyingTo.senderId === "object"
//                   ? (replyingTo.senderId as { username: string }).username
//                   : "User"}
//               </p>
//               <p className="text-xs text-gray-400 truncate">{replyingTo.content}</p>
//             </div>
//             <button onClick={onCancelReply} className="text-gray-400 hover:text-white">
//               <X className="w-4 h-4" />
//             </button>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Input Area */}
//       <div className="flex items-end gap-2 px-4 py-3 bg-gray-800 border-t border-gray-700 relative">

//         {/* File Upload */}
//         <label className="flex-shrink-0 cursor-pointer">
//           <input
//             type="file"
//             multiple
//             className="hidden"
//             onChange={handleFileSelect}
//             accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip"
//           />
//           <div className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
//             <Paperclip className="w-5 h-5" />
//           </div>
//         </label>

//         {/* Textarea */}
//         <textarea
//           ref={textareaRef}
//           value={content}
//           onChange={(e) => handleChange(e.target.value)}
//           onKeyDown={handleKeyDown}
//           onPaste={handlePaste}
//           placeholder="Type a message..."
//           rows={1}
//           className="flex-1 bg-gray-700 text-white placeholder-gray-500 rounded-2xl px-4 py-2.5 text-sm resize-none border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-h-[120px] leading-relaxed"
//         />

//         {/* Emoji Button + Picker */}
//         <div className="relative flex-shrink-0">
//           <button
//             onClick={() => setShowEmoji(!showEmoji)}
//             className={cn(
//               "w-9 h-9 flex items-center justify-center rounded-full transition-colors",
//               showEmoji ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-700"
//             )}
//           >
//             <Smile className="w-5 h-5" />
//           </button>
//           <EmojiPicker
//             isOpen={showEmoji}
//             onClose={() => setShowEmoji(false)}
//             onEmojiSelect={handleEmojiSelect}
//             position="top"
//           />
//         </div>

//         {/* Send / Record */}
//         {content.trim() ? (
//           <motion.button
//             whileTap={{ scale: 0.95 }}
//             onClick={handleSend}
//             className="flex-shrink-0 w-9 h-9 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center transition-colors"
//           >
//             <Send className="w-4 h-4 text-white" />
//           </motion.button>
//         ) : (
//           <button
//             onClick={() => setShowVoiceRecorder(true)}
//             className="flex-shrink-0 w-9 h-9 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
//           >
//             <Mic className="w-4 h-4 text-gray-400" />
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };



"use client";

import { useState, useRef, useCallback, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Smile, Mic, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Message, MediaContent } from "@/types";
import { useTyping } from "@/hooks/useTyping";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { EmojiPicker } from "@/components/emoji/EmojiPicker";
import { VoiceRecorder } from "@/components/chat/VoiceRecorder";
import { cn, isEmojiOnly } from "@/lib/utils";

interface MessageInputProps {
  conversationId: string;
  replyingTo: Message | null;
  onSend: (payload: {
    type: Message["type"];
    content: string;
    media?: Message["media"];
    replyTo?: string;
  }) => void;
  onCancelReply: () => void;
}

export const MessageInput = ({
  conversationId, replyingTo, onSend, onCancelReply,
}: MessageInputProps) => {
  const [content, setContent] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { startTyping, stopTyping } = useTyping(conversationId);
  const { uploadFile, uploads } = useMediaUpload();

  const handleSend = useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const type = isEmojiOnly(trimmed) ? "emoji_only" : "text";
    onSend({ type, content: trimmed, replyTo: replyingTo?._id });
    setContent("");
    stopTyping();
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [content, replyingTo, onSend, stopTyping]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (value: string) => {
    setContent(value);
    if (value.trim()) startTyping();
    else stopTyping();
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const handleVoiceSend = (media: MediaContent, duration: number) => {
    onSend({ type: "voice_note", content: "", media: { ...media, duration } });
    setShowVoiceRecorder(false);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    noClick: true,
    onDrop: async (files) => {
      for (const file of files) {
        const media = await uploadFile(file);
        if (media) {
          const type = file.type.startsWith("image/") ? "image"
            : file.type.startsWith("video/") ? "video"
            : file.type.startsWith("audio/") ? "audio" : "file";
          onSend({ type, content: "", media });
        }
      }
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    for (const file of files) {
      const media = await uploadFile(file);
      if (media) {
        const type = file.type.startsWith("image/") ? "image"
          : file.type.startsWith("video/") ? "video"
          : file.type.startsWith("audio/") ? "audio" : "file";
        onSend({ type, content: "", media });
      }
    }
    e.target.value = "";
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (file) {
        const media = await uploadFile(file);
        if (media) onSend({ type: "image", content: "", media });
      }
    }
  };

  if (showVoiceRecorder) {
    return (
      <AnimatePresence>
        <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setShowVoiceRecorder(false)} conversationId={conversationId} />

      </AnimatePresence>
    );
  }

  return (
    <div {...getRootProps()} className="relative">
      <input {...getInputProps()} />

      {isDragActive && (
        <div className="absolute inset-0 bg-indigo-600/20 border-2 border-dashed border-indigo-500 rounded-xl flex items-center justify-center z-10">
          <p className="text-indigo-400 font-medium">Drop files here</p>
        </div>
      )}

      <AnimatePresence>
        {uploads.filter((u) => u.status === "uploading").length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="px-4 pb-2 space-y-1">
            {uploads.filter((u) => u.status === "uploading").map((upload) => (
              <div key={upload.fileId} className="flex items-center gap-2">
                <span className="text-xs truncate flex-1" style={{ color: "var(--text-muted)" }}>{upload.fileName}</span>
                <div className="w-24 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${upload.progress}%` }} />
                </div>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{upload.progress}%</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-4 py-2 border-t"
            style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border)" }}
          >
            <div className="flex-1 border-l-2 border-indigo-400 pl-2">
              <p className="text-xs text-indigo-400 font-medium">
                {typeof replyingTo.senderId === "object"
                  ? (replyingTo.senderId as { username: string }).username
                  : "User"}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{replyingTo.content}</p>
            </div>
            <button onClick={onCancelReply} style={{ color: "var(--text-muted)" }}>
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2 px-4 py-3 border-t relative"
        style={{ backgroundColor: "var(--header-bg)", borderColor: "var(--border)" }}>

        <label className="flex-shrink-0 cursor-pointer">
          <input type="file" multiple className="hidden" onChange={handleFileSelect}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip" />
          <div className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
            style={{ color: "var(--text-muted)" }}>
            <Paperclip className="w-5 h-5" />
          </div>
        </label>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 rounded-2xl px-4 py-2.5 text-sm resize-none border focus:outline-none focus:ring-2 focus:ring-indigo-500 max-h-[120px] leading-relaxed"
          style={{
            backgroundColor: "var(--input-bg)",
            color: "var(--text-primary)",
            borderColor: "var(--border)",
          }}
        />

        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded-full transition-colors",
              showEmoji ? "bg-indigo-600 text-white" : ""
            )}
            style={!showEmoji ? { color: "var(--text-muted)" } : {}}
          >
            <Smile className="w-5 h-5" />
          </button>
          <EmojiPicker isOpen={showEmoji} onClose={() => setShowEmoji(false)} onEmojiSelect={handleEmojiSelect} position="top" />
        </div>

        {content.trim() ? (
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleSend}
            className="flex-shrink-0 w-9 h-9 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center transition-colors">
            <Send className="w-4 h-4 text-white" />
          </motion.button>
        ) : (
          <button onClick={() => setShowVoiceRecorder(true)}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)" }}>
            <Mic className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};