import { Router } from "express";
import { authController } from "./auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { authLimiter } from "../../middlewares/rateLimiter.middleware";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  oauthSchema,
  githubOAuthSchema,
} from "./auth.validation";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/refresh", validate(refreshTokenSchema), authController.refreshToken);
router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.getMe);
router.post("/oauth/google", authLimiter, validate(oauthSchema), authController.googleOAuth);
router.post("/oauth/github", authLimiter, validate(githubOAuthSchema), authController.githubOAuth);

export default router;