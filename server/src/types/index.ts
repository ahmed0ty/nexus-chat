import { Types } from "mongoose";
import { Request } from "express";

export interface IUser {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  status: UserStatus;
  customStatus?: ICustomStatus;
  lastSeen: Date;
  isOnline: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  oauthProviders: IOAuthProvider[];
  blockedUsers: Types.ObjectId[];
  savedMessages: Types.ObjectId[];
  settings: IUserSettings;
  refreshTokens: string[];
  pushSubscriptions: IPushSubscription[]; // ← أضف ده
  createdAt: Date;
  updatedAt: Date;
}
export interface IPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export type UserStatus = "online" | "offline" | "away" | "dnd";

export interface ICustomStatus {
  emoji: string;
  text: string;
  expiresAt?: Date;
}

export interface IOAuthProvider {
  provider: "google" | "github";
  providerId: string;
}

export interface IUserSettings {
  theme: "light" | "dark" | "system";
  language: "ar" | "en" | "es" | "de";
  notifications: INotificationSettings;
  privacy: IPrivacySettings;
  chatTheme: string;
}

export interface INotificationSettings {
  sound: boolean;
  desktop: boolean;
  doNotDisturb: boolean;
  doNotDisturbUntil?: Date;
}

export interface IPrivacySettings {
  lastSeen: "everyone" | "contacts" | "nobody";
  readReceipts: boolean;
  disappearingMessages?: number;
}

export type MessageType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "voice_note"
  | "file"
  | "sticker"
  | "gif"
  | "emoji_only"
  | "location"
  | "reply"
  | "forward"
  | "system";

export interface IMessage {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  type: MessageType;
  content: string;
  media?: IMediaContent;
  replyTo?: Types.ObjectId;
  forwardedFrom?: Types.ObjectId;
  reactions: IReaction[];
  readBy: IReadReceipt[];
  deliveredTo: Types.ObjectId[];
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedFor: Types.ObjectId[];
  isPinned: boolean;
  scheduledAt?: Date;
  disappearsAt?: Date;
  location?: ILocation;
  linkPreview?: ILinkPreview;
  thread?: Types.ObjectId[];
  mentions: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IMediaContent {
  url: string;
  publicId: string;
  type: "image" | "video" | "audio" | "file";
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  duration?: number;
  thumbnail?: string;
  blurhash?: string;
  originalName?: string;
}

export interface IReaction {
  emoji: string;
  users: Types.ObjectId[];
}

export interface IReadReceipt {
  userId: Types.ObjectId;
  readAt: Date;
}

export interface ILocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface ILinkPreview {
  url: string;
  title: string;
  description?: string;
  image?: string;
  siteName?: string;
}

export type ConversationType = "direct" | "group" | "channel";

export interface IConversation {
  _id: Types.ObjectId;
  type: ConversationType;
  name?: string;
  description?: string;
  avatar?: string;
  participants: IParticipant[];
  admins: Types.ObjectId[];
  owner?: Types.ObjectId;
  lastMessage?: Types.ObjectId;
  pinnedMessages: Types.ObjectId[];
  inviteLink?: string;
  isPublic: boolean;
  maxParticipants: number;
  mutedBy: IMuteSetting[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IParticipant {
  userId: Types.ObjectId;
  role: "owner" | "admin" | "member";
  joinedAt: Date;
  permissions: IPermissions;
  nickname?: string;
}

export interface IPermissions {
  sendMessages: boolean;
  sendMedia: boolean;
  addMembers: boolean;
  pinMessages: boolean;
  changeGroupInfo: boolean;
}

export interface IMuteSetting {
  userId: Types.ObjectId;
  mutedUntil?: Date;
  type: "all" | "mentions";
}

export interface INotification {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

export type NotificationType =
  | "message"
  | "mention"
  | "reaction"
  | "group_invite"
  | "system";

export interface ISticker {
  _id: Types.ObjectId;
  packId: Types.ObjectId;
  url: string;
  publicId: string;
  emoji?: string;
  tags: string[];
}

export interface IStickerPack {
  _id: Types.ObjectId;
  name: string;
  cover: string;
  createdBy: Types.ObjectId;
  stickers: Types.ObjectId[];
  isPublic: boolean;
  downloads: number;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface SocketUser {
  userId: string;
  username: string;
  avatar?: string;
  socketId: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}