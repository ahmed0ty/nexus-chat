import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser } from "../../types";

export interface IUserDocument extends Omit<IUser, "_id">, Document {
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, minlength: 8, select: false },
    avatar: { type: String, default: null },
    bio: { type: String, maxlength: 200, default: "" },
    status: { type: String, enum: ["online", "offline", "away", "dnd"], default: "offline" },
    customStatus: {
      emoji: String,
      text: { type: String, maxlength: 100 },
      expiresAt: Date,
    },
    lastSeen: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    oauthProviders: [{ provider: { type: String, enum: ["google", "github"] }, providerId: String }],
    blockedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    savedMessages: [{ type: Schema.Types.ObjectId, ref: "Message" }],
    refreshTokens: { type: [String], select: false, default: [] },
pushSubscriptions: {
  type: [
    {
      endpoint: { type: String, required: true },
      keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true },
      },
    },
  ],
  default: [],
},
    settings: {
      theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
      language: { type: String, enum: ["ar", "en", "es", "de"], default: "en" },
      notifications: {
        sound: { type: Boolean, default: true },
        desktop: { type: Boolean, default: true },
        doNotDisturb: { type: Boolean, default: false },
        doNotDisturbUntil: Date,
      },
      privacy: {
        lastSeen: { type: String, enum: ["everyone", "contacts", "nobody"], default: "everyone" },
        readReceipts: { type: Boolean, default: true },
        disappearingMessages: { type: Number, default: null },
      },
      chatTheme: { type: String, default: "default" },
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

UserSchema.index({ username: "text", email: "text" });

export const User: Model<IUserDocument> = mongoose.model<IUserDocument>("User", UserSchema);