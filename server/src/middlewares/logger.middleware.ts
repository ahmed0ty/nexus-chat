import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { v4 as uuidv4 } from "uuid";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  req.requestId = uuidv4();
  req.startTime = Date.now();

  logger.info(`${req.method} ${req.originalUrl} - ${req.ip}`);

  res.on("finish", () => {
    const duration = Date.now() - req.startTime;
    const level = res.statusCode >= 400 ? "warn" : "info";

    logger.log(level, `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });

  next();
};