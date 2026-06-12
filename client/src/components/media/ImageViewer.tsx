"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { useEffect } from "react";

interface ImageViewerProps {
  src: string;
  alt?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageViewer = ({ src, alt, isOpen, onClose }: ImageViewerProps) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+") setZoom((z) => Math.min(z + 0.25, 3));
      if (e.key === "-") setZoom((z) => Math.max(z - 0.25, 0.5));
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleDownload = async () => {
    const response = await fetch(src);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = alt ?? "image";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-50 flex flex-col"
          onClick={onClose}
        >
          {/* Toolbar */}
          <div
            className="flex items-center justify-between px-4 py-3 bg-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-white text-sm truncate">{alt ?? "Image"}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-gray-300 text-sm w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
                className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRotation((r) => r + 90)}
                className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownload}
                className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Image */}
          <div
            className="flex-1 flex items-center justify-center overflow-hidden p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.img
              key={src}
              src={src}
              alt={alt ?? "Image"}
              animate={{
                scale: zoom,
                rotate: rotation,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="max-w-full max-h-full object-contain rounded-lg select-none"
              draggable={false}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};