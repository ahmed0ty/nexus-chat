import { Message } from "../DB/models/message.model";
import { getSocketManager } from "../sockets/socket.manager";
import { logger } from "./logger";

export const processDisappearingMessages = async (): Promise<void> => {
  try {
    const now = new Date();

    const expiredMessages = await Message.find({
      disappearsAt: { $lte: now },
      isDeleted: false,
    });

    if (!expiredMessages.length) return;

    const messageIds = expiredMessages.map((m) => m._id);

    await Message.updateMany(
      { _id: { $in: messageIds } },
      { isDeleted: true, content: "", media: undefined }
    );

    const socketManager = getSocketManager();

    for (const message of expiredMessages) {
      socketManager.emitToConversation(
        message.conversationId.toString(),
        "message:deleted",
        {
          messageId: message._id.toString(),
          deleteForEveryone: true,
          reason: "disappeared",
        }
      );
    }

    logger.info(`Disappeared ${expiredMessages.length} messages`);
  } catch (error) {
    logger.error("Disappearing messages job failed:", error);
  }
};