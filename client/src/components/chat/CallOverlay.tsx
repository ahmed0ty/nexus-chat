"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { CallState } from "@/hooks/useCall";

interface CallOverlayProps {
  callState: CallState;
  callerName: string;
  callDuration: number;
  isMuted: boolean;
  isSpeaker: boolean;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
}

export const CallOverlay = ({
  callState,
  callerName,
  callDuration,
  isMuted,
  isSpeaker,
  onAccept,
  onReject,
  onEnd,
  onToggleMute,
  onToggleSpeaker,
}: CallOverlayProps) => {
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <AnimatePresence>
      {callState !== "idle" && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Call Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
              style={{ backgroundColor: "var(--bg-secondary)" }}>

              {/* Header */}
              <div className="px-6 pt-8 pb-6 text-center"
                style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl text-white font-bold">
                    {callerName?.[0]?.toUpperCase() ?? "?"}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{callerName}</h3>

                {callState === "calling" && (
                  <p className="text-indigo-200 text-sm">جاري الاتصال...</p>
                )}
                {callState === "incoming" && (
                  <p className="text-indigo-200 text-sm">مكالمة واردة</p>
                )}
                {callState === "active" && (
                  <p className="text-indigo-200 text-sm font-mono">
                    {formatDuration(callDuration)}
                  </p>
                )}
              </div>

              {/* Controls */}
              <div className="px-6 py-6">
                {/* Active call controls */}
                {callState === "active" && (
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={onToggleMute}
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                        isMuted
                          ? "bg-red-500 text-white"
                          : "bg-gray-700 text-white hover:bg-gray-600"
                      }`}
                    >
                      {isMuted ? (
                        <MicOff className="w-6 h-6" />
                      ) : (
                        <Mic className="w-6 h-6" />
                      )}
                    </button>

                    <button
                      onClick={onEnd}
                      className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-colors"
                    >
                      <PhoneOff className="w-7 h-7 text-white" />
                    </button>

                    <button
                      onClick={onToggleSpeaker}
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                        isSpeaker
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-700 text-white hover:bg-gray-600"
                      }`}
                    >
                      {isSpeaker ? (
                        <Volume2 className="w-6 h-6" />
                      ) : (
                        <VolumeX className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                )}

                {/* Calling controls */}
                {callState === "calling" && (
                  <div className="flex justify-center">
                    <button
                      onClick={onEnd}
                      className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-colors"
                    >
                      <PhoneOff className="w-7 h-7 text-white" />
                    </button>
                  </div>
                )}

                {/* Incoming call controls */}
                {callState === "incoming" && (
                  <div className="flex items-center justify-center gap-8">
                    <button
                      onClick={onReject}
                      className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-colors"
                    >
                      <PhoneOff className="w-7 h-7 text-white" />
                    </button>

                    <button
                      onClick={onAccept}
                      className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-500 flex items-center justify-center transition-colors"
                    >
                      <Phone className="w-7 h-7 text-white" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};