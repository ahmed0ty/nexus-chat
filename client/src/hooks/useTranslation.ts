"use client";

import { useState, useCallback } from "react";
import api from "@/lib/axios";
import { useUIStore } from "@/stores/uiStore";

export const useMessageTranslation = () => {
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const { language } = useUIStore();

  const translateMessage = useCallback(async (messageId: string) => {
    if (translations[messageId]) return;

    setLoading((prev) => ({ ...prev, [messageId]: true }));
    try {
      const { data } = await api.post<{ data: { translatedText: string } }>(
        `/messages/${messageId}/translate`,
        { targetLang: language }
      );
      setTranslations((prev) => ({ ...prev, [messageId]: data.data.translatedText }));
    } catch {
      console.error("Translation failed");
    } finally {
      setLoading((prev) => ({ ...prev, [messageId]: false }));
    }
  }, [language, translations]);

  const clearTranslation = useCallback((messageId: string) => {
    setTranslations((prev) => {
      const next = { ...prev };
      delete next[messageId];
      return next;
    });
  }, []);

  return { translations, loading, translateMessage, clearTranslation };
};