import { Response, NextFunction } from "express";
import { Conversation } from "../../DB/models/conversation.model";
import { Message } from "../../DB/models/message.model";
import { AuthRequest } from "../../types";
import { ApiResponse } from "../../utils/apiResponse.util";
import { AppError } from "../../middlewares/error.middleware";
import { Types } from "mongoose";
import { CreateConversationInput, UpdateGroupInput } from "./conversation.validation";

export const conversationController = {
  async getConversations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();

      const conversations = await Conversation.find({
        "participants.userId": userId,
      })
        .sort({ updatedAt: -1 })
        .populate("participants.userId", "username avatar isOnline lastSeen")
        .populate({
          path: "lastMessage",
          populate: { path: "senderId", select: "username" },
        })
        .lean();

      const withUnread = await Promise.all(
        conversations.map(async (conv) => {
          const unreadCount = await Message.countDocuments({
            conversationId: conv._id,
            "readBy.userId": { $ne: userId },
            senderId: { $ne: userId },
            isDeleted: false,
          });
          return { ...conv, unreadCount };
        })
      );

      ApiResponse.success(res, withUnread);
    } catch (error) { next(error); }
  },

  async createConversation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const body = req.body as CreateConversationInput;

      if (body.type === "direct") {
        if (body.participantIds.length !== 1) throw new AppError("Direct message requires exactly 1 participant", 400);

        const existing = await Conversation.findOne({
          type: "direct",
          "participants.userId": { $all: [userId, body.participantIds[0]] },
        });
        if (existing) {
          ApiResponse.success(res, existing);
          return;
        }
      }

      const allParticipants = [userId, ...body.participantIds];
     const participants = allParticipants.map((id, index) => ({
  userId: new Types.ObjectId(id),
  role: (index === 0 ? "owner" : "member") as "owner" | "admin" | "member",
        joinedAt: new Date(),
        permissions: {
          sendMessages: true,
          sendMedia: true,
          addMembers: index === 0,
          pinMessages: index === 0,
          changeGroupInfo: index === 0,
        },
      }));

      const conversation = await Conversation.create({
        type: body.type,
        name: body.name,
        description: body.description,
        isPublic: body.isPublic,
        participants,
        owner: userId,
        admins: [userId],
        maxParticipants: body.type === "group" ? 1000 : 2,
      });

      const populated = await Conversation.findById(conversation.id)
        .populate("participants.userId", "username avatar isOnline")
        .lean();

      ApiResponse.success(res, populated, 201);
    } catch (error) { next(error); }
  },

  async getConversation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { conversationId } = req.params;
      const userId = req.user!._id.toString();

      const conversation = await Conversation.findOne({
        _id: conversationId,
        "participants.userId": userId,
      })
        .populate("participants.userId", "username avatar isOnline lastSeen status")
        .populate("pinnedMessages")
        .lean();

      if (!conversation) throw new AppError("Conversation not found", 404);
      ApiResponse.success(res, conversation);
    } catch (error) { next(error); }
  },

  async updateGroup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { conversationId } = req.params;
      const userId = req.user!._id.toString();
      const body = req.body as UpdateGroupInput;

      const conversation = await Conversation.findOne({
        _id: conversationId,
        $or: [{ owner: userId }, { admins: userId }],
      });
      if (!conversation) throw new AppError("Not authorized", 403);

      const updated = await Conversation.findByIdAndUpdate(conversationId, body, { new: true })
        .populate("participants.userId", "username avatar isOnline");

      ApiResponse.success(res, updated);
    } catch (error) { next(error); }
  },

  async deleteConversation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { conversationId } = req.params;
      const userId = req.user!._id.toString();

      const conversation = await Conversation.findOne({ _id: conversationId, owner: userId });
      if (!conversation) throw new AppError("Not authorized", 403);

      await Promise.all([
        Conversation.findByIdAndDelete(conversationId),
        Message.deleteMany({ conversationId }),
      ]);

      ApiResponse.success(res, { conversationId });
    } catch (error) { next(error); }
  },

  async addMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { conversationId } = req.params;
      const { userId: newUserId } = req.body as { userId: string };
      const userId = req.user!._id.toString();

      const conversation = await Conversation.findOne({
        _id: conversationId,
        $or: [{ owner: userId }, { admins: userId }],
      });
      if (!conversation) throw new AppError("Not authorized", 403);
      if (conversation.participants.length >= conversation.maxParticipants) throw new AppError("Group is full", 400);

      const alreadyMember = conversation.participants.some((p) => p.userId.toString() === newUserId);
      if (alreadyMember) throw new AppError("User already in conversation", 409);

      await Conversation.findByIdAndUpdate(conversationId, {
        $push: {
          participants: {
            userId: new Types.ObjectId(newUserId),
            role: "member",
            joinedAt: new Date(),
            permissions: { sendMessages: true, sendMedia: true, addMembers: false, pinMessages: false, changeGroupInfo: false },
          },
        },
      });

      ApiResponse.success(res, { message: "Member added successfully" });
    } catch (error) { next(error); }
  },

  async removeMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { conversationId, userId: targetUserId } = req.params;
      const userId = req.user!._id.toString();

      const conversation = await Conversation.findOne({
        _id: conversationId,
        $or: [{ owner: userId }, { admins: userId }],
      });
      if (!conversation) throw new AppError("Not authorized", 403);

      await Conversation.findByIdAndUpdate(conversationId, {
        $pull: { participants: { userId: targetUserId } },
      });

      ApiResponse.success(res, { message: "Member removed successfully" });
    } catch (error) { next(error); }
  },

  async leaveConversation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { conversationId } = req.params;
      const userId = req.user!._id.toString();

      const conversation = await Conversation.findOne({
        _id: conversationId,
        "participants.userId": userId,
      });
      if (!conversation) throw new AppError("Conversation not found", 404);

      if (conversation.owner?.toString() === userId) throw new AppError("Owner cannot leave. Transfer ownership first.", 400);

      await Conversation.findByIdAndUpdate(conversationId, {
        $pull: { participants: { userId }, admins: userId },
      });

      ApiResponse.success(res, { message: "Left conversation successfully" });
    } catch (error) { next(error); }
  },

  async getInviteLink(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { conversationId } = req.params;
      const userId = req.user!._id.toString();

      const conversation = await Conversation.findOne({
        _id: conversationId,
        $or: [{ owner: userId }, { admins: userId }],
      });
      if (!conversation) throw new AppError("Not authorized", 403);

      ApiResponse.success(res, { inviteLink: conversation.inviteLink });
    } catch (error) { next(error); }
  },

  async joinByInviteLink(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { inviteLink } = req.params;
      const userId = req.user!._id.toString();

      const conversation = await Conversation.findOne({ inviteLink });
      if (!conversation) throw new AppError("Invalid invite link", 404);
      if (conversation.participants.length >= conversation.maxParticipants) throw new AppError("Group is full", 400);

      const alreadyMember = conversation.participants.some((p) => p.userId.toString() === userId);
      if (alreadyMember) {
        ApiResponse.success(res, conversation);
        return;
      }

      await Conversation.findByIdAndUpdate(conversation._id, {
        $push: {
          participants: {
            userId: new Types.ObjectId(userId),
            role: "member",
            joinedAt: new Date(),
            permissions: { sendMessages: true, sendMedia: true, addMembers: false, pinMessages: false, changeGroupInfo: false },
          },
        },
      });

      ApiResponse.success(res, conversation);
    } catch (error) { next(error); }
  },

  async muteConversation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { conversationId } = req.params;
      const userId = req.user!._id.toString();
      const { mutedUntil, type } = req.body as { mutedUntil?: string; type?: "all" | "mentions" };

      await Conversation.findByIdAndUpdate(conversationId, {
        $pull: { mutedBy: { userId } },
      });

      await Conversation.findByIdAndUpdate(conversationId, {
        $push: { mutedBy: { userId, mutedUntil: mutedUntil ? new Date(mutedUntil) : undefined, type: type ?? "all" } },
      });

      ApiResponse.success(res, { message: "Conversation muted" });
    } catch (error) { next(error); }
  },
};