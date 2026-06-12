import { v2 as cloudinary } from "cloudinary";
import { config } from "../config";

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
   timeout: 120000, // أضف ده
});

interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  duration?: number;
  format: string;
  size: number;
  thumbnail?: string;
}

class MediaService {
  async uploadImage(filePath: string, folder: string = "chat/images"): Promise<UploadResult> {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "image",
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes,
    };
  }

  async uploadVideo(filePath: string, folder: string = "chat/videos"): Promise<UploadResult> {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "video",
      eager: [{ width: 400, crop: "scale", format: "jpg" }],
      eager_async: true,
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      duration: result.duration,
      format: result.format,
      size: result.bytes,
      thumbnail: result.eager?.[0]?.secure_url,
    };
  }

  async uploadAudio(filePath: string, folder: string = "chat/audio"): Promise<UploadResult> {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "video",
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      duration: result.duration,
      format: result.format,
      size: result.bytes,
    };
  }

  async uploadFile(filePath: string, originalName: string, folder: string = "chat/files"): Promise<UploadResult> {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "raw",
      public_id: `${Date.now()}-${originalName}`,
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
    };
  }

  async deleteMedia(publicId: string, resourceType: "image" | "video" | "raw" = "image"): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  }

  generateThumbnailUrl(publicId: string, width: number = 400): string {
    return cloudinary.url(publicId, { width, crop: "scale", format: "jpg", quality: "auto" });
  }
}

export const mediaService = new MediaService();