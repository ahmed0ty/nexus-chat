import { Message } from "../DB/models/message.model";
import { getSocketManager } from "../sockets/socket.manager";
import { logger } from "./logger";

export const processScheduledMessages = async (): Promise<void> => {
  try {
    const now = new Date();

    const scheduledMessages = await Message.find({
      scheduledAt: { $lte: now },
      isDeleted: false,
    }).populate("senderId", "username avatar");

    if (!scheduledMessages.length) return;

    for (const message of scheduledMessages) {
      await Message.findByIdAndUpdate(message._id, {
        $unset: { scheduledAt: 1 },
      });

      const socketManager = getSocketManager();
      socketManager.emitToConversation(
        message.conversationId.toString(),
        "message:new",
        message.toObject()
      );

      logger.info(`Scheduled message sent: ${message._id.toString()}`);
    }
  } catch (error) {
    logger.error("Scheduled messages job failed:", error);
  }
};