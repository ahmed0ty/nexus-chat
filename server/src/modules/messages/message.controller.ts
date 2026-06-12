import { Response, NextFunction } from "express";
import { Message } from "../../DB/models/message.model";
import { Conversation } from "../../DB/models/conversation.model";
import { AuthRequest } from "../../types";
import { ApiResponse } from "../../utils/apiResponse.util";
import { getPaginationParams, getCursorPaginationQuery, buildPaginationResult } from "../../utils/pagination.util";
import { translationService } from "../../services/translation.service";
import { AppError } from "../../middlewares/error.middleware";
import { Types } from "mongoose";
import { SendMessageInput, EditMessageInput } from "./message.validation";
import { extractUrls, fetchLinkPreview } from "../../utils/linkPreview.util";

export const messageController = {
  async getMessages(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { conversationId } = req.params;
      const userId = req.user!._id.toString();
      const { limit, page } = getPaginationParams(req.query);
      const cursorQuery = getCursorPaginationQuery(req.query.cursor as string);

      const conversation = await Conversation.findOne({
        _id: conversationId,
        "participants.userId": userId,
      });
      if (!conversation) throw new AppError("Conversation not found", 404);

      const query = {
        conversationId,
        deletedFor: { $ne: userId },
        isDeleted: false,
        ...cursorQuery,
      };

      const [messages, total] = await Promise.all([
        Message.find(query)
          .sort({ createdAt: -1 })
          .limit(limit)
          .populate("senderId", "username avatar isOnline")
          .populate("replyTo", "content senderId type media")
          .lean(),
        Message.countDocuments({ conversationId, isDeleted: false }),
      ]);

      const result = buildPaginationResult(messages as typeof messages & { _id: unknown }[], total, page, limit);
      ApiResponse.paginated(res, result.data, result.pagination);
    } catch (error) { next(error); }
  },

  async sendMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const body = req.body as SendMessageInput;

      const conversation = await Conversation.findOne({
        _id: body.conversationId,
        "participants.userId": userId,
      });
      if (!conversation) throw new AppError("Conversation not found", 404);

      const message = await Message.create({
        ...body,
        senderId: userId,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        disappearsAt: body.disappearsAt ? new Date(body.disappearsAt) : undefined,
      });

      if (body.type === "text" && body.content) {
        const urls = extractUrls(body.content);
        if (urls.length > 0) {
          const preview = await fetchLinkPreview(urls[0]);
          if (preview) {
            await Message.findByIdAndUpdate(message._id, { linkPreview: preview });
          }
        }
      }

      await Conversation.findByIdAndUpdate(body.conversationId, {
        lastMessage: message._id,
        updatedAt: new Date(),
      });

      const populated = await Message.findById(message._id)
        .populate("senderId", "username avatar")
        .populate("replyTo", "content senderId type")
        .lean();

      ApiResponse.success(res, populated, 201);
    } catch (error) { next(error); }
  },

  async editMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { messageId } = req.params;
      const body = req.body as EditMessageInput;

      const message = await Message.findOneAndUpdate(
        { _id: messageId, senderId: userId, isDeleted: false },
        { content: body.content, isEdited: true, editedAt: new Date() },
        { new: true }
      ).populate("senderId", "username avatar");

      if (!message) throw new AppError("Message not found", 404);
      ApiResponse.success(res, message);
    } catch (error) { next(error); }
  },

  async deleteMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { messageId } = req.params;
      const { deleteForEveryone } = req.query as { deleteForEveryone?: string };

      const message = await Message.findOne({ _id: messageId, senderId: userId });
      if (!message) throw new AppError("Message not found", 404);

      if (deleteForEveryone === "true") {
        await Message.findByIdAndUpdate(messageId, { isDeleted: true, content: "", media: undefined });
      } else {
        await Message.findByIdAndUpdate(messageId, { $addToSet: { deletedFor: userId } });
      }

      ApiResponse.success(res, { messageId, deleteForEveryone: deleteForEveryone === "true" });
    } catch (error) { next(error); }
  },

  async pinMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { messageId } = req.params;
      const userId = req.user!._id.toString();

      const message = await Message.findById(messageId);
      if (!message) throw new AppError("Message not found", 404);

      const conversation = await Conversation.findOne({
        _id: message.conversationId,
        $or: [{ "participants.userId": userId, "participants.role": { $in: ["owner", "admin"] } }, { owner: userId }],
      });
      if (!conversation) throw new AppError("Not authorized to pin messages", 403);

      const isPinned = !message.isPinned;
      await Message.findByIdAndUpdate(messageId, { isPinned });

      if (isPinned) {
        await Conversation.findByIdAndUpdate(message.conversationId, {
          $addToSet: { pinnedMessages: messageId },
        });
      } else {
        await Conversation.findByIdAndUpdate(message.conversationId, {
          $pull: { pinnedMessages: messageId },
        });
      }

      ApiResponse.success(res, { messageId, isPinned });
    } catch (error) { next(error); }
  },

  async forwardMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { messageId } = req.params;
      const { targetConversationId } = req.body as { targetConversationId: string };
      const userId = req.user!._id.toString();

      const original = await Message.findById(messageId);
      if (!original) throw new AppError("Message not found", 404);

      const targetConversation = await Conversation.findOne({
        _id: targetConversationId,
        "participants.userId": userId,
      });
      if (!targetConversation) throw new AppError("Target conversation not found", 404);

      const forwarded = await Message.create({
        conversationId: targetConversationId,
        senderId: userId,
        type: original.type,
        content: original.content,
        media: original.media,
        forwardedFrom: original._id,
      });

      await Conversation.findByIdAndUpdate(targetConversationId, {
        lastMessage: forwarded._id,
      });

      ApiResponse.success(res, forwarded, 201);
    } catch (error) { next(error); }
  },

  async searchMessages(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { conversationId } = req.params;
      const { q } = req.query as { q: string };
      const userId = req.user!._id.toString();

      if (!q || q.trim().length < 2) throw new AppError("Search query too short",400);

      const conversation = await Conversation.findOne({
        _id: conversationId,
        "participants.userId": userId,
      });
      if (!conversation) throw new AppError("Conversation not found", 404);

      const messages = await Message.find({
        conversationId,
        isDeleted: false,
        $text: { $search: q },
      })
        .sort({ score: { $meta: "textScore" } })
        .limit(50)
        .populate("senderId", "username avatar")
        .lean();

      ApiResponse.success(res, messages);
    } catch (error) { next(error); }
  },

  async translateMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { messageId } = req.params;
      const { targetLang } = req.body as { targetLang: string };

      const message = await Message.findById(messageId);
      if (!message) throw new AppError("Message not found", 404);
      if (!message.content) throw new AppError("No text content to translate", 400);

      const result = await translationService.translate({
        text: message.content,
        targetLang,
      });

      ApiResponse.success(res, result);
    } catch (error) { next(error); }
  },
};