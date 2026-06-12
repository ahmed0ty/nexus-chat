import { Response, NextFunction } from "express";
import { Types } from "mongoose";
import { Sticker, StickerPack } from "../../DB/models/sticker.model";
import { AuthRequest } from "../../types";
import { ApiResponse } from "../../utils/apiResponse.util";
import { AppError } from "../../middlewares/error.middleware";
import { mediaService } from "../../services/media.service";
import { redis } from "../../DB/redis";

export const stickerController = {
  async getPacks(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();

      const packs = await StickerPack.find({
        $or: [{ isPublic: true }, { createdBy: userId }],
      })
        .populate("createdBy", "username avatar")
        .lean();

      ApiResponse.success(res, packs);
    } catch (error) { next(error); }
  },

  async createPack(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { name, isPublic } = req.body as { name: string; isPublic?: boolean };

      if (!req.file) throw new AppError("Cover image required", 400);

      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const cover = await mediaService.uploadImage(base64, "chat/stickers/covers");

      const pack = await StickerPack.create({
        name,
        cover: cover.url,
        createdBy: userId,
        isPublic: isPublic ?? true,
      });

      ApiResponse.success(res, pack, 201);
    } catch (error) { next(error); }
  },

  async getPackStickers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const packId = Array.isArray(req.params.packId)
        ? req.params.packId[0]
        : req.params.packId;

      const pack = await StickerPack.findById(packId)
        .populate("stickers")
        .lean();

      if (!pack) throw new AppError("Pack not found", 404);
      ApiResponse.success(res, pack);
    } catch (error) { next(error); }
  },

  async addStickers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const packId = Array.isArray(req.params.packId)
        ? req.params.packId[0]
        : req.params.packId;
      const userId = req.user!._id.toString();
      const files = req.files as Express.Multer.File[];

      if (!files?.length) throw new AppError("No sticker files provided", 400);

      const pack = await StickerPack.findOne({ _id: packId, createdBy: userId });
      if (!pack) throw new AppError("Pack not found or not authorized", 404);

      const packObjectId = new Types.ObjectId(packId);

      const uploadedStickers = await Promise.all(
        files.map(async (file) => {
          const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
          const result = await mediaService.uploadImage(base64, "chat/stickers");
          return Sticker.create({
            packId: packObjectId,
            url: result.url,
            publicId: result.publicId,
          });
        })
      );

      const stickerIds = uploadedStickers.map(
        (s) => (s as typeof s & { _id: Types.ObjectId })._id
      );

      await StickerPack.findByIdAndUpdate(packId, {
        $push: { stickers: { $each: stickerIds } },
      });

      ApiResponse.success(res, uploadedStickers, 201);
    } catch (error) { next(error); }
  },

  async deletePack(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const packId = Array.isArray(req.params.packId)
        ? req.params.packId[0]
        : req.params.packId;
      const userId = req.user!._id.toString();

      const pack = await StickerPack.findOne({ _id: packId, createdBy: userId });
      if (!pack) throw new AppError("Pack not found or not authorized", 404);

      const stickers = await Sticker.find({ packId: new Types.ObjectId(packId) });
      await Promise.all(stickers.map((s) => mediaService.deleteMedia(s.publicId)));
      await Promise.all([
        Sticker.deleteMany({ packId: new Types.ObjectId(packId) }),
        StickerPack.findByIdAndDelete(packId),
      ]);

      ApiResponse.success(res, { message: "Pack deleted successfully" });
    } catch (error) { next(error); }
  },

  async getRecentStickers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const recentIds = await redis.lrange(`recent:stickers:${userId}`, 0, 19);

      if (!recentIds.length) {
        ApiResponse.success(res, []);
        return;
      }

      const stickers = await Sticker.find({ _id: { $in: recentIds } }).lean();
      ApiResponse.success(res, stickers);
    } catch (error) { next(error); }
  },
};