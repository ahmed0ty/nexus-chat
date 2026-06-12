import { Router } from "express";
import { mediaController } from "./media.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { uploadLimiter } from "../../middlewares/rateLimiter.middleware";
import multer from "multer";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024,
    files: 10,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "video/mp4", "video/webm", "video/quicktime",
      "video/x-msvideo", "video/mpeg", "video/ogg",
      "audio/mpeg", "audio/ogg", "audio/wav", "audio/webm",
      "application/pdf", "application/zip",
      "text/plain", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const isAllowed = allowedTypes.some((type) =>
      file.mimetype === type ||
      file.mimetype.startsWith(type.split("/")[0] + "/")
    );
    cb(null, isAllowed);
  },
});

router.use(authenticate);
router.use(uploadLimiter);

router.post("/upload", upload.single("file"), mediaController.uploadFile);
router.post("/upload/multiple", upload.array("files", 10), mediaController.uploadMultiple);
router.post("/upload/chunk", mediaController.uploadChunk);
router.post("/upload/chunk/complete", mediaController.completeChunkUpload);
router.delete("/:publicId", mediaController.deleteFile);

export default router;