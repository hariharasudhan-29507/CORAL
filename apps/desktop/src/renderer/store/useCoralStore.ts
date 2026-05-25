import { create } from "zustand";
import type { ChatMessage } from "@coral/shared";
import { initialMessages } from "../lib/sampleData";

export type CoralView = "chat" | "call" | "settings";

type CoralState = {
  view: CoralView;
  aiPanelOpen: boolean;
  aiStreaming: boolean;
  activeAiReplyId: string | null;
  messages: ChatMessage[];
  setView: (view: CoralView) => void;
  toggleAiPanel: () => void;
  addMessage: (message: ChatMessage) => void;
  appendAiToken: (replyId: string, roomId: string, token: string) => void;
  finishAiReply: (replyId: string) => void;
  setAiStreaming: (value: boolean) => void;
};

export const useCoralStore = create<CoralState>((set) => ({
  view: "chat",
  aiPanelOpen: true,
  aiStreaming: false,
  activeAiReplyId: null,
  messages: initialMessages,
  setView: (view) => set({ view }),
  toggleAiPanel: () => set((state) => ({ aiPanelOpen: !state.aiPanelOpen })),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  appendAiToken: (replyId, roomId, token) =>
    set((state) => {
      const existingIndex = state.messages.findIndex((message) => message.id === replyId);

      if (existingIndex >= 0) {
        const messages = [...state.messages];
        const existingMessage = messages[existingIndex];
        if (!existingMessage) {
          return {
            aiStreaming: true,
            activeAiReplyId: replyId,
          };
        }

        messages[existingIndex] = {
          ...existingMessage,
          body: `${existingMessage.body}${token}`,
        };

        return {
          messages,
          aiStreaming: true,
          activeAiReplyId: replyId,
        };
      }

      return {
        messages: [
          ...state.messages,
          {
            id: replyId,
            roomId,
            senderId: "coral-ai",
            senderName: "Coral AI",
            body: token,
            createdAt: new Date().toISOString(),
            kind: "ai",
          },
        ],
        aiStreaming: true,
        activeAiReplyId: replyId,
      };
    }),
  finishAiReply: (replyId) =>
    set((state) => ({
      aiStreaming: state.activeAiReplyId === replyId ? false : state.aiStreaming,
      activeAiReplyId: state.activeAiReplyId === replyId ? null : state.activeAiReplyId,
    })),
  setAiStreaming: (value) => set({ aiStreaming: value, activeAiReplyId: value ? null : null }),
}));
