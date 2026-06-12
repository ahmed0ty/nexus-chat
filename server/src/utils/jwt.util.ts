import jwt from "jsonwebtoken";
import { config } from "../config";
import { JwtPayload } from "../types";

export const generateAccessToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email } as JwtPayload,
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
  );
};

export const generateRefreshToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email } as JwtPayload,
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions
  );
};

export const generateTokenPair = (userId: string, email: string) => ({
  accessToken: generateAccessToken(userId, email),
  refreshToken: generateRefreshToken(userId, email),
});

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
};