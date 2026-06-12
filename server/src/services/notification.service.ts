import webpush from "web-push";
import { Notification } from "../DB/models/notification.model";
import { User } from "../DB/models/user.model";
import { NotificationType } from "../types";
import { redis } from "../DB/redis";
import { logger } from "../utils/logger";

webpush.setVapidDetails(
  "mailto:admin@nexus-chat.com",
  process.env.VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface PushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

class NotificationService {
  async create(options: CreateNotificationOptions) {
    const notification = await Notification.create({
      userId: options.userId,
      type: options.type,
      title: options.title,
      body: options.body,
      data: options.data ?? {},
    });

    await this.sendPushNotification(options.userId, {
      title: options.title,
      body: options.body,
      data: options.data,
    });

    return notification;
  }

  async saveSubscription(userId: string, subscription: PushSubscription): Promise<void> {
    await redis.set(
      `push:subscription:${userId}`,
      JSON.stringify(subscription)
    );
  }

  async removeSubscription(userId: string): Promise<void> {
    await redis.del(`push:subscription:${userId}`);
  }

  private async sendPushNotification(
    userId: string,
    payload: { title: string; body: string; data?: Record<string, unknown> }
  ): Promise<void> {
    try {
      const subscriptionData = await redis.get(`push:subscription:${userId}`);
      if (!subscriptionData) return;

      const subscription = JSON.parse(subscriptionData) as PushSubscription;

      const user = await User.findById(userId).select("settings");
      if (!user?.settings.notifications.desktop) return;
      if (user.settings.notifications.doNotDisturb) {
        const until = user.settings.notifications.doNotDisturbUntil;
        if (!until || new Date() < until) return;
      }

      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          data: payload.data,
          icon: "/icons/icon-192x192.png",
          badge: "/icons/badge-72x72.png",
        })
      );
    } catch (error) {
      logger.error("Push notification failed:", error);
    }
  }

  async notifyNewMessage(
    recipientId: string,
    senderName: string,
    messagePreview: string,
    conversationId: string
  ): Promise<void> {
    await this.create({
      userId: recipientId,
      type: "message",
      title: senderName,
      body: messagePreview,
      data: { conversationId },
    });
  }

  async notifyMention(
    recipientId: string,
    senderName: string,
    conversationId: string,
    messageId: string
  ): Promise<void> {
    await this.create({
      userId: recipientId,
      type: "mention",
      title: "You were mentioned",
      body: `${senderName} mentioned you`,
      data: { conversationId, messageId },
    });
  }

  async notifyReaction(
    recipientId: string,
    senderName: string,
    emoji: string,
    messageId: string
  ): Promise<void> {
    await this.create({
      userId: recipientId,
      type: "reaction",
      title: "New reaction",
      body: `${senderName} reacted ${emoji} to your message`,
      data: { messageId },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({ userId, isRead: false });
  }
}

export const notificationService = new NotificationService();