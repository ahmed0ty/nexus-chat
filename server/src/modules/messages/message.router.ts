import { Router } from "express";
import { messageController } from "../messages/message.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { messageLimiter } from "../../middlewares/rateLimiter.middleware";
import { sendMessageSchema, editMessageSchema } from "../messages/message.validation";

const router = Router();

router.use(authenticate);

router.get("/:conversationId", messageController.getMessages);
router.post("/", messageLimiter, validate(sendMessageSchema), messageController.sendMessage);
router.put("/:messageId", validate(editMessageSchema), messageController.editMessage);
router.delete("/:messageId", messageController.deleteMessage);
router.post("/:messageId/pin", messageController.pinMessage);
router.post("/:messageId/forward", messageController.forwardMessage);
router.get("/:conversationId/search", messageController.searchMessages);
router.post("/:messageId/translate", messageController.translateMessage);

export default router;