import mongoose, { Schema, Document, Model } from "mongoose";
import { IConversation } from "../../types";
import { v4 as uuidv4 } from "uuid";

export interface IConversationDocument extends Omit<IConversation, "_id">, Document {}

const ConversationSchema = new Schema<IConversationDocument>(
  {
    type: { type: String, enum: ["direct", "group", "channel"], required: true },
    name: { type: String, trim: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    avatar: String,
    participants: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        role: { type: String, enum: ["owner", "admin", "member"], default: "member" },
        joinedAt: { type: Date, default: Date.now },
        nickname: String,
        permissions: {
          sendMessages: { type: Boolean, default: true },
          sendMedia: { type: Boolean, default: true },
          addMembers: { type: Boolean, default: false },
          pinMessages: { type: Boolean, default: false },
          changeGroupInfo: { type: Boolean, default: false },
        },
      },
    ],
    admins: [{ type: Schema.Types.ObjectId, ref: "User" }],
    owner: { type: Schema.Types.ObjectId, ref: "User" },
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
    pinnedMessages: [{ type: Schema.Types.ObjectId, ref: "Message" }],
    inviteLink: { type: String, unique: true, sparse: true, default: () => uuidv4() },
    isPublic: { type: Boolean, default: false },
    maxParticipants: { type: Number, default: 1000 },
    mutedBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        mutedUntil: Date,
        type: { type: String, enum: ["all", "mentions"], default: "all" },
      },
    ],
  },
  { timestamps: true }
);

ConversationSchema.index({ "participants.userId": 1 });

export const Conversation: Model<IConversationDocument> = mongoose.model<IConversationDocument>("Conversation", ConversationSchema);