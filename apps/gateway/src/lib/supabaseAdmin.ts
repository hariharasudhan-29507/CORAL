import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  ChatMessage,
  Conversation,
  ConversationParticipant,
  Friend,
  FriendRequest,
  Presence,
  Profile,
} from "@coral/shared";
import { env } from "../config/env.js";
import type { AuthUser } from "../modules/auth/auth.service.js";

let supabase: SupabaseClient | null = null;

const profileColumns =
  "id, username, nickname, bio, avatar_url, account_visibility, email, phone, created_at, updated_at";

export function getSupabaseAdmin(): SupabaseClient | null {
  if (supabase) return supabase;
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;

  supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: "public" },
  });

  return supabase;
}

function requireSupabase() {
  const client = getSupabaseAdmin();
  if (!client) {
    throw new Error("Supabase admin access is not configured.");
  }
  return client;
}

function toIso(value: string | null | undefined) {
  return value ? new Date(value).toISOString() : undefined;
}

function mapProfile(row: any): Profile {
  return {
    id: row.id,
    username: row.username ?? undefined,
    nickname: row.nickname,
    bio: row.bio ?? "",
    avatarUrl: row.avatar_url ?? undefined,
    accountVisibility: row.account_visibility ?? "public",
    status: row.status ?? "offline",
    lastSeen: toIso(row.last_seen),
    displayName: row.nickname,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
  };
}

function mapFriend(row: any, profile?: Profile): Friend {
  return {
    ownerId: row.owner_id,
    friendId: row.friend_id,
    favorite: Boolean(row.favorite),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    profile,
  };
}

function mapFriendRequest(row: any, requesterProfile?: Profile, addresseeProfile?: Profile): FriendRequest {
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: row.status,
    message: row.message ?? undefined,
    createdAt: new Date(row.created_at).toISOString(),
    respondedAt: toIso(row.responded_at),
    requesterProfile,
    addresseeProfile,
  };
}

function mapConversation(row: any): Conversation {
  return {
    id: row.id,
    type: row.type,
    title: row.title ?? undefined,
    createdBy: row.created_by ?? undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    lastMessageAt: toIso(row.last_message_at),
  };
}

function mapParticipant(row: any, profile?: Profile): ConversationParticipant {
  return {
    conversationId: row.conversation_id,
    userId: row.user_id,
    role: row.role,
    muted: Boolean(row.muted),
    archived: Boolean(row.archived),
    lastReadMessageId: row.last_read_message_id ?? undefined,
    joinedAt: new Date(row.joined_at).toISOString(),
    profile,
  };
}

function nicknameForUser(user: AuthUser) {
  const nickname = user.name || user.email || user.phone;
  if (!nickname) throw new Error("Authenticated user is missing profile identity.");
  return nickname;
}

function normalizeUsername(username: string) {
  return username.trim().replace(/^@/, "").toLowerCase();
}

export async function ensureProfile(user: AuthUser): Promise<Profile> {
  const client = requireSupabase();
  const now = new Date().toISOString();

  const { data, error } = await client
    .from("profiles")
    .upsert(
      {
        id: user.id,
        nickname: nicknameForUser(user),
        email: user.email ?? null,
        phone: user.phone ?? null,
        updated_at: now,
      },
      { onConflict: "id" },
    )
    .select(profileColumns)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Profile could not be loaded from Supabase.");
  return mapProfile(data);
}

export async function getProfile(user: AuthUser): Promise<Profile> {
  await ensureProfile(user);
  const client = requireSupabase();

  const { data, error } = await client.from("profiles").select(profileColumns).eq("id", user.id).single();
  if (error) throw error;
  if (!data) throw new Error("Profile not found.");
  return mapProfile(data);
}

export async function updateProfile(
  user: AuthUser,
  input: Partial<Pick<Profile, "username" | "nickname" | "bio" | "avatarUrl" | "accountVisibility">>,
): Promise<Profile> {
  const client = requireSupabase();
  await ensureProfile(user);

  const patch: Record<string, unknown> = {
    id: user.id,
    updated_at: new Date().toISOString(),
  };
  if (input.username !== undefined) patch.username = input.username ? normalizeUsername(input.username) : null;
  if (input.nickname !== undefined) patch.nickname = input.nickname.trim();
  if (input.bio !== undefined) patch.bio = input.bio.trim();
  if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl || null;
  if (input.accountVisibility !== undefined) patch.account_visibility = input.accountVisibility;

  const { data, error } = await client.from("profiles").update(patch).eq("id", user.id).select(profileColumns).single();
  if (error) throw error;
  if (!data) throw new Error("Profile update did not return a profile.");
  return mapProfile(data);
}

export async function searchProfileByUsername(user: AuthUser, username: string) {
  const client = requireSupabase();
  await ensureProfile(user);

  const normalized = normalizeUsername(username);
  const { data: profileRow, error } = await client.from("profiles").select(profileColumns).eq("username", normalized).maybeSingle();
  if (error) throw error;
  if (!profileRow || profileRow.id === user.id) return { profile: null, relationship: "none" as const };

  const [{ data: friendRow, error: friendError }, { data: requestRow, error: requestError }] = await Promise.all([
    client.from("friends").select("owner_id, friend_id, favorite, created_at, updated_at").eq("owner_id", user.id).eq("friend_id", profileRow.id).maybeSingle(),
    client
      .from("friend_requests")
      .select("id, requester_id, addressee_id, status, message, created_at, responded_at")
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${profileRow.id}),and(requester_id.eq.${profileRow.id},addressee_id.eq.${user.id})`)
      .in("status", ["pending", "accepted"])
      .maybeSingle(),
  ]);
  if (friendError) throw friendError;
  if (requestError) throw requestError;

  const relationship = friendRow
    ? "friend"
    : requestRow?.status === "pending" && requestRow.requester_id === user.id
      ? "requested"
      : requestRow?.status === "pending"
        ? "pending_response"
        : "none";

  return {
    profile: mapProfile(profileRow),
    relationship,
    favorite: friendRow ? Boolean(friendRow.favorite) : false,
  };
}

export async function listFriends(user: AuthUser): Promise<{ friends: Friend[] }> {
  const client = requireSupabase();
  await ensureProfile(user);

  const { data: friendRows, error } = await client
    .from("friends")
    .select("owner_id, friend_id, favorite, created_at, updated_at")
    .eq("owner_id", user.id)
    .order("favorite", { ascending: false })
    .order("updated_at", { ascending: false });
  if (error) throw error;

  const friendIds = (friendRows ?? []).map((row: any) => row.friend_id);
  if (friendIds.length === 0) return { friends: [] };

  const { data: profileRows, error: profileError } = await client.from("profiles").select(profileColumns).in("id", friendIds);
  if (profileError) throw profileError;

  const profilesById = new Map((profileRows ?? []).map((row: any) => [row.id, mapProfile(row)]));
  return {
    friends: (friendRows ?? []).map((row: any) => mapFriend(row, profilesById.get(row.friend_id))),
  };
}

export async function listFriendRequests(user: AuthUser): Promise<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }> {
  const client = requireSupabase();
  await ensureProfile(user);

  const { data: requestRows, error } = await client
    .from("friend_requests")
    .select("id, requester_id, addressee_id, status, message, created_at, responded_at")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const profileIds = [
    ...new Set((requestRows ?? []).flatMap((row: any) => [row.requester_id, row.addressee_id]).filter((id: string) => id !== user.id)),
  ];
  const { data: profileRows, error: profileError } = profileIds.length
    ? await client.from("profiles").select(profileColumns).in("id", profileIds)
    : { data: [], error: null };
  if (profileError) throw profileError;

  const profilesById = new Map((profileRows ?? []).map((row: any) => [row.id, mapProfile(row)]));
  const incoming: FriendRequest[] = [];
  const outgoing: FriendRequest[] = [];

  for (const row of requestRows ?? []) {
    const request = mapFriendRequest(row, profilesById.get(row.requester_id), profilesById.get(row.addressee_id));
    if (row.addressee_id === user.id) incoming.push(request);
    if (row.requester_id === user.id) outgoing.push(request);
  }

  return { incoming, outgoing };
}

export async function requestFriendByUsername(user: AuthUser, username: string, message?: string) {
  const client = requireSupabase();
  await ensureProfile(user);

  const normalized = normalizeUsername(username);
  const { data: target, error: targetError } = await client.from("profiles").select(profileColumns).eq("username", normalized).maybeSingle();
  if (targetError) throw targetError;
  if (!target) throw new Error("No Coral user was found for that username.");
  if (target.id === user.id) throw new Error("You cannot add yourself as a friend.");

  const now = new Date().toISOString();
  if (target.account_visibility === "public") {
    const { error: friendsError } = await client.from("friends").upsert(
      [
        { owner_id: user.id, friend_id: target.id, favorite: false, updated_at: now },
        { owner_id: target.id, friend_id: user.id, favorite: false, updated_at: now },
      ],
      { onConflict: "owner_id,friend_id" },
    );
    if (friendsError) throw friendsError;

    await client.from("friend_requests").upsert(
      {
        requester_id: user.id,
        addressee_id: target.id,
        status: "accepted",
        message: message ?? null,
        responded_at: now,
      },
      { onConflict: "requester_id,addressee_id" },
    );

    return { status: "accepted" as const, profile: mapProfile(target) };
  }

  const { data, error } = await client
    .from("friend_requests")
    .upsert(
      {
        requester_id: user.id,
        addressee_id: target.id,
        status: "pending",
        message: message ?? null,
      },
      { onConflict: "requester_id,addressee_id" },
    )
    .select("id, requester_id, addressee_id, status, message, created_at, responded_at")
    .single();
  if (error) throw error;

  return { status: "pending" as const, request: mapFriendRequest(data, undefined, mapProfile(target)) };
}

export async function respondToFriendRequest(user: AuthUser, requestId: string, action: "accept" | "decline") {
  const client = requireSupabase();
  await ensureProfile(user);

  const { data: request, error: requestError } = await client
    .from("friend_requests")
    .select("id, requester_id, addressee_id, status")
    .eq("id", requestId)
    .eq("addressee_id", user.id)
    .maybeSingle();
  if (requestError) throw requestError;
  if (!request) throw new Error("Friend request not found.");
  if (request.status !== "pending") throw new Error("Friend request is no longer pending.");

  const now = new Date().toISOString();
  const status = action === "accept" ? "accepted" : "declined";
  const { error: updateError } = await client
    .from("friend_requests")
    .update({ status, responded_at: now })
    .eq("id", request.id);
  if (updateError) throw updateError;

  if (action === "accept") {
    const { error: friendsError } = await client.from("friends").upsert(
      [
        { owner_id: request.requester_id, friend_id: request.addressee_id, favorite: false, updated_at: now },
        { owner_id: request.addressee_id, friend_id: request.requester_id, favorite: false, updated_at: now },
      ],
      { onConflict: "owner_id,friend_id" },
    );
    if (friendsError) throw friendsError;
  }

  return { status };
}

export async function removeFriend(user: AuthUser, friendId: string) {
  const client = requireSupabase();
  if (friendId === user.id) throw new Error("Choose another friend.");

  const { error } = await client
    .from("friends")
    .delete()
    .or(`and(owner_id.eq.${user.id},friend_id.eq.${friendId}),and(owner_id.eq.${friendId},friend_id.eq.${user.id})`);
  if (error) throw error;

  return { removed: true };
}

export async function setFavoriteFriend(user: AuthUser, friendId: string, favorite: boolean) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("friends")
    .update({ favorite, updated_at: new Date().toISOString() })
    .eq("owner_id", user.id)
    .eq("friend_id", friendId)
    .select("owner_id, friend_id, favorite, created_at, updated_at")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Friend not found.");
  return { friend: mapFriend(data) };
}

export async function userCanAccessConversation(userId: string, conversationId: string) {
  const client = requireSupabase();

  const { data, error } = await client
    .from("conversation_participants")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function listConversationParticipantIds(conversationId: string): Promise<string[]> {
  const client = requireSupabase();

  const { data, error } = await client
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId);

  if (error) throw error;
  return (data ?? []).map((row: any) => row.user_id).filter(Boolean);
}

export async function updatePresence(presence: Presence) {
  const client = requireSupabase();
  const now = presence.updatedAt;

  const { error: presenceError } = await client.from("user_presence").upsert(
    {
      user_id: presence.userId,
      conversation_id: presence.conversationId ?? null,
      status: presence.status,
      updated_at: now,
    },
    { onConflict: "user_id" },
  );
  if (presenceError) throw presenceError;

  const { error: profileError } = await client
    .from("profiles")
    .update({
      status: presence.status,
      last_seen: now,
      updated_at: now,
    })
    .eq("id", presence.userId);
  if (profileError) throw profileError;
}

async function usersAreFriends(userId: string, friendId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("friends")
    .select("friend_id")
    .eq("owner_id", userId)
    .eq("friend_id", friendId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function listConversations(user: AuthUser): Promise<{
  conversations: Array<Conversation & { participants: ConversationParticipant[] }>;
}> {
  const client = requireSupabase();
  await ensureProfile(user);

  const { data: participantRows, error: participantError } = await client
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id)
    .eq("archived", false);
  if (participantError) throw participantError;

  const conversationIds = [...new Set((participantRows ?? []).map((row: any) => row.conversation_id))];
  if (conversationIds.length === 0) return { conversations: [] };

  const [{ data: conversationRows, error: conversationError }, { data: allParticipantRows, error: allParticipantError }] =
    await Promise.all([
      client
        .from("conversations")
        .select("id, type, title, created_by, created_at, updated_at, last_message_at")
        .in("id", conversationIds)
        .order("last_message_at", { ascending: false, nullsFirst: false }),
      client
        .from("conversation_participants")
        .select("conversation_id, user_id, role, muted, archived, last_read_message_id, joined_at")
        .in("conversation_id", conversationIds),
    ]);

  if (conversationError) throw conversationError;
  if (allParticipantError) throw allParticipantError;

  const userIds = [...new Set((allParticipantRows ?? []).map((row: any) => row.user_id))];
  const { data: profileRows, error: profileError } = await client.from("profiles").select(profileColumns).in("id", userIds);
  if (profileError) throw profileError;

  const profilesById = new Map((profileRows ?? []).map((row: any) => [row.id, mapProfile(row)]));
  const participantsByConversation = new Map<string, ConversationParticipant[]>();
  for (const row of allParticipantRows ?? []) {
    const participants = participantsByConversation.get(row.conversation_id) ?? [];
    participants.push(mapParticipant(row, profilesById.get(row.user_id)));
    participantsByConversation.set(row.conversation_id, participants);
  }

  return {
    conversations: (conversationRows ?? []).map((row: any) => ({
      ...mapConversation(row),
      participants: participantsByConversation.get(row.id) ?? [],
    })),
  };
}

export async function createDmConversation(user: AuthUser, targetUserId: string) {
  const client = requireSupabase();
  if (targetUserId === user.id) throw new Error("Choose another person to message.");
  await ensureProfile(user);

  if (!(await usersAreFriends(user.id, targetUserId))) {
    throw new Error("You can start a direct message after you are friends.");
  }

  const { data: mine, error: mineError } = await client
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id);
  if (mineError) throw mineError;

  const candidateIds = (mine ?? []).map((row: any) => row.conversation_id);
  if (candidateIds.length > 0) {
    const { data: targetMatches, error: targetMatchesError } = await client
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", targetUserId)
      .in("conversation_id", candidateIds);
    if (targetMatchesError) throw targetMatchesError;

    const matchingIds = (targetMatches ?? []).map((row: any) => row.conversation_id);
    if (matchingIds.length > 0) {
      const { data: existing, error: existingError } = await client
        .from("conversations")
        .select("id, type, title, created_by, created_at, updated_at, last_message_at")
        .eq("type", "dm")
        .in("id", matchingIds)
        .maybeSingle();
      if (existingError) throw existingError;
      if (existing) return mapConversation(existing);
    }
  }

  const { data: conversation, error } = await client
    .from("conversations")
    .insert({ type: "dm", created_by: user.id })
    .select("id, type, title, created_by, created_at, updated_at, last_message_at")
    .single();
  if (error) throw error;

  const { error: participantError } = await client.from("conversation_participants").insert([
    { conversation_id: conversation.id, user_id: user.id, role: "owner" },
    { conversation_id: conversation.id, user_id: targetUserId, role: "member" },
  ]);
  if (participantError) throw participantError;

  return mapConversation(conversation);
}

async function getConversationPeerId(conversationId: string, userId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .neq("user_id", userId)
    .limit(2);

  if (error) throw error;
  if ((data ?? []).length !== 1) return null;
  return data?.[0]?.user_id ?? null;
}

export async function recordCallInvite(input: {
  conversationId: string;
  callerId: string;
  mode: "audio" | "video";
}) {
  const client = requireSupabase();
  const receiverId = await getConversationPeerId(input.conversationId, input.callerId);

  const { error } = await client.from("calls").insert({
    conversation_id: input.conversationId,
    caller_id: input.callerId,
    receiver_id: receiverId,
    type: input.mode,
    status: "started",
  });

  if (error) throw error;
}

export async function recordCallAccepted(input: {
  conversationId: string;
  acceptedByUserId: string;
}) {
  const client = requireSupabase();

  const { data, error } = await client
    .from("calls")
    .select("id")
    .eq("conversation_id", input.conversationId)
    .is("ended_at", null)
    .neq("caller_id", input.acceptedByUserId)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return;

  const { error: updateError } = await client.from("calls").update({ status: "answered" }).eq("id", data.id);
  if (updateError) throw updateError;
}

export async function recordCallEnded(input: {
  conversationId: string;
  endedByUserId: string;
}) {
  const client = requireSupabase();

  const { data, error } = await client
    .from("calls")
    .select("id, caller_id, status, started_at")
    .eq("conversation_id", input.conversationId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return;

  const endedAt = new Date();
  const startedAt = new Date(data.started_at);
  const durationSeconds = Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));
  const status = data.status === "started" && data.caller_id !== input.endedByUserId ? "missed" : "ended";

  const { error: updateError } = await client
    .from("calls")
    .update({
      ended_at: endedAt.toISOString(),
      duration_seconds: durationSeconds,
      status,
    })
    .eq("id", data.id);

  if (updateError) throw updateError;
}

// In-memory message reactions cache for real-time reactivity
const messageReactions = new Map<string, Record<string, string>>();

export async function insertChatMessage(input: {
  conversationId: string;
  senderId: string;
  senderName: string;
  body: string;
  kind: "user" | "system";
  createdAtIso: string;
  mediaUrl?: string;
  mediaType?: "text" | "voice" | "image" | "file";
  audioDuration?: number;
  audioWaveform?: number[];
  reactions?: Record<string, string>;
  replyTo?: { id: string; senderName: string; body: string; mediaType?: "text" | "voice" | "image" | "file" };
}): Promise<ChatMessage> {
  const client = requireSupabase();

  // If rich media or reply exists, encode extra meta into a structured format if needed or insert directly
  let rawBody = input.body;
  if (input.mediaUrl || input.mediaType !== "text" || input.replyTo || input.audioDuration || input.audioWaveform) {
    const metaObj = {
      __ig_meta: true,
      text: input.body,
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType ?? "text",
      audioDuration: input.audioDuration,
      audioWaveform: input.audioWaveform,
      replyTo: input.replyTo,
    };
    rawBody = JSON.stringify(metaObj);
  }

  const { data, error } = await client
    .from("messages")
    .insert({
      conversation_id: input.conversationId,
      sender_id: input.senderId,
      sender_name: input.senderName,
      body: rawBody,
      kind: input.kind,
      created_at: input.createdAtIso,
    })
    .select("id, conversation_id, sender_id, sender_name, body, kind, created_at, edited_at")
    .single();

  if (error) throw error;

  await client
    .from("conversations")
    .update({ last_message_at: input.createdAtIso, updated_at: input.createdAtIso })
    .eq("id", input.conversationId);

  const message = mapChatMessage(data);
  if (input.reactions) {
    messageReactions.set(message.id, input.reactions);
    message.reactions = input.reactions;
  }
  return message;
}

export async function updateMessageReaction(input: {
  messageId: string;
  userId: string;
  emoji: string;
}) {
  const current = messageReactions.get(input.messageId) || {};
  if (current[input.userId] === input.emoji) {
    delete current[input.userId];
  } else {
    current[input.userId] = input.emoji;
  }
  messageReactions.set(input.messageId, { ...current });
  return messageReactions.get(input.messageId);
}

export async function deleteChatMessage(input: {
  messageId: string;
  userId: string;
}) {
  const client = requireSupabase();
  const { error } = await client
    .from("messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", input.messageId)
    .eq("sender_id", input.userId);
  if (error) throw error;
  return true;
}

export async function getChatMessagesByConversationId(input: {
  conversationId: string;
  limit?: number;
}): Promise<ChatMessage[]> {
  const client = requireSupabase();
  const limit = input.limit ?? 100;

  const { data, error } = await client
    .from("messages")
    .select("id, conversation_id, sender_id, sender_name, body, kind, created_at, edited_at")
    .eq("conversation_id", input.conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapChatMessage);
}

function mapChatMessage(row: any): ChatMessage {
  if (!row.sender_id) throw new Error("Message row is missing sender_id.");
  if (!row.conversation_id) throw new Error("Message row is missing conversation_id.");

  let body = row.body ?? "";
  let mediaUrl: string | undefined = undefined;
  let mediaType: "text" | "voice" | "image" | "file" = "text";
  let audioDuration: number | undefined = undefined;
  let audioWaveform: number[] | undefined = undefined;
  let replyTo: { id: string; senderName: string; body: string; mediaType?: "text" | "voice" | "image" | "file" } | undefined = undefined;

  // Check if body is formatted as rich meta JSON
  if (typeof body === "string" && body.startsWith('{"__ig_meta":true')) {
    try {
      const parsed = JSON.parse(body);
      body = parsed.text ?? "";
      mediaUrl = parsed.mediaUrl;
      mediaType = parsed.mediaType ?? "text";
      audioDuration = parsed.audioDuration;
      audioWaveform = parsed.audioWaveform;
      replyTo = parsed.replyTo;
    } catch {
      // Keep as regular string
    }
  }

  const reactions = messageReactions.get(row.id);

  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    body,
    createdAt: new Date(row.created_at).toISOString(),
    deliveryStatus: row.delivery_status ?? "sent",
    kind: row.kind ?? "user",
    mediaUrl,
    mediaType,
    audioDuration,
    audioWaveform,
    reactions,
    replyTo,
  };
}
