import { Router } from "express";
import { conversationController } from "../conversations/conversation.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { createConversationSchema, updateGroupSchema } from "../conversations/conversation.validation";

const router = Router();

router.use(authenticate);

router.get("/", conversationController.getConversations);
router.post("/", validate(createConversationSchema), conversationController.createConversation);
router.get("/:conversationId", conversationController.getConversation);
router.put("/:conversationId", validate(updateGroupSchema), conversationController.updateGroup);
router.delete("/:conversationId", conversationController.deleteConversation);
router.post("/:conversationId/members", conversationController.addMember);
router.delete("/:conversationId/members/:userId", conversationController.removeMember);
router.post("/:conversationId/leave", conversationController.leaveConversation);
router.get("/:conversationId/invite", conversationController.getInviteLink);
router.post("/join/:inviteLink", conversationController.joinByInviteLink);
router.post("/:conversationId/mute", conversationController.muteConversation);

export default router;