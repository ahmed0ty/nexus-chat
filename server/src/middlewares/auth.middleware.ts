import { Response, NextFunction } from "express";
import { User } from "../DB/models/user.model";
import { AuthRequest } from "../types";
import { verifyAccessToken } from "../utils/jwt.util";
import jwt from "jsonwebtoken";

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ success: false, error: "No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.userId).select("-refreshTokens -twoFactorSecret");
    if (!user) {
      res.status(401).json({ success: false, error: "User not found" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, error: "Token expired" });
    } else {
      res.status(401).json({ success: false, error: "Invalid token" });
    }
  }
};

export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.userId);
      if (user) req.user = user;
    }
  } catch { /* ignore */ }
  next();
};