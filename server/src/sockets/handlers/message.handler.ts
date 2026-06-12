import { Server } from "socket.io";
import { AuthenticatedSocket } from "../socket.manager";
import { Message } from "../../DB/models/message.model";
import { Conversation } from "../../DB/models/conversation.model";
import { IMediaContent, MessageType } from "../../types";
import { notificationService } from "../../services/notification.service";
import { User } from "../../DB/models/user.model";
import { getSocketManager } from "../socket.manager";
import { Types } from "mongoose";

interface SendMessagePayload {
  conversationId: string;
  type: MessageType;
  content: string;
  media?: IMediaContent;
  replyTo?: string;
  mentions?: string[];
  tempId: string;
}

interface EditMessagePayload {
  messageId: string;
  content: string;
}

interface DeleteMessagePayload {
  messageId: string;
  deleteForEveryone: boolean;
}

interface ReadMessagePayload {
  conversationId: string;
  messageId: string;
}

export const messageHandler = (io: Server, socket: AuthenticatedSocket): void => {
  const { userId, username } = socket.user;

  socket.on("message:send", async (payload: SendMessagePayload) => {
    try {
      const message = await Message.create({
        conversationId: payload.conversationId,
        senderId: userId,
        type: payload.type,
        content: payload.content,
        media: payload.media ?? undefined,
        replyTo: payload.replyTo ?? undefined,
        mentions: payload.mentions ?? [],
      });

      await Conversation.findByIdAndUpdate(payload.conversationId, {
        lastMessage: message._id,
        updatedAt: new Date(),
      });

      const populated = await Message.findById(message._id)
        .populate("senderId", "username avatar")
        .populate("replyTo", "content senderId type")
        .lean();

      io.to(payload.conversationId).emit("message:new", {
        ...(populated ?? {}),
        tempId: payload.tempId,
      });

      // إرسال notifications للـ participants
      const conversation = await Conversation.findById(payload.conversationId);
      if (conversation) {
        const recipients = conversation.participants
          .filter((p) => p.userId.toString() !== userId)
          .map((p) => p.userId.toString());

        const preview = payload.content
          ? payload.content.substring(0, 50)
          : `📎 ${payload.type}`;

        await Promise.all(
          recipients.map(async (recipientId) => {
            await notificationService.notifyNewMessage(
              recipientId,
              username,
              preview,
              payload.conversationId
            );
            getSocketManager().emitToUser(recipientId, "notification:new", {
              type: "message",
              conversationId: payload.conversationId,
              preview,
            });
          })
        );

        // إرسال mention notifications
        if (payload.mentions?.length) {
          await Promise.all(
            payload.mentions.map(async (mentionedId) => {
              await notificationService.notifyMention(
                mentionedId,
                username,
                payload.conversationId,
                message._id.toString()
              );
              getSocketManager().emitToUser(mentionedId, "notification:mention", {
                conversationId: payload.conversationId,
                messageId: message._id.toString(),
                mentionedBy: username,
              });
            })
          );
        }
      }
    } catch (error) {
      socket.emit("message:error", {
        tempId: payload.tempId,
        error: "Failed to send message",
      });
    }
  });

  socket.on("message:edit", async (payload: EditMessagePayload) => {
    try {
      const message = await Message.findOneAndUpdate(
        { _id: payload.messageId, senderId: userId, isDeleted: false },
        { content: payload.content, isEdited: true, editedAt: new Date() },
        { new: true }
      );
      if (!message) {
        socket.emit("message:error", { error: "Message not found" });
        return;
      }
      io.to(message.conversationId.toString()).emit("message:updated", message.toObject());
    } catch {
      socket.emit("message:error", { error: "Failed to edit message" });
    }
  });

  socket.on("message:delete", async (payload: DeleteMessagePayload) => {
    try {
      const message = await Message.findOne({ _id: payload.messageId, senderId: userId });
      if (!message) {
        socket.emit("message:error", { error: "Message not found" });
        return;
      }

  if (payload.deleteForEveryone) {
  await Message.findByIdAndDelete(payload.messageId);
  io.to(message.conversationId.toString()).emit("message:deleted", {
    messageId: payload.messageId,
    conversationId: message.conversationId.toString(),  // ✅ أضف ده
    deleteForEveryone: true,
  });
} else {
  await Message.findByIdAndUpdate(payload.messageId, {
    $addToSet: { deletedFor: userId },
  });
  socket.emit("message:deleted", {
    messageId: payload.messageId,
    conversationId: message.conversationId.toString(),  // ✅ أضف ده
    deleteForEveryone: false,
  });
}
    } catch {
      socket.emit("message:error", { error: "Failed to delete message" });
    }
  });

  socket.on("message:read", async (payload: ReadMessagePayload) => {
    try {
      await Message.updateMany(
        {
          conversationId: payload.conversationId,
          "readBy.userId": { $ne: userId },
          senderId: { $ne: userId },
          isDeleted: false,
        },
        { $addToSet: { readBy: { userId, readAt: new Date() } } }
      );
      io.to(payload.conversationId).emit("message:read_receipt", {
        conversationId: payload.conversationId,
        userId,
        readAt: new Date(),
      });
    } catch {
      socket.emit("message:error", { error: "Failed to mark as read" });
    }
  });
};