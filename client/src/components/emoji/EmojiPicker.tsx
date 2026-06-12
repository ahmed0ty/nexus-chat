"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  position?: "top" | "bottom";
}

export const EmojiPicker = ({ isOpen, onClose, onEmojiSelect, position = "top" }: EmojiPickerProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.95, y: position === "top" ? 10 : -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`absolute ${position === "top" ? "bottom-12" : "top-12"} right-0 z-50`}
        >
          <Picker
            data={data}
            onEmojiSelect={(emoji: { native: string }) => {
              onEmojiSelect(emoji.native);
              onClose();
            }}
            theme="dark"
            set="native"
            previewPosition="none"
            skinTonePosition="none"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};