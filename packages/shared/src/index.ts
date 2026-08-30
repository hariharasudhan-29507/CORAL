import { z } from "zod";

export const roomIdSchema = z.string().min(3).max(80);
export const conversationIdSchema = z.string().uuid();
export const userIdSchema = z.string().min(3).max(120);

export const chatMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string().min(3).max(120),
  senderId: userIdSchema,
  receiverId: z.string().uuid().optional(),
  senderName: z.string().min(1).max(120),
  body: z.string().max(8000),
  createdAt: z.string().datetime(),
  deliveryStatus: z.enum(["sent", "delivered", "read"]).default("sent"),
  kind: z.enum(["user", "system"]).default("user"),
  mediaUrl: z.string().optional(),
  mediaType: z.enum(["text", "voice", "image", "file"]).default("text"),
  audioDuration: z.number().optional(),
  audioWaveform: z.array(z.number()).optional(),
  reactions: z.record(z.string(), z.string()).optional(),
  replyTo: z
    .object({
      id: z.string(),
      senderName: z.string(),
      body: z.string(),
      mediaType: z.enum(["text", "voice", "image", "file"]).optional(),
    })
    .optional(),
  isDeleted: z.boolean().optional(),
});

export const reactionPayloadSchema = z.object({
  messageId: z.string(),
  conversationId: z.string(),
  userId: userIdSchema,
  emoji: z.string(),
});

export const deleteMessagePayloadSchema = z.object({
  messageId: z.string(),
  conversationId: z.string(),
  userId: userIdSchema,
});

export const presenceSchema = z.object({
  userId: userIdSchema,
  conversationId: z.string().min(3).max(120).optional(),
  status: z.enum(["online", "away", "in_call", "offline"]),
  updatedAt: z.string().datetime(),
});

export const typingStartStopSchema = z.object({
  conversationId: z.string().min(3).max(120),
});

export const typingUpdateSchema = z.object({
  userId: userIdSchema,
  conversationId: z.string().min(3).max(120),
  isTyping: z.boolean(),
  updatedAt: z.string().datetime(),
});

export const signalingPayloadSchema = z.object({
  conversationId: z.string().min(3).max(120),
  fromUserId: userIdSchema,
  toUserId: userIdSchema.optional(),
  description: z.unknown().optional(),
  candidate: z.unknown().optional(),
});

export const callInviteSchema = z.object({
  conversationId: z.string().min(3).max(120),
  fromUserId: userIdSchema,
  mode: z.enum(["audio", "video"]),
});

export const profileSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3).max(30).optional(),
  nickname: z.string().min(1).max(120),
  bio: z.string().max(280).default(""),
  avatarUrl: z.string().url().optional(),
  accountVisibility: z.enum(["public", "private"]).default("public"),
  status: z.enum(["online", "away", "in_call", "recording_audio", "offline"]).default("offline"),
  lastSeen: z.string().datetime().optional(),
  displayName: z.string().min(1).max(120).optional(),
  statusMessage: z.string().max(160).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export const friendSchema = z.object({
  ownerId: z.string().uuid(),
  friendId: z.string().uuid(),
  favorite: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  profile: profileSchema.optional(),
});

export const friendRequestSchema = z.object({
  id: z.string().uuid(),
  requesterId: z.string().uuid(),
  addresseeId: z.string().uuid(),
  status: z.enum(["pending", "accepted", "declined", "cancelled"]),
  message: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  respondedAt: z.string().datetime().nullable().optional(),
  requesterProfile: profileSchema.optional(),
  addresseeProfile: profileSchema.optional(),
});

export const conversationSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["dm", "group"]),
  title: z.string().nullable().optional(),
  createdBy: z.string().uuid().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastMessageAt: z.string().datetime().nullable().optional(),
});

export const conversationParticipantSchema = z.object({
  conversationId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(["owner", "member"]),
  muted: z.boolean(),
  archived: z.boolean(),
  lastReadMessageId: z.string().uuid().nullable().optional(),
  joinedAt: z.string().datetime(),
  profile: profileSchema.optional(),
});

export const noteSchema = z.object({
  id: z.string(),
  userId: userIdSchema,
  username: z.string().optional(),
  nickname: z.string(),
  avatarUrl: z.string().optional(),
  text: z.string().max(60),
  emoji: z.string().max(8).optional(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

export const readReceiptPayloadSchema = z.object({
  conversationId: z.string(),
  userId: userIdSchema,
  messageId: z.string().optional(),
  readAt: z.string().datetime(),
});

export const vanishingModePayloadSchema = z.object({
  conversationId: z.string(),
  enabled: z.boolean(),
});

export const createGroupPayloadSchema = z.object({
  title: z.string().min(1).max(80),
  memberIds: z.array(userIdSchema).min(1),
});

export const messageReceiptSchema = z.object({
  messageId: z.string().uuid(),
  userId: z.string().uuid(),
  deliveredAt: z.string().datetime().nullable().optional(),
  readAt: z.string().datetime().nullable().optional(),
});

export const callSessionSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  mode: z.enum(["audio", "video"]),
  startedBy: z.string().uuid().nullable().optional(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().nullable().optional(),
  summary: z.string().nullable().optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ReactionPayload = z.infer<typeof reactionPayloadSchema>;
export type DeleteMessagePayload = z.infer<typeof deleteMessagePayloadSchema>;
export type Presence = z.infer<typeof presenceSchema>;
export type SignalingPayload = z.infer<typeof signalingPayloadSchema>;
export type CallInvite = z.infer<typeof callInviteSchema>;
export type TypingUpdate = z.infer<typeof typingUpdateSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Friend = z.infer<typeof friendSchema>;
export type FriendRequest = z.infer<typeof friendRequestSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type ConversationParticipant = z.infer<typeof conversationParticipantSchema>;
export type MessageReceipt = z.infer<typeof messageReceiptSchema>;
export type CallSession = z.infer<typeof callSessionSchema>;
export type Note = z.infer<typeof noteSchema>;
export type ReadReceiptPayload = z.infer<typeof readReceiptPayloadSchema>;
export type VanishingModePayload = z.infer<typeof vanishingModePayloadSchema>;
export type CreateGroupPayload = z.infer<typeof createGroupPayloadSchema>;

export type ServerToClientEvents = {
  "chat:message": (message: ChatMessage) => void;
  "chat:reaction": (payload: ReactionPayload) => void;
  "chat:delete": (payload: DeleteMessagePayload) => void;
  "chat:read": (payload: ReadReceiptPayload) => void;
  "chat:vanishing": (payload: VanishingModePayload) => void;
  "note:sync": (notes: Note[]) => void;
  "presence:update": (presence: Presence) => void;
  "typing:update": (payload: TypingUpdate) => void;
  "signal:offer": (payload: SignalingPayload) => void;
  "signal:answer": (payload: SignalingPayload) => void;
  "signal:ice-candidate": (payload: SignalingPayload) => void;
  "call:invite": (payload: CallInvite) => void;
  "call:accept": (payload: CallInvite) => void;
  "call:end": (payload: CallInvite) => void;
  "system:error": (payload: { code: string; message: string }) => void;
};

export type ClientToServerEvents = {
  "conversation:join": (payload: { conversationId: string }) => void;
  "conversation:leave": (payload: { conversationId: string }) => void;
  "chat:send": (payload: Omit<ChatMessage, "id" | "createdAt" | "deliveryStatus"> & Partial<Pick<ChatMessage, "deliveryStatus">>) => void;
  "chat:reaction": (payload: ReactionPayload) => void;
  "chat:delete": (payload: DeleteMessagePayload) => void;
  "chat:read": (payload: ReadReceiptPayload) => void;
  "chat:vanishing": (payload: VanishingModePayload) => void;
  "note:publish": (payload: { text: string; emoji?: string }) => void;
  "note:fetch": () => void;
  "presence:set": (payload: Pick<Presence, "status" | "conversationId">) => void;
  "typing:start": (payload: z.infer<typeof typingStartStopSchema>) => void;
  "typing:stop": (payload: z.infer<typeof typingStartStopSchema>) => void;
  "signal:offer": (payload: SignalingPayload) => void;
  "signal:answer": (payload: SignalingPayload) => void;
  "signal:ice-candidate": (payload: SignalingPayload) => void;
  "call:invite": (payload: CallInvite) => void;
  "call:accept": (payload: CallInvite) => void;
  "call:end": (payload: CallInvite) => void;
};

export const coralTheme = {
  surfaceBase: "#0C0B0F",
  surfaceOne: "#131118",
  surfaceTwo: "#1A1820",
  surfaceThree: "#231F2D",
  surfaceFour: "#2D2840",
  coral: "#F25640",
  coralDeep: "#8C2010",
  online: "#2BC98A",
  warning: "#F5A623",
  danger: "#FF4444",
  textPrimary: "#F0EDF8",
  textSecondary: "#9B94B5",
  textTertiary: "#5E5778",
  border: "rgba(255,255,255,0.07)",
} as const;

export const appConfig = {
  desktopProtocol: "coral",
  gatewayPort: 3001,
} as const;
