import { Response, NextFunction } from "express";
import { User } from "../../DB/models/user.model";
import { AuthRequest } from "../../types";
import { ApiResponse } from "../../utils/apiResponse.util";
import { AppError } from "../../middlewares/error.middleware";
import { mediaService } from "../../services/media.service";
import { UpdateProfileInput, UpdateSettingsInput } from "./user.validation";

export const userController = {
  async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const currentUserId = req.user!._id.toString();

      const user = await User.findById(userId).select("-refreshTokens -twoFactorSecret");
      if (!user) throw new AppError("User not found", 404);

      const isBlocked = user.blockedUsers.some((id) => id.toString() === currentUserId);
      if (isBlocked) throw new AppError("User not found", 404);

      ApiResponse.success(res, user);
    } catch (error) { next(error); }
  },

  async searchUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q } = req.query as { q: string };
      const currentUserId = req.user!._id.toString();

      if (!q || q.trim().length < 2) throw new AppError("Search query too short", 400);

      const users = await User.find({
        $or: [
          { username: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
        ],
        _id: { $ne: currentUserId },
        blockedUsers: { $ne: currentUserId },
      })
        .select("username email avatar isOnline lastSeen status")
        .limit(20)
        .lean();

      ApiResponse.success(res, users);
    } catch (error) { next(error); }
  },

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const body = req.body as UpdateProfileInput;

      if (body.username) {
        const exists = await User.findOne({ username: body.username, _id: { $ne: userId } });
        if (exists) throw new AppError("Username already taken", 409);
      }

      const user = await User.findByIdAndUpdate(userId, body, { new: true })
        .select("-refreshTokens -twoFactorSecret");

      ApiResponse.success(res, user);
    } catch (error) { next(error); }
  },

  async updateSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const body = req.body as UpdateSettingsInput;

      const updateFields: Record<string, unknown> = {};
      if (body.theme) updateFields["settings.theme"] = body.theme;
      if (body.language) updateFields["settings.language"] = body.language;
      if (body.chatTheme) updateFields["settings.chatTheme"] = body.chatTheme;
      if (body.notifications) {
        Object.entries(body.notifications).forEach(([key, value]) => {
          if (value !== undefined) updateFields[`settings.notifications.${key}`] = value;
        });
      }
      if (body.privacy) {
        Object.entries(body.privacy).forEach(([key, value]) => {
          if (value !== undefined) updateFields[`settings.privacy.${key}`] = value;
        });
      }

      const user = await User.findByIdAndUpdate(userId, { $set: updateFields }, { new: true })
        .select("-refreshTokens -twoFactorSecret");

      ApiResponse.success(res, user);
    } catch (error) { next(error); }
  },

  async updateAvatar(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { base64Image } = req.body as { base64Image: string };
      if (!base64Image) throw new AppError("No image provided", 400);

      const result = await mediaService.uploadImage(base64Image, "chat/avatars");
      const user = await User.findByIdAndUpdate(userId, { avatar: result.url }, { new: true })
        .select("username avatar");

      ApiResponse.success(res, user);
    } catch (error) { next(error); }
  },

  async blockUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { userId: targetId } = req.params;

      if (userId === targetId) throw new AppError("Cannot block yourself", 400);

      await User.findByIdAndUpdate(userId, { $addToSet: { blockedUsers: targetId } });
      ApiResponse.success(res, { message: "User blocked successfully" });
    } catch (error) { next(error); }
  },

  async unblockUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { userId: targetId } = req.params;

      await User.findByIdAndUpdate(userId, { $pull: { blockedUsers: targetId } });
      ApiResponse.success(res, { message: "User unblocked successfully" });
    } catch (error) { next(error); }
  },

  async getBlockedUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const user = await User.findById(userId).populate("blockedUsers", "username avatar email");
      ApiResponse.success(res, user?.blockedUsers ?? []);
    } catch (error) { next(error); }
  },

  async updateCustomStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { emoji, text, expiresAt } = req.body as { emoji: string; text: string; expiresAt?: string };

      const user = await User.findByIdAndUpdate(
        userId,
        { customStatus: { emoji, text, expiresAt: expiresAt ? new Date(expiresAt) : undefined } },
        { new: true }
      ).select("username customStatus");

      ApiResponse.success(res, user);
    } catch (error) { next(error); }
  },
};