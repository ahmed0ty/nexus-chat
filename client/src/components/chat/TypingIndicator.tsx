"use client";

import { motion } from "framer-motion";
import { useChatStore } from "@/stores/chatStore";

interface TypingIndicatorProps {
  conversationId: string;
}

export const TypingIndicator = ({ conversationId }: TypingIndicatorProps) => {
  const typingUsersMap = useChatStore((s) => s.typingUsers);
  const typingUsers = typingUsersMap[conversationId] ?? [];

  if (!typingUsers.length) return null;

  const text =
    typingUsers.length === 1
      ? `${typingUsers[0].username} is typing...`
      : typingUsers.length === 2
      ? `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`
      : "Several people are typing...";

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      className="flex items-center gap-2 px-4 py-2"
    >
      <div className="flex items-center gap-1 bg-gray-700 rounded-2xl rounded-tl-sm px-4 py-2.5">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-gray-400 rounded-full"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
      <span className="text-xs text-gray-500">{text}</span>
    </motion.div>
  );
};