import { z } from "zod";
export declare const roomIdSchema: z.ZodString;
export declare const conversationIdSchema: z.ZodString;
export declare const userIdSchema: z.ZodString;
export declare const chatMessageSchema: z.ZodObject<{
    id: z.ZodString;
    conversationId: z.ZodString;
    senderId: z.ZodString;
    receiverId: z.ZodOptional<z.ZodString>;
    senderName: z.ZodString;
    body: z.ZodString;
    createdAt: z.ZodString;
    deliveryStatus: z.ZodDefault<z.ZodEnum<["sent", "delivered", "read"]>>;
    kind: z.ZodDefault<z.ZodEnum<["user", "system"]>>;
    mediaUrl: z.ZodOptional<z.ZodString>;
    mediaType: z.ZodDefault<z.ZodEnum<["text", "voice", "image", "file"]>>;
    audioDuration: z.ZodOptional<z.ZodNumber>;
    audioWaveform: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    reactions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    replyTo: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        senderName: z.ZodString;
        body: z.ZodString;
        mediaType: z.ZodOptional<z.ZodEnum<["text", "voice", "image", "file"]>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        senderName: string;
        body: string;
        mediaType?: "text" | "voice" | "image" | "file" | undefined;
    }, {
        id: string;
        senderName: string;
        body: string;
        mediaType?: "text" | "voice" | "image" | "file" | undefined;
    }>>;
    isDeleted: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    body: string;
    createdAt: string;
    deliveryStatus: "sent" | "delivered" | "read";
    kind: "user" | "system";
    mediaType: "text" | "voice" | "image" | "file";
    receiverId?: string | undefined;
    mediaUrl?: string | undefined;
    audioDuration?: number | undefined;
    audioWaveform?: number[] | undefined;
    reactions?: Record<string, string> | undefined;
    replyTo?: {
        id: string;
        senderName: string;
        body: string;
        mediaType?: "text" | "voice" | "image" | "file" | undefined;
    } | undefined;
    isDeleted?: boolean | undefined;
}, {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    body: string;
    createdAt: string;
    receiverId?: string | undefined;
    deliveryStatus?: "sent" | "delivered" | "read" | undefined;
    kind?: "user" | "system" | undefined;
    mediaUrl?: string | undefined;
    mediaType?: "text" | "voice" | "image" | "file" | undefined;
    audioDuration?: number | undefined;
    audioWaveform?: number[] | undefined;
    reactions?: Record<string, string> | undefined;
    replyTo?: {
        id: string;
        senderName: string;
        body: string;
        mediaType?: "text" | "voice" | "image" | "file" | undefined;
    } | undefined;
    isDeleted?: boolean | undefined;
}>;
export declare const reactionPayloadSchema: z.ZodObject<{
    messageId: z.ZodString;
    conversationId: z.ZodString;
    userId: z.ZodString;
    emoji: z.ZodString;
}, "strip", z.ZodTypeAny, {
    conversationId: string;
    emoji: string;
    messageId: string;
    userId: string;
}, {
    conversationId: string;
    emoji: string;
    messageId: string;
    userId: string;
}>;
export declare const deleteMessagePayloadSchema: z.ZodObject<{
    messageId: z.ZodString;
    conversationId: z.ZodString;
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    conversationId: string;
    messageId: string;
    userId: string;
}, {
    conversationId: string;
    messageId: string;
    userId: string;
}>;
export declare const presenceSchema: z.ZodObject<{
    userId: z.ZodString;
    conversationId: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["online", "away", "in_call", "offline"]>;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "online" | "away" | "in_call" | "offline";
    userId: string;
    updatedAt: string;
    conversationId?: string | undefined;
}, {
    status: "online" | "away" | "in_call" | "offline";
    userId: string;
    updatedAt: string;
    conversationId?: string | undefined;
}>;
export declare const typingStartStopSchema: z.ZodObject<{
    conversationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    conversationId: string;
}, {
    conversationId: string;
}>;
export declare const typingUpdateSchema: z.ZodObject<{
    userId: z.ZodString;
    conversationId: z.ZodString;
    isTyping: z.ZodBoolean;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    conversationId: string;
    userId: string;
    updatedAt: string;
    isTyping: boolean;
}, {
    conversationId: string;
    userId: string;
    updatedAt: string;
    isTyping: boolean;
}>;
export declare const signalingPayloadSchema: z.ZodObject<{
    conversationId: z.ZodString;
    fromUserId: z.ZodString;
    toUserId: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodUnknown>;
    candidate: z.ZodOptional<z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    conversationId: string;
    fromUserId: string;
    toUserId?: string | undefined;
    description?: unknown;
    candidate?: unknown;
}, {
    conversationId: string;
    fromUserId: string;
    toUserId?: string | undefined;
    description?: unknown;
    candidate?: unknown;
}>;
export declare const callInviteSchema: z.ZodObject<{
    conversationId: z.ZodString;
    fromUserId: z.ZodString;
    mode: z.ZodEnum<["audio", "video"]>;
}, "strip", z.ZodTypeAny, {
    conversationId: string;
    fromUserId: string;
    mode: "audio" | "video";
}, {
    conversationId: string;
    fromUserId: string;
    mode: "audio" | "video";
}>;
export declare const profileSchema: z.ZodObject<{
    id: z.ZodString;
    username: z.ZodOptional<z.ZodString>;
    nickname: z.ZodString;
    bio: z.ZodDefault<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodString>;
    accountVisibility: z.ZodDefault<z.ZodEnum<["public", "private"]>>;
    status: z.ZodDefault<z.ZodEnum<["online", "away", "in_call", "recording_audio", "offline"]>>;
    lastSeen: z.ZodOptional<z.ZodString>;
    displayName: z.ZodOptional<z.ZodString>;
    statusMessage: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "online" | "away" | "in_call" | "offline" | "recording_audio";
    nickname: string;
    bio: string;
    accountVisibility: "public" | "private";
    email?: string | undefined;
    username?: string | undefined;
    avatarUrl?: string | undefined;
    lastSeen?: string | undefined;
    displayName?: string | undefined;
    statusMessage?: string | undefined;
    phone?: string | undefined;
}, {
    id: string;
    nickname: string;
    status?: "online" | "away" | "in_call" | "offline" | "recording_audio" | undefined;
    email?: string | undefined;
    username?: string | undefined;
    bio?: string | undefined;
    avatarUrl?: string | undefined;
    accountVisibility?: "public" | "private" | undefined;
    lastSeen?: string | undefined;
    displayName?: string | undefined;
    statusMessage?: string | undefined;
    phone?: string | undefined;
}>;
export declare const friendSchema: z.ZodObject<{
    ownerId: z.ZodString;
    friendId: z.ZodString;
    favorite: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    profile: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        username: z.ZodOptional<z.ZodString>;
        nickname: z.ZodString;
        bio: z.ZodDefault<z.ZodString>;
        avatarUrl: z.ZodOptional<z.ZodString>;
        accountVisibility: z.ZodDefault<z.ZodEnum<["public", "private"]>>;
        status: z.ZodDefault<z.ZodEnum<["online", "away", "in_call", "recording_audio", "offline"]>>;
        lastSeen: z.ZodOptional<z.ZodString>;
        displayName: z.ZodOptional<z.ZodString>;
        statusMessage: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        status: "online" | "away" | "in_call" | "offline" | "recording_audio";
        nickname: string;
        bio: string;
        accountVisibility: "public" | "private";
        email?: string | undefined;
        username?: string | undefined;
        avatarUrl?: string | undefined;
        lastSeen?: string | undefined;
        displayName?: string | undefined;
        statusMessage?: string | undefined;
        phone?: string | undefined;
    }, {
        id: string;
        nickname: string;
        status?: "online" | "away" | "in_call" | "offline" | "recording_audio" | undefined;
        email?: string | undefined;
        username?: string | undefined;
        bio?: string | undefined;
        avatarUrl?: string | undefined;
        accountVisibility?: "public" | "private" | undefined;
        lastSeen?: string | undefined;
        displayName?: string | undefined;
        statusMessage?: string | undefined;
        phone?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    createdAt: string;
    updatedAt: string;
    ownerId: string;
    friendId: string;
    favorite: boolean;
    profile?: {
        id: string;
        status: "online" | "away" | "in_call" | "offline" | "recording_audio";
        nickname: string;
        bio: string;
        accountVisibility: "public" | "private";
        email?: string | undefined;
        username?: string | undefined;
        avatarUrl?: string | undefined;
        lastSeen?: string | undefined;
        displayName?: string | undefined;
        statusMessage?: string | undefined;
        phone?: string | undefined;
    } | undefined;
}, {
    createdAt: string;
    updatedAt: string;
    ownerId: string;
    friendId: string;
    favorite: boolean;
    profile?: {
        id: string;
        nickname: string;
        status?: "online" | "away" | "in_call" | "offline" | "recording_audio" | undefined;
        email?: string | undefined;
        username?: string | undefined;
        bio?: string | undefined;
        avatarUrl?: string | undefined;
        accountVisibility?: "public" | "private" | undefined;
        lastSeen?: string | undefined;
        displayName?: string | undefined;
        statusMessage?: string | undefined;
        phone?: string | undefined;
    } | undefined;
}>;
export declare const friendRequestSchema: z.ZodObject<{
    id: z.ZodString;
    requesterId: z.ZodString;
    addresseeId: z.ZodString;
    status: z.ZodEnum<["pending", "accepted", "declined", "cancelled"]>;
    message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
    respondedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    requesterProfile: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        username: z.ZodOptional<z.ZodString>;
        nickname: z.ZodString;
        bio: z.ZodDefault<z.ZodString>;
        avatarUrl: z.ZodOptional<z.ZodString>;
        accountVisibility: z.ZodDefault<z.ZodEnum<["public", "private"]>>;
        status: z.ZodDefault<z.ZodEnum<["online", "away", "in_call", "recording_audio", "offline"]>>;
        lastSeen: z.ZodOptional<z.ZodString>;
        displayName: z.ZodOptional<z.ZodString>;
        statusMessage: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        status: "online" | "away" | "in_call" | "offline" | "recording_audio";
        nickname: string;
        bio: string;
        accountVisibility: "public" | "private";
        email?: string | undefined;
        username?: string | undefined;
        avatarUrl?: string | undefined;
        lastSeen?: string | undefined;
        displayName?: string | undefined;
        statusMessage?: string | undefined;
        phone?: string | undefined;
    }, {
        id: string;
        nickname: string;
        status?: "online" | "away" | "in_call" | "offline" | "recording_audio" | undefined;
        email?: string | undefined;
        username?: string | undefined;
        bio?: string | undefined;
        avatarUrl?: string | undefined;
        accountVisibility?: "public" | "private" | undefined;
        lastSeen?: string | undefined;
        displayName?: string | undefined;
        statusMessage?: string | undefined;
        phone?: string | undefined;
    }>>;
    addresseeProfile: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        username: z.ZodOptional<z.ZodString>;
        nickname: z.ZodString;
        bio: z.ZodDefault<z.ZodString>;
        avatarUrl: z.ZodOptional<z.ZodString>;
        accountVisibility: z.ZodDefault<z.ZodEnum<["public", "private"]>>;
        status: z.ZodDefault<z.ZodEnum<["online", "away", "in_call", "recording_audio", "offline"]>>;
        lastSeen: z.ZodOptional<z.ZodString>;
        displayName: z.ZodOptional<z.ZodString>;
        statusMessage: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        status: "online" | "away" | "in_call" | "offline" | "recording_audio";
        nickname: string;
        bio: string;
        accountVisibility: "public" | "private";
        email?: string | undefined;
        username?: string | undefined;
        avatarUrl?: string | undefined;
        lastSeen?: string | undefined;
        displayName?: string | undefined;
        statusMessage?: string | undefined;
        phone?: string | undefined;
    }, {
        id: string;
        nickname: string;
        status?: "online" | "away" | "in_call" | "offline" | "recording_audio" | undefined;
        email?: string | undefined;
        username?: string | undefined;
        bio?: string | undefined;
        avatarUrl?: string | undefined;
        accountVisibility?: "public" | "private" | undefined;
        lastSeen?: string | undefined;
        displayName?: string | undefined;
        statusMessage?: string | undefined;
        phone?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    status: "pending" | "accepted" | "declined" | "cancelled";
    requesterId: string;
    addresseeId: string;
    message?: string | null | undefined;
    respondedAt?: string | null | undefined;
    requesterProfile?: {
        id: string;
        status: "online" | "away" | "in_call" | "offline" | "recording_audio";
        nickname: string;
        bio: string;
        accountVisibility: "public" | "private";
        email?: string | undefined;
        username?: string | undefined;
        avatarUrl?: string | undefined;
        lastSeen?: string | undefined;
        displayName?: string | undefined;
        statusMessage?: string | undefined;
        phone?: string | undefined;
    } | undefined;
    addresseeProfile?: {
        id: string;
        status: "online" | "away" | "in_call" | "offline" | "recording_audio";
        nickname: string;
        bio: string;
        accountVisibility: "public" | "private";
        email?: string | undefined;
        username?: string | undefined;
        avatarUrl?: string | undefined;
        lastSeen?: string | undefined;
        displayName?: string | undefined;
        statusMessage?: string | undefined;
        phone?: string | undefined;
    } | undefined;
}, {
    id: string;
    createdAt: string;
    status: "pending" | "accepted" | "declined" | "cancelled";
    requesterId: string;
    addresseeId: string;
    message?: string | null | undefined;
    respondedAt?: string | null | undefined;
    requesterProfile?: {
        id: string;
        nickname: string;
        status?: "online" | "away" | "in_call" | "offline" | "recording_audio" | undefined;
        email?: string | undefined;
        username?: string | undefined;
        bio?: string | undefined;
        avatarUrl?: string | undefined;
        accountVisibility?: "public" | "private" | undefined;
        lastSeen?: string | undefined;
        displayName?: string | undefined;
        statusMessage?: string | undefined;
        phone?: string | undefined;
    } | undefined;
    addresseeProfile?: {
        id: string;
        nickname: string;
        status?: "online" | "away" | "in_call" | "offline" | "recording_audio" | undefined;
        email?: string | undefined;
        username?: string | undefined;
        bio?: string | undefined;
        avatarUrl?: string | undefined;
        accountVisibility?: "public" | "private" | undefined;
        lastSeen?: string | undefined;
        displayName?: string | undefined;
        statusMessage?: string | undefined;
        phone?: string | undefined;
    } | undefined;
}>;
export declare const conversationSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["dm", "group"]>;
    title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdBy: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    lastMessageAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    type: "dm" | "group";
    updatedAt: string;
    title?: string | null | undefined;
    createdBy?: string | null | undefined;
    lastMessageAt?: string | null | undefined;
}, {
    id: string;
    createdAt: string;
    type: "dm" | "group";
    updatedAt: string;
    title?: string | null | undefined;
    createdBy?: string | null | undefined;
    lastMessageAt?: string | null | undefined;
}>;
export declare const conversationParticipantSchema: z.ZodObject<{
    conversationId: z.ZodString;
    userId: z.ZodString;
    role: z.ZodEnum<["owner", "member"]>;
    muted: z.ZodBoolean;
    archived: z.ZodBoolean;
    lastReadMessageId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    joinedAt: z.ZodString;
    profile: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        username: z.ZodOptional<z.ZodString>;
        nickname: z.ZodString;
        bio: z.ZodDefault<z.ZodString>;
        avatarUrl: z.ZodOptional<z.ZodString>;
        accountVisibility: z.ZodDefault<z.ZodEnum<["public", "private"]>>;
        status: z.ZodDefault<z.ZodEnum<["online", "away", "in_call", "recording_audio", "offline"]>>;
        lastSeen: z.ZodOptional<z.ZodString>;
        displayName: z.ZodOptional<z.ZodString>;
        statusMessage: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        status: "online" | "away" | "in_call" | "offline" | "recording_audio";
        nickname: string;
        bio: string;
        accountVisibility: "public" | "private";
        email?: string | undefined;
        username?: string | undefined;
        avatarUrl?: string | undefined;
        lastSeen?: string | undefined;
        displayName?: string | undefined;
        statusMessage?: string | undefined;
        phone?: string | undefined;
    }, {
        id: string;
        nickname: string;
        status?: "online" | "away" | "in_call" | "offline" | "recording_audio" | undefined;
        email?: string | undefined;
        username?: string | undefined;
        bio?: string | undefined;
        avatarUrl?: string | undefined;
        accountVisibility?: "public" | "private" | undefined;
        lastSeen?: string | undefined;
        displayName?: string | undefined;
        statusMessage?: string | undefined;
        phone?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    conversationId: string;
    userId: string;
    role: "owner" | "member";
    muted: boolean;
    archived: boolean;
    joinedAt: string;
    profile?: {
        id: string;
        status: "online" | "away" | "in_call" | "offline" | "recording_audio";
        nickname: string;
        bio: string;
        accountVisibility: "public" | "private";
        email?: string | undefined;
        username?: string | undefined;
        avatarUrl?: string | undefined;
        lastSeen?: string | undefined;
        displayName?: string | undefined;
        statusMessage?: string | undefined;
        phone?: string | undefined;
    } | undefined;
    lastReadMessageId?: string | null | undefined;
}, {
    conversationId: string;
    userId: string;
    role: "owner" | "member";
    muted: boolean;
    archived: boolean;
    joinedAt: string;
    profile?: {
        id: string;
        nickname: string;
        status?: "online" | "away" | "in_call" | "offline" | "recording_audio" | undefined;
        email?: string | undefined;
        username?: string | undefined;
        bio?: string | undefined;
        avatarUrl?: string | undefined;
        accountVisibility?: "public" | "private" | undefined;
        lastSeen?: string | undefined;
        displayName?: string | undefined;
        statusMessage?: string | undefined;
        phone?: string | undefined;
    } | undefined;
    lastReadMessageId?: string | null | undefined;
}>;
export declare const messageReceiptSchema: z.ZodObject<{
    messageId: z.ZodString;
    userId: z.ZodString;
    deliveredAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    readAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    messageId: string;
    userId: string;
    deliveredAt?: string | null | undefined;
    readAt?: string | null | undefined;
}, {
    messageId: string;
    userId: string;
    deliveredAt?: string | null | undefined;
    readAt?: string | null | undefined;
}>;
export declare const callSessionSchema: z.ZodObject<{
    id: z.ZodString;
    conversationId: z.ZodString;
    mode: z.ZodEnum<["audio", "video"]>;
    startedBy: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    startedAt: z.ZodString;
    endedAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    summary: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    conversationId: string;
    mode: "audio" | "video";
    startedAt: string;
    startedBy?: string | null | undefined;
    endedAt?: string | null | undefined;
    summary?: string | null | undefined;
}, {
    id: string;
    conversationId: string;
    mode: "audio" | "video";
    startedAt: string;
    startedBy?: string | null | undefined;
    endedAt?: string | null | undefined;
    summary?: string | null | undefined;
}>;
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
export type ServerToClientEvents = {
    "chat:message": (message: ChatMessage) => void;
    "chat:reaction": (payload: ReactionPayload) => void;
    "chat:delete": (payload: DeleteMessagePayload) => void;
    "presence:update": (presence: Presence) => void;
    "typing:update": (payload: TypingUpdate) => void;
    "signal:offer": (payload: SignalingPayload) => void;
    "signal:answer": (payload: SignalingPayload) => void;
    "signal:ice-candidate": (payload: SignalingPayload) => void;
    "call:invite": (payload: CallInvite) => void;
    "call:accept": (payload: CallInvite) => void;
    "call:end": (payload: CallInvite) => void;
    "system:error": (payload: {
        code: string;
        message: string;
    }) => void;
};
export type ClientToServerEvents = {
    "conversation:join": (payload: {
        conversationId: string;
    }) => void;
    "conversation:leave": (payload: {
        conversationId: string;
    }) => void;
    "chat:send": (payload: Omit<ChatMessage, "id" | "createdAt" | "deliveryStatus"> & Partial<Pick<ChatMessage, "deliveryStatus">>) => void;
    "chat:reaction": (payload: ReactionPayload) => void;
    "chat:delete": (payload: DeleteMessagePayload) => void;
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
export declare const coralTheme: {
    readonly surfaceBase: "#0C0B0F";
    readonly surfaceOne: "#131118";
    readonly surfaceTwo: "#1A1820";
    readonly surfaceThree: "#231F2D";
    readonly surfaceFour: "#2D2840";
    readonly coral: "#F25640";
    readonly coralDeep: "#8C2010";
    readonly online: "#2BC98A";
    readonly warning: "#F5A623";
    readonly danger: "#FF4444";
    readonly textPrimary: "#F0EDF8";
    readonly textSecondary: "#9B94B5";
    readonly textTertiary: "#5E5778";
    readonly border: "rgba(255,255,255,0.07)";
};
export declare const appConfig: {
    readonly desktopProtocol: "coral";
    readonly gatewayPort: 3001;
};
//# sourceMappingURL=index.d.ts.map