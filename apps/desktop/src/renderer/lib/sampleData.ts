import type { ChatMessage, Presence } from "@coral/shared";

export const currentUser = {
  id: "user-you",
  name: "You",
};

export const contacts = [
  {
    id: "arjun",
    name: "Arjun Mehra",
    status: "online",
    preview: "Perfect, thanks. Starting the call now.",
    unread: 3,
  },
  {
    id: "leila",
    name: "Leila Nouri",
    status: "online",
    preview: "Typing...",
    unread: 0,
  },
  {
    id: "tomas",
    name: "Tomas Vela",
    status: "away",
    preview: "Away",
    unread: 0,
  },
  {
    id: "priya",
    name: "Priya Srinivas",
    status: "online",
    preview: "Online",
    unread: 0,
  },
  {
    id: "marco",
    name: "Marco Bellini",
    status: "offline",
    preview: "Offline",
    unread: 0,
  },
] as const;

export const initialMessages: ChatMessage[] = [
  {
    id: "msg-1",
    roomId: "design-review",
    senderId: "arjun",
    senderName: "Arjun Mehra",
    body: "Can you review the design doc before 3pm?",
    createdAt: "2026-05-16T09:11:00.000Z",
    kind: "user",
  },
  {
    id: "msg-2",
    roomId: "design-review",
    senderId: "user-you",
    senderName: "You",
    body: "On it. I am asking Coral AI to summarize the diff first.",
    createdAt: "2026-05-16T09:12:00.000Z",
    kind: "user",
  },
  {
    id: "msg-3",
    roomId: "design-review",
    senderId: "coral-ai",
    senderName: "Coral AI",
    body: "Summary: 4 schema changes, 2 breaking. Auth flow stays the same. The batch endpoint is new.",
    createdAt: "2026-05-16T09:12:20.000Z",
    kind: "ai",
  },
  {
    id: "msg-4",
    roomId: "design-review",
    senderId: "arjun",
    senderName: "Arjun Mehra",
    body: "Perfect, thanks. Starting the call now.",
    createdAt: "2026-05-16T09:13:00.000Z",
    kind: "user",
  },
];

export const presence: Presence[] = contacts.map((contact) => ({
  userId: contact.id,
  roomId: "design-review",
  status: contact.status === "away" ? "away" : contact.status === "offline" ? "offline" : "online",
  updatedAt: new Date().toISOString(),
}));

export const callParticipants = ["Arjun", "Leila", "You", "Tomas"];
