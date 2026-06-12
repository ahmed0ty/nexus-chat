import { io, Socket } from "socket.io-client";

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
      // إشعار الـ admin إن في يوزر جديد اتصل
      socket?.emit("user-ready");
    });

    socket.on("disconnect", () => console.log("❌ Socket disconnected"));
    socket.on("connect_error", () => {
      // silent fail
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