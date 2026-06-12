import { Router } from "express";
import { stickerController } from "../stickers/sticker.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { uploadLimiter } from "../../middlewares/rateLimiter.middleware";
import multer from "multer";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 50 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/png", "image/gif", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.use(authenticate);

router.get("/packs", stickerController.getPacks);
router.post("/packs", uploadLimiter, upload.single("cover"), stickerController.createPack);
router.get("/packs/:packId", stickerController.getPackStickers);
router.post("/packs/:packId/stickers", uploadLimiter, upload.array("stickers", 50), stickerController.addStickers);
router.delete("/packs/:packId", stickerController.deletePack);
router.get("/recent", stickerController.getRecentStickers);

export default router;