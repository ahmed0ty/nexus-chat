import { Response, NextFunction } from "express";
import { v2 as cloudinary } from "cloudinary";
import { AuthRequest } from "../../types";
import { ApiResponse } from "../../utils/apiResponse.util";
import { AppError } from "../../middlewares/error.middleware";
import { mediaService } from "../../services/media.service";
import { redis } from "../../DB/redis";
import { Readable } from "stream";
import { config } from "../../config";

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

interface ChunkUploadBody {
  uploadId: string;
  chunkIndex: number;
  totalChunks: number;
  fileName: string;
  mimeType: string;
  chunk: string;
}

export const mediaController = {
async uploadFile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) throw new AppError("No file provided", 400);

    const { mimetype, buffer, originalname, size } = req.file;

    // فيديو — stream upload مباشر
    if (mimetype.startsWith("video/")) {
  const streamUpload = (): Promise<import("cloudinary").UploadApiResponse> => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "chat/videos",
          resource_type: "video",
          chunk_size: 6000000,
          timeout: 120000, // زود الـ timeout لـ 2 دقيقة
          eager: [{ width: 400, crop: "scale", format: "jpg" }],
          eager_async: true, // عمل الـ thumbnail async
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!);
        }
      );
      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  };

      const result = await streamUpload();
      ApiResponse.success(res, {
        url: result.secure_url,
        publicId: result.public_id,
        type: "video",
        mimeType: mimetype,
        size,
        width: result.width,
        height: result.height,
        duration: result.duration,
        thumbnail: result.eager?.[0]?.secure_url,
        originalName: originalname,
      }, 201);
      return;
    }

    const base64 = `data:${mimetype};base64,${buffer.toString("base64")}`;
    let result;

    if (mimetype.startsWith("image/")) {
      result = await mediaService.uploadImage(base64);
      try {
        const { generateBlurhash } = await import("../../utils/blurhash.util");
        const blurhashValue = await generateBlurhash(buffer);
        result = { ...result, blurhash: blurhashValue };
      } catch { /* ignore */ }
    } else if (mimetype.startsWith("audio/")) {
      result = await mediaService.uploadAudio(base64);
    } else {
      result = await mediaService.uploadFile(base64, originalname);
    }

    ApiResponse.success(res, {
      ...result,
      originalName: originalname,
      mimeType: mimetype,
      size,
    }, 201);
  } catch (error) { next(error); }
},

  async uploadMultiple(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files?.length) throw new AppError("No files provided", 400);

      const uploads = await Promise.all(
        files.map(async (file) => {
          const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
          if (file.mimetype.startsWith("image/")) return mediaService.uploadImage(base64);
          if (file.mimetype.startsWith("video/")) return mediaService.uploadVideo(base64);
          if (file.mimetype.startsWith("audio/")) return mediaService.uploadAudio(base64);
          return mediaService.uploadFile(base64, file.originalname);
        })
      );

      ApiResponse.success(res, uploads, 201);
    } catch (error) { next(error); }
  },

  async uploadChunk(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { uploadId, chunkIndex, totalChunks, chunk } = req.body as ChunkUploadBody;

      await redis.setex(
        `chunk:${uploadId}:${chunkIndex}`,
        3600,
        chunk
      );

      const keys = await redis.keys(`chunk:${uploadId}:*`);
      const receivedChunks = keys.length;

      ApiResponse.success(res, {
        uploadId,
        chunkIndex,
        receivedChunks,
        totalChunks,
        isComplete: receivedChunks === totalChunks,
      });
    } catch (error) { next(error); }
  },

  async completeChunkUpload(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { uploadId, totalChunks, fileName, mimeType } = req.body as Omit<ChunkUploadBody, "chunk" | "chunkIndex">;

      const chunkPromises = Array.from({ length: totalChunks }, (_, i) =>
        redis.get(`chunk:${uploadId}:${i}`)
      );
      const chunks = await Promise.all(chunkPromises);

      if (chunks.some((c) => c === null)) throw new AppError("Missing chunks", 400);

      const combined = chunks.join("");
      const base64 = `data:${mimeType};base64,${combined}`;

      let result;
      if (mimeType.startsWith("image/")) result = await mediaService.uploadImage(base64);
      else if (mimeType.startsWith("video/")) result = await mediaService.uploadVideo(base64);
      else if (mimeType.startsWith("audio/")) result = await mediaService.uploadAudio(base64);
      else result = await mediaService.uploadFile(base64, fileName);

      const deletePromises = Array.from({ length: totalChunks }, (_, i) =>
        redis.del(`chunk:${uploadId}:${i}`)
      );
      await Promise.all(deletePromises);

      ApiResponse.success(res, { ...result, originalName: fileName, mimeType }, 201);
    } catch (error) { next(error); }
  },

  async deleteFile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const publicId = Array.isArray(req.params.publicId)
        ? req.params.publicId[0]
        : req.params.publicId;
      const { resourceType } = req.query as { resourceType?: "image" | "video" | "raw" };

      await mediaService.deleteMedia(publicId, resourceType ?? "image");
      ApiResponse.success(res, { message: "File deleted successfully" });
    } catch (error) { next(error); }
  },
};