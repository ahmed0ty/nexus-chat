import webpush from "web-push";
import { config } from "../config";
import { User } from "../DB/models/user.model";
import { logger } from "../utils/logger";

webpush.setVapidDetails(
  config.vapid.subject,
  config.vapid.publicKey,
  config.vapid.privateKey
);

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  conversationId?: string;
  tag?: string;
}

export const pushNotificationService = {
  async sendToUser(userId: string, payload: NotificationPayload): Promise<void> {
    try {
      const user = await User.findById(userId).select("pushSubscriptions");
      if (!user || user.pushSubscriptions.length === 0) return;

      const notificationData = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || "/icon-192.png",
        badge: "/icon-192.png",
        url: payload.url || "/chat",
        conversationId: payload.conversationId,
        tag: payload.tag || "message",
      });

      const results = await Promise.allSettled(
        user.pushSubscriptions.map((sub) =>
          webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
            },
            notificationData
          )
        )
      );

      // شيل الـ subscriptions اللي ماتت (expired/invalid)
      const deadEndpoints: string[] = [];
      results.forEach((result, i) => {
        if (
          result.status === "rejected" &&
          (result.reason?.statusCode === 410 || result.reason?.statusCode === 404)
        ) {
          deadEndpoints.push(user.pushSubscriptions[i].endpoint);
        }
      });

      if (deadEndpoints.length > 0) {
        await User.findByIdAndUpdate(userId, {
          $pull: { pushSubscriptions: { endpoint: { $in: deadEndpoints } } },
        });
      }
    } catch (err) {
      logger.error({ type: "PUSH_NOTIFICATION_ERROR", error: err });
    }
  },

  async saveSubscription(
    userId: string,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
  ): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $addToSet: { pushSubscriptions: subscription },
    });
  },

  async removeSubscription(userId: string, endpoint: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { pushSubscriptions: { endpoint } },
    });
  },
};