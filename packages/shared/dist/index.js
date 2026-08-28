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
};
export const appConfig = {
    desktopProtocol: "coral",
    gatewayPort: 3001,
};
