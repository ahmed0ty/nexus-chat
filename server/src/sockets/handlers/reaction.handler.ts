import { Server } from "socket.io";
import { AuthenticatedSocket } from "../socket.manager";
import { Message } from "../../DB/models/message.model";
import { Types } from "mongoose";

interface ReactPayload {
  messageId: string;
  emoji: string;
}

export const reactionHandler = (io: Server, socket: AuthenticatedSocket): void => {
  const { userId } = socket.user;

  socket.on("message:react", async (payload: ReactPayload) => {
    try {
      const message = await Message.findById(payload.messageId);
      if (!message) return;

      const reactionIndex = message.reactions.findIndex((r) => r.emoji === payload.emoji);
      const userObjectId = new Types.ObjectId(userId);

      if (reactionIndex === -1) {
        message.reactions.push({ emoji: payload.emoji, users: [userObjectId] });
      } else {
        const userInReaction = message.reactions[reactionIndex].users.some((u) => u.equals(userObjectId));
        if (userInReaction) {
          message.reactions[reactionIndex].users = message.reactions[reactionIndex].users.filter((u) => !u.equals(userObjectId));
          if (message.reactions[reactionIndex].users.length === 0) message.reactions.splice(reactionIndex, 1);
        } else {
          message.reactions[reactionIndex].users.push(userObjectId);
        }
      }

      await message.save();

      io.to(message.conversationId.toString()).emit("message:reaction", {
        messageId: payload.messageId,
        conversationId: message.conversationId.toString(),
        reactions: message.reactions,
      });
    } catch {
      socket.emit("message:error", { error: "Failed to react" });
    }
  });
};