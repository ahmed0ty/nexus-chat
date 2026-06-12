import { Router } from "express";
import { notificationController } from "./notification.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", notificationController.getNotifications);
router.get("/unread/count", notificationController.getUnreadCount);
router.put("/:notificationId/read", notificationController.markAsRead);
router.put("/read/all", notificationController.markAllAsRead);
router.delete("/:notificationId", notificationController.deleteNotification);
router.post("/subscribe", notificationController.savePushSubscription);
router.delete("/subscribe", notificationController.removePushSubscription);

export default router;