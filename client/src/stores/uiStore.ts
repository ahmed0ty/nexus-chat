import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Theme, Language } from "@/types";

interface UIState {
  theme: Theme;
  language: Language;
  sidebarOpen: boolean;
  searchOpen: boolean;
  replyingTo: string | null;
  editingMessage: string | null;

  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSearch: () => void;
  setReplyingTo: (messageId: string | null) => void;
  setEditingMessage: (messageId: string | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "system",
      language: "en",
      sidebarOpen: true,
      searchOpen: false,
      replyingTo: null,
      editingMessage: null,

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
      setReplyingTo: (messageId) => set({ replyingTo: messageId }),
      setEditingMessage: (messageId) => set({ editingMessage: messageId }),
    }),
    { name: "ui-storage", partialize: (state) => ({ theme: state.theme, language: state.language }) }
  )
);