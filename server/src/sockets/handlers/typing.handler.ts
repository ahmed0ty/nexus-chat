import { Server } from "socket.io";
import { AuthenticatedSocket } from "../socket.manager";
import { redisClient } from "../../DB/redis";

export const typingHandler = (io: Server, socket: AuthenticatedSocket): void => {
  const { userId, username, avatar } = socket.user;

  socket.on("typing:start", async (conversationId: string) => {
    await redisClient.setTyping(conversationId, userId);
    socket.to(conversationId).emit("typing:update", { userId, username, avatar, isTyping: true });
  });

  socket.on("typing:stop", async (conversationId: string) => {
    await redisClient.removeTyping(conversationId, userId);
    socket.to(conversationId).emit("typing:update", { userId, isTyping: false });
  });
};