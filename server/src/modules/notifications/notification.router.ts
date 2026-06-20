import { Router } from "express";
import { notificationController } from "./notification.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", notificationController.getNotifications);
router.get("/unread/count", notificationController.getUnreadCount);
router.put("/read/all", notificationController.markAllAsRead);

// ← لازم الـ routes الثابتة (subscribe) تيجي قبل الـ dynamic route (:notificationId)
router.post("/subscribe", notificationController.savePushSubscription);
router.delete("/subscribe", notificationController.removePushSubscription);

router.put("/:notificationId/read", notificationController.markAsRead);
router.delete("/:notificationId", notificationController.deleteNotification);

export default router;