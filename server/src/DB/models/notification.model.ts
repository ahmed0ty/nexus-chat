import mongoose, { Schema, Document, Model } from "mongoose";
import { INotification } from "../../types";

export interface INotificationDocument extends Omit<INotification, "_id">, Document {}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["message", "mention", "reaction", "group_invite", "system"], required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export const Notification: Model<INotificationDocument> = mongoose.model<INotificationDocument>("Notification", NotificationSchema);