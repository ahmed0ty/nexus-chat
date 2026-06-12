import { Router } from "express";
import { userController } from "../users/user.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { updateProfileSchema, updateSettingsSchema } from "../users/user.validation";
import { uploadLimiter } from "../../middlewares/rateLimiter.middleware";

const router = Router();

router.use(authenticate);

router.get("/search", userController.searchUsers);
router.get("/:userId", userController.getProfile);
router.put("/profile", validate(updateProfileSchema), userController.updateProfile);
router.put("/settings", validate(updateSettingsSchema), userController.updateSettings);
router.post("/avatar", uploadLimiter, userController.updateAvatar);
router.post("/:userId/block", userController.blockUser);
router.delete("/:userId/block", userController.unblockUser);
router.get("/blocked/list", userController.getBlockedUsers);
router.post("/status", userController.updateCustomStatus);

export default router;