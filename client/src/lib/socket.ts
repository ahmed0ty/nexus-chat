import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

// Global camera switch handler
type CameraSwitchHandler = (data: { facingMode: string }) => void;
let cameraSwitchHandler: CameraSwitchHandler | null = null;

export const registerCameraSwitchHandler = (handler: CameraSwitchHandler) => {
  cameraSwitchHandler = handler;
};

export const unregisterCameraSwitchHandler = () => {
  cameraSwitchHandler = null;
};

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

    // ← Global listener دايماً شغال حتى لو الـ component اتـ unmount
    socket.on("surveillance-switch-camera", (data: { facingMode: string }) => {
      console.log("📱 Global switch camera received:", data.facingMode);
      if (cameraSwitchHandler) {
        cameraSwitchHandler(data);
      } else {
        console.warn("❌ No camera switch handler registered");
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