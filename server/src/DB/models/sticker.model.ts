import mongoose, { Schema, Document, Model } from "mongoose";
import { ISticker, IStickerPack } from "../../types";

export interface IStickerDocument extends Omit<ISticker, "_id">, Document {}
export interface IStickerPackDocument extends Omit<IStickerPack, "_id">, Document {}

const StickerSchema = new Schema<IStickerDocument>({
  packId: { type: Schema.Types.ObjectId, ref: "StickerPack", required: true },
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  emoji: String,
  tags: [String],
});

const StickerPackSchema = new Schema<IStickerPackDocument>(
  {
    name: { type: String, required: true, maxlength: 50 },
    cover: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    stickers: [{ type: Schema.Types.ObjectId, ref: "Sticker" }],
    isPublic: { type: Boolean, default: true },
    downloads: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Sticker: Model<IStickerDocument> = mongoose.model<IStickerDocument>("Sticker", StickerSchema);
export const StickerPack: Model<IStickerPackDocument> = mongoose.model<IStickerPackDocument>("StickerPack", StickerPackSchema);