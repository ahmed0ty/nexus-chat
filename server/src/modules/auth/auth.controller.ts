import { Response, NextFunction } from "express";
import axios from "axios";
import { User } from "../../DB/models/user.model";
import { config } from "../../config";
import { AuthRequest } from "../../types";
import { AppError } from "../../middlewares/error.middleware";
import { ApiResponse } from "../../utils/apiResponse.util";
import { generateTokenPair, verifyRefreshToken } from "../../utils/jwt.util";
import { RegisterInput, LoginInput } from "./auth.validation";

export const authController = {
  async register(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, email, password } = req.body as RegisterInput;

      const exists = await User.findOne({ $or: [{ email }, { username }] });
      if (exists) throw new AppError("Email or username already exists", 409);

      const user = await User.create({ username, email, password });
      const { accessToken, refreshToken } = generateTokenPair(user._id.toString(), user.email);

      await User.findByIdAndUpdate(user._id, {
        $push: { refreshTokens: refreshToken },
      });

      ApiResponse.success(res, {
        user: { _id: user._id, username, email, avatar: user.avatar },
        accessToken,
        refreshToken,
      }, 201);
    } catch (error) { next(error); }
  },

  async login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body as LoginInput;

      const user = await User.findOne({ email }).select("+password +refreshTokens");
      if (!user?.password || !(await user.comparePassword(password))) {
        throw new AppError("Invalid credentials", 401);
      }

      const { accessToken, refreshToken } = generateTokenPair(user._id.toString(), user.email);

      user.refreshTokens.push(refreshToken);
      user.isOnline = true;
      user.status = "online";
      await user.save();

      ApiResponse.success(res, {
        user: { _id: user._id, username: user.username, email: user.email, avatar: user.avatar },
        accessToken,
        refreshToken,
      });
    } catch (error) { next(error); }
  },

  async refreshToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as { refreshToken: string };

      const payload = verifyRefreshToken(refreshToken);
      const user = await User.findById(payload.userId).select("+refreshTokens");

      if (!user?.refreshTokens.includes(refreshToken)) {
        throw new AppError("Invalid refresh token", 401);
      }

      const tokens = generateTokenPair(user._id.toString(), user.email);
      user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
      user.refreshTokens.push(tokens.refreshToken);
      await user.save();

      ApiResponse.success(res, tokens);
    } catch (error) { next(error); }
  },

  async logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      await User.findByIdAndUpdate(req.user?._id, {
        $pull: { refreshTokens: refreshToken },
        isOnline: false,
        status: "offline",
        lastSeen: new Date(),
      });
      ApiResponse.success(res, { message: "Logged out successfully" });
    } catch (error) { next(error); }
  },

  async getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      ApiResponse.success(res, req.user);
    } catch (error) { next(error); }
  },

  async googleOAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body as { token: string };
      const { data } = await axios.get<{
        id: string;
        email: string;
        name: string;
        picture: string;
      }>(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`);

      let user = await User.findOne({ "oauthProviders.providerId": data.id });
      if (!user) {
        const username = data.name.replace(/\s/g, "_").toLowerCase() + "_" + Date.now().toString().slice(-4);
        user = await User.create({
          username,
          email: data.email,
          avatar: data.picture,
          oauthProviders: [{ provider: "google", providerId: data.id }],
        });
      }

      const tokens = generateTokenPair(user._id.toString(), user.email);
      ApiResponse.success(res, { user, ...tokens });
    } catch (error) { next(error); }
  },

  async githubOAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.body as { code: string };

      const tokenRes = await axios.post<{ access_token: string }>(
        "https://github.com/login/oauth/access_token",
        {
          client_id: config.oauth.github.clientId,
          client_secret: config.oauth.github.clientSecret,
          code,
        },
        { headers: { Accept: "application/json" } }
      );

      const { data: profile } = await axios.get<{
        id: number;
        login: string;
        email: string;
        avatar_url: string;
      }>("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
      });

      let user = await User.findOne({ "oauthProviders.providerId": profile.id.toString() });
      if (!user) {
        user = await User.create({
          username: profile.login + "_" + Date.now().toString().slice(-4),
          email: profile.email,
          avatar: profile.avatar_url,
          oauthProviders: [{ provider: "github", providerId: profile.id.toString() }],
        });
      }

      const tokens = generateTokenPair(user._id.toString(), user.email);
      ApiResponse.success(res, { user, ...tokens });
    } catch (error) { next(error); }
  },
};