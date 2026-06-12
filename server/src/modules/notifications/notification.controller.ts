import { Response, NextFunction } from "express";
import { Notification } from "../../DB/models/notification.model";
import { AuthRequest } from "../../types";
import { ApiResponse } from "../../utils/apiResponse.util";
import { getPaginationParams, buildPaginationResult } from "../../utils/pagination.util";
import { notificationService } from "../../services/notification.service";

export const notificationController = {
  async getNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { page, limit, skip } = getPaginationParams(req.query);

      const [notifications, total] = await Promise.all([
        Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Notification.countDocuments({ userId }),
      ]);

      const result = buildPaginationResult(
        notifications as typeof notifications & { _id: unknown }[],
        total, page, limit
      );
      ApiResponse.paginated(res, result.data, result.pagination);
    } catch (error) { next(error); }
  },

  async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const count = await notificationService.getUnreadCount(userId);
      ApiResponse.success(res, { count });
    } catch (error) { next(error); }
  },

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { notificationId } = req.params;
      const userId = req.user!._id.toString();
      await Notification.findOneAndUpdate({ _id: notificationId, userId }, { isRead: true });
      ApiResponse.success(res, { message: "Marked as read" });
    } catch (error) { next(error); }
  },

  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      await Notification.updateMany({ userId, isRead: false }, { isRead: true });
      ApiResponse.success(res, { message: "All notifications marked as read" });
    } catch (error) { next(error); }
  },

  async deleteNotification(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { notificationId } = req.params;
      const userId = req.user!._id.toString();
      await Notification.findOneAndDelete({ _id: notificationId, userId });
      ApiResponse.success(res, { message: "Notification deleted" });
    } catch (error) { next(error); }
  },

  async savePushSubscription(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const subscription = req.body as { endpoint: string; keys: { p256dh: string; auth: string } };
      await notificationService.saveSubscription(userId, subscription);
      ApiResponse.success(res, { message: "Subscription saved" });
    } catch (error) { next(error); }
  },

  async removePushSubscription(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      await notificationService.removeSubscription(userId);
      ApiResponse.success(res, { message: "Subscription removed" });
    } catch (error) { next(error); }
  },
};