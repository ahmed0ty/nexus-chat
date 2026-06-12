import mongoose, { Schema, Document, Model } from "mongoose";
import { IMessage } from "../../types";

export interface IMessageDocument extends Omit<IMessage, "_id">, Document {}

const MessageSchema = new Schema<IMessageDocument>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["text","image","video","audio","voice_note","file","sticker","gif","emoji_only","location","reply","forward","system"],
      required: true,
    },
    content: { type: String, default: "" },
    media: {
      url: String,
      publicId: String,
      type: { type: String, enum: ["image", "video", "audio", "file"] },
      size: Number,
      mimeType: String,
      width: Number,
      height: Number,
      duration: Number,
      thumbnail: String,
      blurhash: String,
      originalName: String,
    },
    replyTo: { type: Schema.Types.ObjectId, ref: "Message", default: null },
    forwardedFrom: { type: Schema.Types.ObjectId, ref: "Message", default: null },
    reactions: [
      {
        emoji: { type: String, required: true },
        users: [{ type: Schema.Types.ObjectId, ref: "User" }],
      },
    ],
    readBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        readAt: { type: Date, default: Date.now },
      },
    ],
    deliveredTo: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedFor: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isPinned: { type: Boolean, default: false },
    scheduledAt: { type: Date, default: null },
    disappearsAt: { type: Date, default: null, index: true },
    location: { latitude: Number, longitude: Number, address: String },
    linkPreview: { url: String, title: String, description: String, image: String, siteName: String },
    thread: [{ type: Schema.Types.ObjectId, ref: "Message" }],
    mentions: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ content: "text" });
// MessageSchema.index({ disappearsAt: 1 }, { expireAfterSeconds: 0, sparse: true });

export const Message: Model<IMessageDocument> = mongoose.model<IMessageDocument>("Message", MessageSchema);