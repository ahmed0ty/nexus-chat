import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, isToday, isYesterday, type Locale } from "date-fns";
import { ar, enUS, es, de } from "date-fns/locale";
import { Language } from "@/types";

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

const dateLocales: Record<Language, Locale> = {
  ar, en: enUS, es, de,
};

export const formatMessageTime = (date: string, language: Language = "en"): string => {
  try {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    const locale = dateLocales[language];
    if (isToday(d)) return format(d, "HH:mm");
    if (isYesterday(d)) return "Yesterday";
    return format(d, "dd/MM/yyyy", { locale });
  } catch {
    return "";
  }
};

export const formatLastSeen = (date: string, language: Language = "en"): string => {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: dateLocales[language],
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const isEmojiOnly = (text: string): boolean => {
  const emojiRegex = /^[\p{Emoji}\s]+$/u;
  return emojiRegex.test(text) && text.trim().length > 0;
};

export const getInitials = (name: string): string => {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

export const generateTempId = (): string => {
  return `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
};