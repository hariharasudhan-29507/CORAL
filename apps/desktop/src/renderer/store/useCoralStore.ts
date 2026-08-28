import { create } from "zustand";
import type { ChatMessage, DeleteMessagePayload, Presence, ReactionPayload, TypingUpdate } from "@coral/shared";

export type CoralView = "chat" | "call" | "profile" | "settings";
export type CallMode = "audio" | "video";
export type CallStatus = "idle" | "calling" | "ringing" | "connecting" | "active" | "error";
export type SettingsSection =
  | "Profile"
  | "Audio & video"
  | "Appearance"
  | "Notifications"
  | "Privacy"
  | "About";

type CoralState = {
  view: CoralView;
  activeConversationId: string | null;
  activeCallMode: CallMode | null;
  callInitiator: boolean;
  callStatus: CallStatus;
  callError: string | null;
  selectedSettingsSection: SettingsSection;
  contactSearch: string;
  actionFeedback: string | null;
  messages: ChatMessage[];
  replyTarget: ChatMessage | null;
  isSearchModalOpen: boolean;
  isEditProfileModalOpen: boolean;
  activeLightboxMedia: string | null;
  isVoiceRecording: boolean;
  voiceRecordingDuration: number;
  voiceRecordingLevel: number;
  setMessages: (messages: ChatMessage[]) => void;
  setView: (view: CoralView) => void;
  setActiveConversationId: (conversationId: string | null) => void;
  startCall: (mode: CallMode, initiator?: boolean) => void;
  setCallStatus: (status: CallStatus) => void;
  setCallError: (error: string | null) => void;
  endCall: () => void;
  setSelectedSettingsSection: (section: SettingsSection) => void;
  setContactSearch: (query: string) => void;
  setActionFeedback: (message: string | null) => void;
  addMessage: (message: ChatMessage) => void;
  removeMessage: (messageId: string) => void;
  updateReaction: (payload: ReactionPayload) => void;
  setReplyTarget: (message: ChatMessage | null) => void;
  setIsSearchModalOpen: (open: boolean) => void;
  setIsEditProfileModalOpen: (open: boolean) => void;
  setActiveLightboxMedia: (url: string | null) => void;
  setIsVoiceRecording: (recording: boolean) => void;
  setVoiceRecordingDuration: (duration: number) => void;
  setVoiceRecordingLevel: (level: number) => void;
  presenceByUserId: Record<string, Presence["status"]>;
  typingByUserId: Record<string, boolean>;
  upsertPresence: (presence: Presence) => void;
  upsertTyping: (payload: TypingUpdate) => void;
  clearPresence: () => void;
  clearTyping: () => void;
};

export const useCoralStore = create<CoralState>((set) => ({
  view: "chat",
  activeConversationId: null,
  activeCallMode: null,
  callInitiator: true,
  callStatus: "idle",
  callError: null,
  selectedSettingsSection: "Audio & video",
  contactSearch: "",
  actionFeedback: null,
  messages: [],
  replyTarget: null,
  isSearchModalOpen: false,
  isEditProfileModalOpen: false,
  activeLightboxMedia: null,
  isVoiceRecording: false,
  voiceRecordingDuration: 0,
  voiceRecordingLevel: 0.15,

  setMessages: (messages) => set({ messages }),
  setView: (view) => set({ view }),
  setActiveConversationId: (conversationId) => set({ activeConversationId: conversationId, replyTarget: null }),
  startCall: (mode, initiator = true) =>
    set({
      view: "call",
      activeCallMode: mode,
      callInitiator: initiator,
      callStatus: initiator ? "calling" : "connecting",
      callError: null,
    }),
  setCallStatus: (status) => set({ callStatus: status }),
  setCallError: (error) =>
    set((state) => ({
      callError: error,
      callStatus: error ? "error" : state.callStatus === "error" ? "idle" : state.callStatus,
    })),
  endCall: () =>
    set({
      view: "chat",
      activeCallMode: null,
      callInitiator: true,
      callStatus: "idle",
      callError: null,
    }),
  setSelectedSettingsSection: (section) => set({ selectedSettingsSection: section }),
  setContactSearch: (query) => set({ contactSearch: query }),
  setActionFeedback: (message) => set({ actionFeedback: message }),
  addMessage: (message) =>
    set((state) => {
      // Avoid duplicate messages if already present
      if (state.messages.some((m) => m.id === message.id)) {
        return {
          messages: state.messages.map((m) => (m.id === message.id ? message : m)),
        };
      }
      return { messages: [...state.messages, message] };
    }),
  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    })),
  updateReaction: ({ messageId, userId, emoji }) =>
    set((state) => ({
      messages: state.messages.map((m) => {
        if (m.id !== messageId) return m;
        const currentReactions = { ...(m.reactions || {}) };
        if (currentReactions[userId] === emoji) {
          delete currentReactions[userId];
        } else {
          currentReactions[userId] = emoji;
        }
        return { ...m, reactions: currentReactions };
      }),
    })),
  setReplyTarget: (message) => set({ replyTarget: message }),
  setIsSearchModalOpen: (open) => set({ isSearchModalOpen: open }),
  setIsEditProfileModalOpen: (open) => set({ isEditProfileModalOpen: open }),
  setActiveLightboxMedia: (url) => set({ activeLightboxMedia: url }),
  setIsVoiceRecording: (recording) => set({ isVoiceRecording: recording }),
  setVoiceRecordingDuration: (duration) => set({ voiceRecordingDuration: duration }),
  setVoiceRecordingLevel: (level) => set({ voiceRecordingLevel: level }),
  presenceByUserId: {},
  typingByUserId: {},
  upsertPresence: (presence) =>
    set((state) => ({
      presenceByUserId: { ...state.presenceByUserId, [presence.userId]: presence.status },
    })),
  upsertTyping: (payload) =>
    set((state) => ({
      typingByUserId: { ...state.typingByUserId, [payload.userId]: payload.isTyping },
    })),
  clearPresence: () => set({ presenceByUserId: {} }),
  clearTyping: () => set({ typingByUserId: {} }),
}));
