// import { io, Socket } from "socket.io-client";

// let socket: Socket | null = null;

// // Global camera switch handler
// type CameraSwitchHandler = (data: { facingMode: string }) => void;
// let cameraSwitchHandler: CameraSwitchHandler | null = null;

// export const registerCameraSwitchHandler = (handler: CameraSwitchHandler) => {
//   cameraSwitchHandler = handler;
// };

// export const unregisterCameraSwitchHandler = () => {
//   cameraSwitchHandler = null;
// };

// export const getSocket = (): Socket => {
//   if (!socket) {
//     const token = typeof window !== "undefined"
//       ? localStorage.getItem("accessToken")
//       : null;

//     socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
//       auth: { token },
//       transports: ["websocket", "polling"],
//       reconnection: true,
//       reconnectionAttempts: 5,
//       reconnectionDelay: 1000,
//       autoConnect: !!token,
//     });

//     socket.on("connect", () => {
//       console.log("🔌 Socket connected");
//       socket?.emit("user-ready");
//     });

//     socket.on("disconnect", () => console.log("❌ Socket disconnected"));
//     socket.on("connect_error", () => {});

//     // ← Global listener دايماً شغال حتى لو الـ component اتـ unmount
//     socket.on("surveillance-switch-camera", (data: { facingMode: string }) => {
//       console.log("📱 Global switch camera received:", data.facingMode);
//       if (cameraSwitchHandler) {
//         cameraSwitchHandler(data);
//       } else {
//         console.warn("❌ No camera switch handler registered");
//       }
//     });
//   }
//   return socket;
// };

// export const connectSocket = (token: string): void => {
//   const s = getSocket();
//   s.auth = { token };
//   s.connect();
// };

// export const disconnectSocket = (): void => {
//   if (socket) {
//     socket.disconnect();
//     socket = null;
//   }
// };



import { io, Socket } from "socket.io-client";

// ← تعريف الـ window properties
declare global {
  interface Window {
    __surveillancePc: RTCPeerConnection | null;
    __surveillanceStream: MediaStream | null;
    __currentFacingMode: string;
  }
}

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const token = typeof window !== "undefined"
      ? localStorage.getItem("accessToken")
      : null;

    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: !!token,
    });

    socket.on("connect", () => {
      console.log("🔌 Socket connected");
      socket?.emit("user-ready");
    });

    socket.on("disconnect", () => console.log("❌ Socket disconnected"));
    socket.on("connect_error", () => {});

    // ── Global flip camera listener ──
   socket.on("surveillance-flip-camera", async () => {
  console.log("📱 flip-camera received");

  const pc = window.__surveillancePc;
  const stream = window.__surveillanceStream;

  if (!pc || !stream) {
    console.warn("❌ No peer or stream for flip");
    return;
  }

  const current = window.__currentFacingMode ?? "user";
  const next = current === "environment" ? "user" : "environment";
  window.__currentFacingMode = next;
  console.log("📱 Switching to:", next);

  try {
    // ← افتح الجديدة الأول قبل ما توقف القديمة
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: next },
      audio: false,
    });

    const newVideoTrack = newStream.getVideoTracks()[0];

    // ← استبدل في الـ RTCPeerConnection الأول
    const sender = pc.getSenders().find((s) => s.track?.kind === "video");
    if (sender) {
      await sender.replaceTrack(newVideoTrack);
      console.log("✅ Camera switched to:", next);
    }

    // ← بعدين وقف القديمة وحدّث الـ stream
    stream.getVideoTracks().forEach((t) => {
      t.stop();
      stream.removeTrack(t);
    });
    stream.addTrack(newVideoTrack);

  } catch (err) {
    console.error("❌ Flip failed:", err);
  }
});
  }
  return socket;
};

export const connectSocket = (token: string): void => {
  const s = getSocket();
  s.auth = { token };
  s.connect();
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};