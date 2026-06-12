export type MessageType =
  | "text" | "image" | "video" | "audio" | "voice_note"
  | "file" | "sticker" | "gif" | "emoji_only" | "location"
  | "reply" | "forward" | "system";

export type UserStatus = "online" | "offline" | "away" | "dnd";
export type ConversationType = "direct" | "group" | "channel";
export type Theme = "light" | "dark" | "system";
export type Language = "ar" | "en" | "es" | "de";

export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  status: UserStatus;
  customStatus?: CustomStatus;
  lastSeen: string;
  isOnline: boolean;
  settings: UserSettings;
}

export interface CustomStatus {
  emoji: string;
  text: string;
  expiresAt?: string;
}

export interface UserSettings {
  theme: Theme;
  language: Language;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  chatTheme: string;
}

export interface NotificationSettings {
  sound: boolean;
  desktop: boolean;
  doNotDisturb: boolean;
  doNotDisturbUntil?: string;
}

export interface PrivacySettings {
  lastSeen: "everyone" | "contacts" | "nobody";
  readReceipts: boolean;
  disappearingMessages?: number;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: User | string;
  type: MessageType;
  content: string;
  media?: MediaContent;
  replyTo?: Message;
  forwardedFrom?: string;
  reactions: Reaction[];
  readBy: ReadReceipt[];
  deliveredTo: string[];
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  isPinned: boolean;
  scheduledAt?: string;
  disappearsAt?: string;
  linkPreview?: LinkPreview;
  mentions: string[];
  createdAt: string;
  updatedAt: string;
  tempId?: string;
  status?: "sending" | "sent" | "delivered" | "read" | "failed";
  translation?: string;
}

export interface MediaContent {
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

export interface Reaction {
  emoji: string;
  users: string[];
}

export interface ReadReceipt {
  userId: string;
  readAt: string;
}

export interface LinkPreview {
  url: string;
  title: string;
  description?: string;
  image?: string;
  siteName?: string;
}

export interface Conversation {
  _id: string;
  type: ConversationType;
  name?: string;
  description?: string;
  avatar?: string;
  participants: Participant[];
  lastMessage?: Message;
  unreadCount: number;
  pinnedMessages: Message[];
  inviteLink?: string;
  isPublic: boolean;
  mutedBy: MuteSetting[];
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  userId: User;
  role: "owner" | "admin" | "member";
  joinedAt: string;
  permissions: Permissions;
  nickname?: string;
}

export interface Permissions {
  sendMessages: boolean;
  sendMedia: boolean;
  addMembers: boolean;
  pinMessages: boolean;
  changeGroupInfo: boolean;
}

export interface MuteSetting {
  userId: string;
  mutedUntil?: string;
  type: "all" | "mentions";
}

export interface Notification {
  _id: string;
  userId: string;
  type: "message" | "mention" | "reaction" | "group_invite" | "system";
  title: string;
  body: string;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface TypingUser {
  userId: string;
  username: string;
  avatar?: string;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: "uploading" | "done" | "error";
  url?: string;
}