import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { logger } from "../utils/logger";

const createLimiter = (windowMs: number, max: number, message: string) =>
  rateLimit({
    windowMs,
    max,
    message: { success: false, error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn({
        type: "RATE_LIMIT",
        ip: req.ip,
        url: req.originalUrl,
      });
      res.status(429).json({ success: false, error: message });
    },
  });

const isDev = process.env.NODE_ENV !== "production";

export const globalLimiter = createLimiter(
  15 * 60 * 1000,
  isDev ? 10000 : 200,
  "Too many requests, please try again later"
);

export const authLimiter = createLimiter(
  15 * 60 * 1000,
  isDev ? 1000 : 10,
  "Too many login attempts, please try again after 15 minutes"
);

export const messageLimiter = createLimiter(
  60 * 1000,
  isDev ? 1000 : 60,
  "You are sending messages too fast"
);

export const uploadLimiter = createLimiter(
  60 * 60 * 1000,
  50,
  "Upload limit reached"
);