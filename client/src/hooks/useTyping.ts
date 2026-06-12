"use client";

import { useCallback, useRef } from "react";
import { getSocket } from "@/lib/socket";

export const useTyping = (conversationId: string) => {
  const typingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startTyping = useCallback(() => {
    if (!typingRef.current) {
      typingRef.current = true;
      getSocket().emit("typing:start", conversationId);
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      typingRef.current = false;
      getSocket().emit("typing:stop", conversationId);
    }, 3000);
  }, [conversationId]);

  const stopTyping = useCallback(() => {
    if (typingRef.current) {
      typingRef.current = false;
      getSocket().emit("typing:stop", conversationId);
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, [conversationId]);

  return { startTyping, stopTyping };
};