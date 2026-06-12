import { Server } from "socket.io";
import { AuthenticatedSocket } from "../socket.manager";
import { redisClient } from "../../DB/redis";
import { User } from "../../DB/models/user.model";
import { UserStatus } from "../../types";

export const presenceHandler = (io: Server, socket: AuthenticatedSocket): void => {
  const { userId } = socket.user;

  socket.on("user:status", async (status: UserStatus) => {
    await User.findByIdAndUpdate(userId, { status });
    io.emit("user:status_update", { userId, status });
  });

  socket.on("user:get_status", async (targetUserId: string) => {
    const status = await redisClient.getUserStatus(targetUserId);
    socket.emit("user:status_response", { userId: targetUserId, ...status });
  });
};