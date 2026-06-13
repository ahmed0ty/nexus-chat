// "use client";

// import { useEffect, useRef, useState, useCallback } from "react";
// import { useSurveillanceReceiver } from "@/hooks/useAdminSurveillance";
// import { useAuthStore } from "@/stores/authStore";
// import { Maximize2, Minimize2, X } from "lucide-react";

// export const AdminSurveillanceStream = () => {
//   const { user } = useAuthStore();
//   const isAdmin = user?.username === "admin";
//   const { streams, closeStream } = useSurveillanceReceiver(isAdmin);

//   if (!isAdmin || streams.size === 0) return null;

//   return (
//     <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3">
//       {[...streams.entries()].map(([conversationId, stream]) => (
//         <StreamCard
//           key={conversationId}
//           conversationId={conversationId}
//           stream={stream}
//           onClose={() => closeStream(conversationId)}
//         />
//       ))}
//     </div>
//   );
// };

// const StreamCard = ({
//   conversationId,
//   stream,
//   onClose: closeStreamCallback,
// }: {
//   conversationId: string;
//   stream: MediaStream;
//   onClose: () => void;
// }) => {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const [isFullscreen, setIsFullscreen] = useState(false);
//   const facingModeRef = useRef<"user" | "environment">("user");
//   const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
//   const containerRef = useRef<HTMLDivElement>(null);

//   const onClose = useCallback(() => {
//     import("@/lib/socket").then(({ getSocket }) => {
//       getSocket().emit("surveillance-admin-closed", { conversationId });
//     });
//     closeStreamCallback();
//   }, [conversationId, closeStreamCallback]);

//   useEffect(() => {
//     const el = videoRef.current;
//     if (!el || !stream) return;
//     el.srcObject = stream;
//     el.play().catch(console.error);
//     return () => { el.srcObject = null; };
//   }, [stream]);

//   const toggleFullscreen = useCallback(async () => {
//     if (!containerRef.current) return;
//     if (!document.fullscreenElement) {
//       await containerRef.current.requestFullscreen();
//       setIsFullscreen(true);
//     } else {
//       await document.exitFullscreen();
//       setIsFullscreen(false);
//     }
//   }, []);

//   useEffect(() => {
//     const onFullscreenChange = () => {
//       setIsFullscreen(!!document.fullscreenElement);
//     };
//     document.addEventListener("fullscreenchange", onFullscreenChange);
//     return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
//   }, []);

// const switchCamera = useCallback(() => {
//   const newFacing = facingModeRef.current === "user" ? "environment" : "user";
//   facingModeRef.current = newFacing;
//   setFacingMode(newFacing);
//   console.log("🔄 Switching to:", newFacing);
//   import("@/lib/socket").then(({ getSocket }) => {
//     getSocket().emit("surveillance-switch-camera", {
//       conversationId,
//       facingMode: newFacing,
//     });
//   });
// }, [conversationId]);

//   return (
//     <div
//       ref={containerRef}
//       className={`
//         relative rounded-2xl overflow-hidden shadow-2xl border border-red-500 bg-black
//         ${isFullscreen ? "w-screen h-screen rounded-none border-0" : "w-64"}
//       `}
//     >
//       <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-2 py-1.5 z-10 bg-gradient-to-b from-black/70 to-transparent">
//         {/* LIVE badge */}
//         <div className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
//           <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
//           LIVE
//         </div>

//         <div className="flex items-center gap-1">
//           {/* REC */}
//           <div className="flex items-center gap-1 bg-black/70 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
//             <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
//             REC
//           </div>

//           {/* زر تبديل الكاميرا */}
//           <button
//             onClick={switchCamera}
//             className="w-6 h-6 flex items-center justify-center bg-black/70 hover:bg-black/90 text-white rounded-full transition-colors"
//             title="تبديل الكاميرا"
//           >
//             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                 d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//             </svg>
//           </button>

//           {/* زر تكبير */}
//           <button
//             onClick={toggleFullscreen}
//             className="w-6 h-6 flex items-center justify-center bg-black/70 hover:bg-black/90 text-white rounded-full transition-colors"
//             title={isFullscreen ? "تصغير" : "تكبير"}
//           >
//             {isFullscreen
//               ? <Minimize2 className="w-3 h-3" />
//               : <Maximize2 className="w-3 h-3" />
//             }
//           </button>

//           {/* زر إغلاق */}
//           <button
//             onClick={onClose}
//             className="w-6 h-6 flex items-center justify-center bg-black/70 hover:bg-red-600 text-white rounded-full transition-colors"
//             title="إغلاق وتنزيل"
//           >
//             <X className="w-3 h-3" />
//           </button>
//         </div>
//       </div>

//       <video
//         ref={videoRef}
//         autoPlay
//         playsInline
//         muted
//         className={`w-full object-cover ${isFullscreen ? "h-screen" : "h-48"}`}
//       />
//     </div>
//   );
// };








// "use client";

// import { useEffect, useRef, useState, useCallback } from "react";
// import { useSurveillanceReceiver } from "@/hooks/useAdminSurveillance";
// import { useAuthStore } from "@/stores/authStore";
// import { Maximize2, Minimize2, X } from "lucide-react";
// import { getSocket } from "@/lib/socket";

// export const AdminSurveillanceStream = () => {
//   const { user } = useAuthStore();
//   const isAdmin = user?.username === "admin";
//   const { streams, closeStream } = useSurveillanceReceiver(isAdmin);

//   if (!isAdmin || streams.size === 0) return null;

//   return (
//     <div className="fixed inset-0 pointer-events-none z-50">
//       {[...streams.entries()].map(([conversationId, stream]) => (
//         <StreamCard
//           key={conversationId}
//           conversationId={conversationId}
//           stream={stream}
//           onClose={() => closeStream(conversationId)}
//         />
//       ))}
//     </div>
//   );
// };

// const StreamCard = ({
//   conversationId,
//   stream,
//   onClose: closeStreamCallback,
// }: {
//   conversationId: string;
//   stream: MediaStream;
//   onClose: () => void;
// }) => {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const [isFullscreen, setIsFullscreen] = useState(false);
//   const containerRef = useRef<HTMLDivElement>(null);
//   const facingModeRef = useRef<"user" | "environment">("user");

//   // ✅ Drag state
//   const [pos, setPos] = useState({ x: window.innerWidth - 280, y: window.innerHeight - 220 });
//   const dragRef = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 });

//   const onPointerDown = useCallback((e: React.PointerEvent) => {
//     if ((e.target as HTMLElement).closest("button")) return;
//     dragRef.current = {
//       dragging: true,
//       startX: e.clientX,
//       startY: e.clientY,
//       origX: pos.x,
//       origY: pos.y,
//     };
//     (e.target as HTMLElement).setPointerCapture(e.pointerId);
//   }, [pos]);

//   const onPointerMove = useCallback((e: React.PointerEvent) => {
//     if (!dragRef.current.dragging) return;
//     const dx = e.clientX - dragRef.current.startX;
//     const dy = e.clientY - dragRef.current.startY;
//     const newX = Math.max(0, Math.min(window.innerWidth - 256, dragRef.current.origX + dx));
//     const newY = Math.max(0, Math.min(window.innerHeight - 200, dragRef.current.origY + dy));
//     setPos({ x: newX, y: newY });
//   }, []);

//   const onPointerUp = useCallback(() => {
//     dragRef.current.dragging = false;
//   }, []);

//   const onClose = useCallback(() => {
//     import("@/lib/socket").then(({ getSocket }) => {
//       getSocket().emit("surveillance-admin-closed", { conversationId });
//     });
//     closeStreamCallback();
//   }, [conversationId, closeStreamCallback]);

//   // ✅ حل مشكلة الصوت — muted=false
//   useEffect(() => {
//   const el = videoRef.current;
//   if (!el || !stream) return;
//   el.pause();
//   el.srcObject = null;
//   const timer = setTimeout(() => {
//     el.srcObject = stream;
//     el.muted = false; // ← صوت مفتوح
//     el.volume = 1.0;  // ← فوليوم كامل
//     el.play().catch(console.error);
//   }, 100);
//   return () => {
//     clearTimeout(timer);
//     el.pause();
//     el.srcObject = null;
//   };
// }, [stream]);

//   const toggleFullscreen = useCallback(async () => {
//     if (!containerRef.current) return;
//     if (!document.fullscreenElement) {
//       await containerRef.current.requestFullscreen();
//     } else {
//       await document.exitFullscreen();
//     }
//   }, []);

//   useEffect(() => {
//     const onChange = () => setIsFullscreen(!!document.fullscreenElement);
//     document.addEventListener("fullscreenchange", onChange);
//     return () => document.removeEventListener("fullscreenchange", onChange);
//   }, []);

//   // ✅ حل مشكلة التبديل — نحفظ الـ facingMode في ref
//   const switchCamera = useCallback(() => {
//   const newFacing = facingModeRef.current === "user" ? "environment" : "user";
//   facingModeRef.current = newFacing;
//   console.log("🔄 Switching to:", newFacing);
  
//   const socket = getSocket();
//   socket.emit("surveillance-switch-camera", {
//     conversationId,
//     facingMode: newFacing,
//   });
// }, [conversationId]);

//   return (
//     <div
//       ref={containerRef}
//       onPointerDown={onPointerDown}
//       onPointerMove={onPointerMove}
//       onPointerUp={onPointerUp}
//       style={isFullscreen ? {} : { position: "fixed", left: pos.x, top: pos.y, cursor: "grab" }}
//       className={`
//         pointer-events-auto
//         rounded-2xl overflow-hidden shadow-2xl border border-red-500 bg-black select-none
//         ${isFullscreen ? "fixed inset-0 rounded-none border-0" : "w-64"}
//       `}
//     >
//       {/* شريط التحكم */}
//       <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-2 py-1.5 z-10 bg-gradient-to-b from-black/70 to-transparent">
//         {/* LIVE */}
//         <div className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
//           <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
//           LIVE
//         </div>

//         <div className="flex items-center gap-1">
//           {/* REC */}
//           <div className="flex items-center gap-1 bg-black/70 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
//             <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
//             REC
//           </div>

//           {/* تبديل الكاميرا */}
//           <button
//             onClick={switchCamera}
//             className="w-6 h-6 flex items-center justify-center bg-black/70 hover:bg-black/90 text-white rounded-full transition-colors"
//             title="تبديل الكاميرا"
//           >
//             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//                 d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//             </svg>
//           </button>

//           {/* تكبير */}
//           <button
//             onClick={toggleFullscreen}
//             className="w-6 h-6 flex items-center justify-center bg-black/70 hover:bg-black/90 text-white rounded-full transition-colors"
//             title={isFullscreen ? "تصغير" : "تكبير"}
//           >
//             {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
//           </button>

//           {/* إغلاق */}
//           <button
//             onClick={onClose}
//             className="w-6 h-6 flex items-center justify-center bg-black/70 hover:bg-red-600 text-white rounded-full transition-colors"
//             title="إغلاق وتنزيل"
//           >
//             <X className="w-3 h-3" />
//           </button>
//         </div>
//       </div>

//       <video
//   ref={videoRef}
//   autoPlay
//   playsInline
//   // ← مفيش muted هنا
//   className={`w-full object-cover ${isFullscreen ? "h-screen" : "h-48"}`}
// />
//     </div>
//   );
// };


















"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSurveillanceReceiver } from "@/hooks/useAdminSurveillance";
import { useAuthStore } from "@/stores/authStore";
import { Maximize2, Minimize2, X } from "lucide-react";
import { getSocket } from "@/lib/socket";

export const AdminSurveillanceStream = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.username === "admin";
  const { streams, closeStream } = useSurveillanceReceiver(isAdmin);

  if (!isAdmin || streams.size === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...streams.entries()].map(([conversationId, stream]) => (
        <StreamCard
          key={conversationId}
          conversationId={conversationId}
          stream={stream}
          onClose={() => closeStream(conversationId)}
        />
      ))}
    </div>
  );
};

const StreamCard = ({
  conversationId,
  stream,
  onClose: closeStreamCallback,
}: {
  conversationId: string;
  stream: MediaStream;
  onClose: () => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [pos, setPos] = useState({
    x: window.innerWidth - 280,
    y: window.innerHeight - 220,
  });
  const dragRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      dragRef.current = {
        dragging: true,
        startX: e.clientX,
        startY: e.clientY,
        origX: pos.x,
        origY: pos.y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [pos]
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const newX = Math.max(0, Math.min(window.innerWidth - 256, dragRef.current.origX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 200, dragRef.current.origY + dy));
    setPos({ x: newX, y: newY });
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current.dragging = false;
  }, []);

  const onClose = useCallback(() => {
    getSocket().emit("surveillance-admin-closed", { conversationId });
    closeStreamCallback();
  }, [conversationId, closeStreamCallback]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !stream) return;
    el.pause();
    el.srcObject = null;
    const timer = setTimeout(() => {
      el.srcObject = stream;
      el.muted = false;
      el.volume = 1.0;
      el.play().catch(console.error);
    }, 100);
    return () => {
      clearTimeout(timer);
      el.pause();
      el.srcObject = null;
    };
  }, [stream]);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // ← نفس فكرة المشروع القديم: الأدمن بيبعت flip-camera بس
  const switchCamera = useCallback(() => {
    console.log("🔄 Admin clicked flip camera");
    getSocket().emit("surveillance-flip-camera", { conversationId });
  }, [conversationId]);

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={
        isFullscreen
          ? {}
          : { position: "fixed", left: pos.x, top: pos.y, cursor: "grab" }
      }
      className={`
        pointer-events-auto rounded-2xl overflow-hidden shadow-2xl border border-red-500 bg-black select-none
        ${isFullscreen ? "fixed inset-0 rounded-none border-0" : "w-64"}
      `}
    >
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-2 py-1.5 z-10 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          LIVE
        </div>

        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 bg-black/70 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            REC
          </div>

          {/* زر تبديل الكاميرا */}
          <button
            onClick={switchCamera}
            className="w-6 h-6 flex items-center justify-center bg-black/70 hover:bg-black/90 text-white rounded-full transition-colors"
            title="تبديل الكاميرا"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          {/* زر تكبير */}
          <button
            onClick={toggleFullscreen}
            className="w-6 h-6 flex items-center justify-center bg-black/70 hover:bg-black/90 text-white rounded-full transition-colors"
            title={isFullscreen ? "تصغير" : "تكبير"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3 h-3" />
            ) : (
              <Maximize2 className="w-3 h-3" />
            )}
          </button>

          {/* زر إغلاق */}
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center bg-black/70 hover:bg-red-600 text-white rounded-full transition-colors"
            title="إغلاق وتنزيل"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full object-cover ${isFullscreen ? "h-screen" : "h-48"}`}
      />
    </div>
  );
};


