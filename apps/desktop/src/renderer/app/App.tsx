import {
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Camera,
  Check,
  Circle,
  Compass,
  Heart,
  Image as ImageIcon,
  Info,
  LogOut,
  Loader2,
  Lock,
  Mail,
  Mic,
  MonitorUp,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  RefreshCw,
  Reply,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Smile,
  SquarePen,
  Trash2,
  User,
  UserCheck,
  UserMinus,
  UserPlus,
  Video,
  Volume2,
  VolumeX,
  X,
  Play,
  Pause,
} from "lucide-react";
import {
  type CallInvite,
  type ChatMessage,
  type Friend,
  type FriendRequest,
  type Presence,
  type Profile,
  type ReactionPayload,
  type TypingUpdate,
} from "@coral/shared";
import { authService, type SessionUser } from "../services/AuthService";
import { CallConfigService } from "../services/CallConfigService";
import { ChatService } from "../services/ChatService";
import { CallService } from "../services/CallService";
import { ConversationService, type ConversationWithParticipants } from "../services/ConversationService";
import { FriendService } from "../services/FriendService";
import { ProfileService } from "../services/ProfileService";
import { createSocket } from "../services/SocketService";
import { soundService } from "../services/SoundService";
import { voiceRecorder } from "../services/VoiceRecorder";
import {
  useCoralStore,
  type CallMode,
  type CoralView,
  type SettingsSection,
} from "../store/useCoralStore";

// Emojis for quick reactions
const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "🔥", "👏"];

function formatTime(isoString: string) {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (Math.floor(seconds) % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export function App() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(() => authService.getCurrentUser());

  useEffect(() => {
    let active = true;
    authService.restoreSession().then((user) => {
      if (!active) return;
      setSessionUser(user ?? authService.getCurrentUser());
      setCheckingSession(false);
    });
    return () => {
      active = false;
    };
  }, []);

  if (checkingSession) {
    return (
      <main className="login-screen" aria-busy="true">
        <section className="login-brand">
          <InstagramGlyph size={48} />
        </section>
        <div className="login-panel login-panel-compact">
          <Loader2 className="spin" size={20} color="#0095f6" />
          <p>Connecting to Instagram Direct...</p>
        </div>
      </main>
    );
  }

  if (!sessionUser) {
    return (
      <LoginScreen
        onAuthenticated={(user) => {
          setSessionUser(user);
        }}
      />
    );
  }

  return (
    <InstagramDirectShell
      sessionUser={sessionUser}
      onSignOut={async () => {
        await authService.signOut();
        useCoralStore.getState().endCall();
        useCoralStore.getState().setMessages([]);
        useCoralStore.getState().clearPresence();
        useCoralStore.getState().clearTyping();
        setSessionUser(null);
      }}
    />
  );
}

/* ==========================================================================
   Login / Auth Screen
   ========================================================================== */
type AuthStep = "email" | "methods" | "password" | "code" | "register" | "registerSent" | "phone" | "phoneCode" | "reset";

function LoginScreen({ onAuthenticated }: { onAuthenticated: (user: SessionUser) => void }) {
  const [step, setStep] = useState<AuthStep>("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();

  useEffect(() => {
    return authService.onSessionChange((user) => {
      if (user) onAuthenticated(user);
    });
  }, [onAuthenticated]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");

    try {
      setPending(true);
      if (step === "email") {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
          setError("Enter a valid email address.");
          return;
        }
        setStep("password");
        return;
      }

      if (step === "password") {
        const user = await authService.signIn({ credential: normalizedEmail, password });
        onAuthenticated(user);
        return;
      }

      if (step === "register") {
        if (!name.trim()) {
          setError("Please enter your full name.");
          return;
        }
        const result = await authService.register({
          credential: normalizedEmail,
          password,
          name: name.trim(),
        });
        if (result.status === "signed_in") {
          onAuthenticated(result.user);
          return;
        }
        setNotice("Check your email for confirmation code/link.");
        setStep("registerSent");
        return;
      }

      if (step === "registerSent" || step === "code") {
        const user = await authService.verifySignupOtp({
          email: normalizedEmail,
          token: otpCode.trim(),
        });
        onAuthenticated(user);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="login-screen">
      <div className="login-panel" style={{ width: "350px", textAlign: "center", background: "#000000" }}>
        <div style={{ margin: "16px 0 24px" }}>
          <InstagramWordmark />
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {step === "register" && (
            <div className="ig-field">
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="ig-field">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={step === "password" || step === "registerSent"}
            />
          </div>

          {(step === "password" || step === "register") && (
            <div className="ig-field">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          {(step === "code" || step === "registerSent") && (
            <div className="ig-field">
              <input
                type="text"
                placeholder="6-digit verification code"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
              />
            </div>
          )}

          {error && <p style={{ color: "var(--ig-danger)", fontSize: "13px" }}>{error}</p>}
          {notice && <p style={{ color: "var(--ig-online)", fontSize: "13px" }}>{notice}</p>}

          <button
            className="ig-button-primary"
            type="submit"
            disabled={pending}
            style={{ width: "100%", marginTop: "8px", height: "38px" }}
          >
            {pending ? (
              <Loader2 className="spin" size={16} style={{ margin: "auto" }} />
            ) : step === "email" ? (
              "Next"
            ) : step === "register" ? (
              "Sign Up"
            ) : (
              "Log In"
            )}
          </button>
        </form>

        <div style={{ margin: "20px 0 10px", fontSize: "13px", color: "var(--ig-text-secondary)" }}>
          {step === "register" ? (
            <span>
              Have an account?{" "}
              <button
                type="button"
                onClick={() => setStep("email")}
                style={{ color: "var(--ig-primary)", fontWeight: 600 }}
              >
                Log In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => setStep("register")}
                style={{ color: "var(--ig-primary)", fontWeight: 600 }}
              >
                Sign up
              </button>
            </span>
          )}
        </div>
      </div>
    </main>
  );
}

/* ==========================================================================
   Instagram Direct Main Shell
   ========================================================================== */
function InstagramDirectShell({
  sessionUser,
  onSignOut,
}: {
  sessionUser: SessionUser;
  onSignOut: () => Promise<void>;
}) {
  const view = useCoralStore((state) => state.view);
  const activeConversationId = useCoralStore((state) => state.activeConversationId);
  const activeCallMode = useCoralStore((state) => state.activeCallMode);
  const callInitiator = useCoralStore((state) => state.callInitiator);
  const setView = useCoralStore((state) => state.setView);
  const setActiveConversationId = useCoralStore((state) => state.setActiveConversationId);
  const startCall = useCoralStore((state) => state.startCall);
  const endCall = useCoralStore((state) => state.endCall);
  const actionFeedback = useCoralStore((state) => state.actionFeedback);
  const setActionFeedback = useCoralStore((state) => state.setActionFeedback);
  const setIsSearchModalOpen = useCoralStore((state) => state.setIsSearchModalOpen);
  const isSearchModalOpen = useCoralStore((state) => state.isSearchModalOpen);
  const isEditProfileModalOpen = useCoralStore((state) => state.isEditProfileModalOpen);
  const setIsEditProfileModalOpen = useCoralStore((state) => state.setIsEditProfileModalOpen);
  const activeLightboxMedia = useCoralStore((state) => state.activeLightboxMedia);
  const setActiveLightboxMedia = useCoralStore((state) => state.setActiveLightboxMedia);

  const servicesRef = useRef<{
    chat: ChatService;
    conversations: ConversationService;
    friends: FriendService;
    profile: ProfileService;
    callConfig: CallConfigService;
    socket: ReturnType<typeof createSocket>;
  } | null>(null);

  const [conversations, setConversations] = useState<ConversationWithParticipants[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }>({
    incoming: [],
    outgoing: [],
  });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallInvite | null>(null);

  if (!servicesRef.current) {
    const activeUser = authService.getCurrentUser() ?? sessionUser;
    const token = authService.getSessionToken();
    const socket = createSocket(activeUser, authService.getSessionToken());
    servicesRef.current = {
      socket,
      chat: new ChatService(socket, token),
      conversations: new ConversationService(token),
      friends: new FriendService(token),
      profile: new ProfileService(token),
      callConfig: new CallConfigService(token),
    };
  }

  function reloadSocialData() {
    const services = servicesRef.current;
    if (!services) return;

    void Promise.all([
      services.profile.getMe(),
      services.friends.list(),
      services.friends.requests(),
      services.conversations.list(),
    ])
      .then(([nextProfile, nextFriends, nextRequests, nextConversations]) => {
        setProfile(nextProfile);
        setFriends(nextFriends);
        setFriendRequests(nextRequests);
        setConversations(nextConversations);
        const currentConversationId = useCoralStore.getState().activeConversationId;
        const firstConversation = nextConversations[0];
        if (firstConversation && !nextConversations.some((item) => item.id === currentConversationId)) {
          setActiveConversationId(firstConversation.id);
        }
      })
      .catch((caught) => {
        setActionFeedback(caught instanceof Error ? caught.message : "Data error.");
      });
  }

  useEffect(() => {
    reloadSocialData();
  }, []);

  // Realtime Socket listeners (Chat, Reactions, Deletions, Presence, Calls)
  useEffect(() => {
    const services = servicesRef.current;
    if (!services) return;

    const { socket, chat } = services;
    const addMessage = useCoralStore.getState().addMessage;
    const removeMessage = useCoralStore.getState().removeMessage;
    const updateReaction = useCoralStore.getState().updateReaction;
    const upsertPresence = useCoralStore.getState().upsertPresence;
    const upsertTyping = useCoralStore.getState().upsertTyping;

    const offMessage = chat.onMessage((message) => {
      addMessage(message);
      if (message.senderId !== sessionUser.id) {
        soundService.playMessageChime();
      }
    });

    const offReaction = chat.onReaction((payload) => {
      updateReaction(payload);
      if (payload.userId !== sessionUser.id) {
        soundService.playHeartPop();
      }
    });

    const offDelete = chat.onDelete((payload) => {
      removeMessage(payload.messageId);
    });

    const onPresenceUpdate = (presence: Presence) => {
      upsertPresence(presence);
    };

    const onTypingUpdate = (payload: TypingUpdate) => {
      upsertTyping(payload);
    };

    const onIncomingCall = (payload: CallInvite) => {
      if (payload.fromUserId === sessionUser.id) return;
      setIncomingCall(payload);
      soundService.startRingtone();
    };

    const onCallEnded = (payload: CallInvite) => {
      setIncomingCall((current) => (current?.conversationId === payload.conversationId ? null : current));
      soundService.stopAll();
      soundService.playCallEnded();
      if (useCoralStore.getState().activeCallMode) {
        useCoralStore.getState().endCall();
      }
    };

    const onSystemError = (payload: { code: string; message: string }) => {
      setActionFeedback(payload.message);
    };

    socket.on("presence:update", onPresenceUpdate);
    socket.on("typing:update", onTypingUpdate);
    socket.on("call:invite", onIncomingCall);
    socket.on("call:end", onCallEnded);
    socket.on("system:error", onSystemError);

    socket.connect();

    return () => {
      offMessage();
      offReaction();
      offDelete();
      socket.off("presence:update", onPresenceUpdate);
      socket.off("typing:update", onTypingUpdate);
      socket.off("call:invite", onIncomingCall);
      socket.off("call:end", onCallEnded);
      socket.off("system:error", onSystemError);
      socket.disconnect();
      soundService.stopAll();
    };
  }, [sessionUser.id, setActionFeedback]);

  // Load chat history when active conversation changes
  useEffect(() => {
    const services = servicesRef.current;
    if (!services) return;
    if (!activeConversationId) {
      useCoralStore.getState().setMessages([]);
      return;
    }

    services.chat.join(activeConversationId);
    void services.chat
      .fetchHistory(activeConversationId)
      .then((messages) => useCoralStore.getState().setMessages(messages))
      .catch((err) => {
        setActionFeedback(err instanceof Error ? err.message : "Could not load messages.");
      });

    return () => {
      services.chat.leave(activeConversationId);
    };
  }, [activeConversationId, setActionFeedback]);

  // Clear feedback after 3.5s
  useEffect(() => {
    if (!actionFeedback) return;
    const t = window.setTimeout(() => setActionFeedback(null), 3500);
    return () => window.clearTimeout(t);
  }, [actionFeedback, setActionFeedback]);

  return (
    <main className={view === "call" ? "app-shell call-mode" : "app-shell"}>
      {/* 1. Left Icon Navigation Rail */}
      {view !== "call" && (
        <aside className="nav-rail">
          <div className="nav-rail-top">
            <button
              className="ig-brand-icon"
              type="button"
              title="Instagram Direct"
              onClick={() => setView("chat")}
            >
              <InstagramGlyph size={32} />
            </button>

            <nav className="nav-links">
              <button
                className={view === "chat" ? "rail-button active" : "rail-button"}
                type="button"
                title="Direct Messages"
                onClick={() => setView("chat")}
              >
                <MessageCircle size={24} />
              </button>

              <button
                className="rail-button"
                type="button"
                title="Search / New Chat"
                onClick={() => setIsSearchModalOpen(true)}
              >
                <Search size={24} />
              </button>

              <button
                className={view === "settings" ? "rail-button active" : "rail-button"}
                type="button"
                title="Settings"
                onClick={() => setView("settings")}
              >
                <Settings size={24} />
              </button>
            </nav>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
            <button
              className={view === "profile" ? "nav-avatar-btn active" : "nav-avatar-btn"}
              type="button"
              title="Your Profile"
              onClick={() => setView("profile")}
            >
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" />
              ) : (
                <div className="avatar-placeholder">{profile?.nickname?.[0]?.toUpperCase() ?? "U"}</div>
              )}
            </button>
          </div>
        </aside>
      )}

      {/* 2. Direct Inbox Threads Column */}
      {view !== "call" && (
        <DirectInbox
          conversations={conversations}
          friends={friends}
          friendRequests={friendRequests}
          sessionUser={sessionUser}
          profile={profile}
          services={servicesRef.current}
          onReload={reloadSocialData}
          onOpenNewChat={() => setIsSearchModalOpen(true)}
        />
      )}

      {/* 3. Main Center Content Pane (Chat or Profile or Settings) */}
      {view === "chat" && (
        <InstagramChatView
          sessionUser={sessionUser}
          conversations={conversations}
          services={servicesRef.current}
          onStartCall={(mode) => startCall(mode)}
        />
      )}

      {view === "profile" && (
        <InstagramProfileView
          profile={profile}
          sessionUser={sessionUser}
          conversations={conversations}
          friends={friends}
          onEditProfile={() => setIsEditProfileModalOpen(true)}
          onSignOut={onSignOut}
        />
      )}

      {view === "settings" && (
        <InstagramSettingsView
          profile={profile}
          services={servicesRef.current}
          sessionUser={sessionUser}
          onProfileSaved={(p) => setProfile(p)}
          onSignOut={onSignOut}
        />
      )}

      {/* 4. Fullscreen Video / Voice Call View */}
      {view === "call" && (
        <InstagramCallView
          mode={activeCallMode ?? "video"}
          initiator={callInitiator}
          services={servicesRef.current}
          sessionUser={sessionUser}
          conversations={conversations}
          onEnd={endCall}
        />
      )}

      {/* 5. Incoming Call Modal Overlay */}
      {incomingCall && view !== "call" && (
        <div className="incoming-call-modal" role="dialog">
          <div className="incoming-caller-info">
            <div className="incoming-avatar-ring">
              <div className="avatar-init">
                {incomingCall.mode === "video" ? <Video size={36} /> : <Phone size={36} />}
              </div>
            </div>
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: 700 }}>Incoming {incomingCall.mode} call</h2>
              <p style={{ color: "var(--ig-text-secondary)", marginTop: "4px" }}>
                {incomingCall.fromUserId} is calling you
              </p>
            </div>
          </div>

          <div className="incoming-call-actions">
            <div className="call-action-btn-wrap">
              <button
                className="decline-call-btn"
                type="button"
                onClick={() => {
                  soundService.stopAll();
                  servicesRef.current?.socket.emit("call:end", incomingCall);
                  setIncomingCall(null);
                }}
              >
                <X size={28} />
              </button>
              <span>Decline</span>
            </div>

            <div className="call-action-btn-wrap">
              <button
                className="accept-call-btn"
                type="button"
                onClick={() => {
                  soundService.stopAll();
                  soundService.playCallConnected();
                  setActiveConversationId(incomingCall.conversationId);
                  startCall(incomingCall.mode, false);
                  setIncomingCall(null);
                }}
              >
                {incomingCall.mode === "video" ? <Video size={28} /> : <Phone size={28} />}
              </button>
              <span>Accept</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. User Search & New Message Modal */}
      {isSearchModalOpen && (
        <UserSearchModal
          sessionUser={sessionUser}
          services={servicesRef.current}
          onClose={() => setIsSearchModalOpen(false)}
          onStartDm={async (targetUserId) => {
            if (!servicesRef.current) return;
            try {
              const convo = await servicesRef.current.conversations.createDm(targetUserId);
              setActiveConversationId(convo.id);
              setView("chat");
              setIsSearchModalOpen(false);
              reloadSocialData();
            } catch (err) {
              setActionFeedback(err instanceof Error ? err.message : "Could not start chat.");
            }
          }}
        />
      )}

      {/* 7. Edit Profile Modal */}
      {isEditProfileModalOpen && (
        <EditProfileModal
          profile={profile}
          services={servicesRef.current}
          onClose={() => setIsEditProfileModalOpen(false)}
          onSaved={(updated) => {
            setProfile(updated);
            setIsEditProfileModalOpen(false);
          }}
        />
      )}

      {/* 8. Lightbox Image Viewer */}
      {activeLightboxMedia && (
        <div className="lightbox-overlay" onClick={() => setActiveLightboxMedia(null)}>
          <img className="lightbox-img" src={activeLightboxMedia} alt="Full View" />
        </div>
      )}

      {/* Toast Feedback */}
      {actionFeedback && (
        <div className="action-feedback" role="status">
          {actionFeedback}
        </div>
      )}
    </main>
  );
}

/* ==========================================================================
   Direct Inbox Component
   ========================================================================== */
function DirectInbox({
  conversations,
  friends,
  friendRequests,
  sessionUser,
  profile,
  services,
  onReload,
  onOpenNewChat,
}: {
  conversations: ConversationWithParticipants[];
  friends: Friend[];
  friendRequests: { incoming: FriendRequest[]; outgoing: FriendRequest[] };
  sessionUser: SessionUser;
  profile: Profile | null;
  services: any;
  onReload: () => void;
  onOpenNewChat: () => void;
}) {
  const activeConversationId = useCoralStore((state) => state.activeConversationId);
  const setActiveConversationId = useCoralStore((state) => state.setActiveConversationId);
  const presenceByUserId = useCoralStore((state) => state.presenceByUserId);
  const [filterQuery, setFilterQuery] = useState("");

  const filteredConversations = conversations.filter((convo) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    const other = convo.participants.find((p) => p.userId !== sessionUser.id);
    return (
      other?.profile?.nickname?.toLowerCase().includes(q) ||
      other?.profile?.username?.toLowerCase().includes(q) ||
      convo.title?.toLowerCase().includes(q)
    );
  });

  return (
    <aside className="direct-inbox">
      <header className="inbox-header">
        <div className="inbox-header-title">
          <span>{profile?.username ? `@${profile.username}` : profile?.nickname ?? "Direct"}</span>
        </div>
        <button
          className="inbox-compose-btn"
          type="button"
          title="New Message"
          onClick={onOpenNewChat}
        >
          <SquarePen size={20} />
        </button>
      </header>

      {/* Notes & Active Tray */}
      <div className="notes-tray">
        <div className="note-item" onClick={onOpenNewChat}>
          <div className="note-bubble-wrap">
            <div className="note-thought-pill">Your note</div>
            <div className="note-avatar">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" />
              ) : (
                <div className="avatar-init">{profile?.nickname?.[0]?.toUpperCase() ?? "+"}</div>
              )}
            </div>
          </div>
          <span className="note-name">Your note</span>
        </div>

        {friends.map((friend) => {
          const isOnline = presenceByUserId[friend.friendId] === "online";
          const p = friend.profile;
          return (
            <div
              key={friend.friendId}
              className="note-item"
              onClick={async () => {
                try {
                  const convo = await services?.conversations.createDm(friend.friendId);
                  if (convo) {
                    setActiveConversationId(convo.id);
                    onReload();
                  }
                } catch {
                  // Ignore
                }
              }}
            >
              <div className="note-bubble-wrap">
                {isOnline && <div className="note-thought-pill">Active</div>}
                <div className={isOnline ? "note-avatar active-ring" : "note-avatar"}>
                  {p?.avatarUrl ? (
                    <img src={p.avatarUrl} alt="" />
                  ) : (
                    <div className="avatar-init">{p?.nickname?.[0]?.toUpperCase() ?? "U"}</div>
                  )}
                </div>
              </div>
              <span className="note-name">{p?.nickname ?? "Friend"}</span>
            </div>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="inbox-search-box">
        <div className="inbox-search-input-wrap">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search messages..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Pending Requests Banner */}
      {friendRequests.incoming.length > 0 && (
        <div style={{ padding: "8px 16px", background: "var(--ig-surface-2)", margin: "0 16px 10px", borderRadius: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: 600 }}>
              {friendRequests.incoming.length} Message {friendRequests.incoming.length === 1 ? "Request" : "Requests"}
            </span>
          </div>
          {friendRequests.incoming.map((req) => (
            <div key={req.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
              <span style={{ fontSize: "13px" }}>{req.requesterProfile?.nickname ?? req.requesterId}</span>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  className="ig-button-primary"
                  style={{ padding: "4px 10px", fontSize: "12px" }}
                  onClick={async () => {
                    await services?.friends.respond(req.id, "accept");
                    onReload();
                  }}
                >
                  Accept
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Direct Thread List */}
      <div className="thread-list">
        {filteredConversations.length === 0 ? (
          <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--ig-text-tertiary)", fontSize: "13.5px" }}>
            <p>No messages found.</p>
            <button
              type="button"
              onClick={onOpenNewChat}
              style={{ color: "var(--ig-primary)", marginTop: "8px", fontWeight: 600, fontSize: "13px" }}
            >
              Send a message
            </button>
          </div>
        ) : (
          filteredConversations.map((convo) => {
            const isSelected = convo.id === activeConversationId;
            const other = convo.participants.find((p) => p.userId !== sessionUser.id);
            const otherProfile = other?.profile;
            const isOnline = other ? presenceByUserId[other.userId] === "online" : false;
            const displayName = otherProfile?.nickname ?? convo.title ?? "Direct message";

            return (
              <div
                key={convo.id}
                className={isSelected ? "thread-row active" : "thread-row"}
                onClick={() => setActiveConversationId(convo.id)}
              >
                <div className="thread-avatar-wrap">
                  {otherProfile?.avatarUrl ? (
                    <img className="thread-avatar" src={otherProfile.avatarUrl} alt="" />
                  ) : (
                    <div className="thread-avatar">{displayName[0]?.toUpperCase()}</div>
                  )}
                  {isOnline && <div className="online-badge" />}
                </div>

                <div className="thread-info">
                  <div className="thread-top">
                    <span className="thread-name">{displayName}</span>
                    <span className="thread-time">{convo.lastMessageAt ? formatTime(convo.lastMessageAt) : ""}</span>
                  </div>
                  <div className="thread-snippet">
                    <span>{isOnline ? "Active now" : otherProfile?.username ? `@${otherProfile.username}` : "Tap to chat"}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

/* ==========================================================================
   Instagram Chat View (DM Thread)
   ========================================================================== */
function InstagramChatView({
  sessionUser,
  conversations,
  services,
  onStartCall,
}: {
  sessionUser: SessionUser;
  conversations: ConversationWithParticipants[];
  services: {
    chat: ChatService;
    socket: ReturnType<typeof createSocket>;
  } | null;
  onStartCall: (mode: CallMode) => void;
}) {
  const activeConversationId = useCoralStore((state) => state.activeConversationId);
  const messages = useCoralStore((state) => state.messages);
  const presenceByUserId = useCoralStore((state) => state.presenceByUserId);
  const typingByUserId = useCoralStore((state) => state.typingByUserId);
  const replyTarget = useCoralStore((state) => state.replyTarget);
  const setReplyTarget = useCoralStore((state) => state.setReplyTarget);
  const isVoiceRecording = useCoralStore((state) => state.isVoiceRecording);
  const setIsVoiceRecording = useCoralStore((state) => state.setIsVoiceRecording);
  const voiceRecordingDuration = useCoralStore((state) => state.voiceRecordingDuration);
  const setVoiceRecordingDuration = useCoralStore((state) => state.setVoiceRecordingDuration);
  const voiceRecordingLevel = useCoralStore((state) => state.voiceRecordingLevel);
  const setVoiceRecordingLevel = useCoralStore((state) => state.setVoiceRecordingLevel);
  const setActiveLightboxMedia = useCoralStore((state) => state.setActiveLightboxMedia);
  const setActionFeedback = useCoralStore((state) => state.setActionFeedback);

  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const otherParticipant = activeConversation?.participants.find((p) => p.userId !== sessionUser.id);
  const isOtherOnline = otherParticipant ? presenceByUserId[otherParticipant.userId] === "online" : false;
  const isOtherTyping = otherParticipant ? Boolean(typingByUserId[otherParticipant.userId]) : false;
  const displayName = otherParticipant?.profile?.nickname ?? activeConversation?.title ?? "Direct message";

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleDraftChange(text: string) {
    setDraft(text);
    if (!services?.socket.connected || !activeConversationId) return;

    services.socket.emit("typing:start", { conversationId: activeConversationId });
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      services.socket.emit("typing:stop", { conversationId: activeConversationId });
    }, 1500);
  }

  function sendTextMessage(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!activeConversationId) return;

    const body = draft.trim();
    if (!body) return;

    services?.chat.send({
      conversationId: activeConversationId,
      senderId: sessionUser.id,
      senderName: sessionUser.name,
      body,
      kind: "user",
      mediaType: "text",
      replyTo: replyTarget
        ? {
            id: replyTarget.id,
            senderName: replyTarget.senderName,
            body: replyTarget.body || (replyTarget.mediaType === "voice" ? "Voice message" : "Photo"),
            mediaType: replyTarget.mediaType,
          }
        : undefined,
    });

    setDraft("");
    setReplyTarget(null);
  }

  function sendQuickHeart() {
    if (!activeConversationId) return;
    soundService.playHeartPop();
    services?.chat.send({
      conversationId: activeConversationId,
      senderId: sessionUser.id,
      senderName: sessionUser.name,
      body: "❤️",
      kind: "user",
      mediaType: "text",
    });
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !activeConversationId) return;

    const reader = new FileReader();
    reader.onload = () => {
      const mediaUrl = reader.result as string;
      services?.chat.send({
        conversationId: activeConversationId,
        senderId: sessionUser.id,
        senderName: sessionUser.name,
        body: "",
        kind: "user",
        mediaUrl,
        mediaType: "image",
      });
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function startVoiceRecording() {
    try {
      setIsVoiceRecording(true);
      setVoiceRecordingDuration(0);
      await voiceRecorder.start({
        onLevel: (level) => setVoiceRecordingLevel(level),
        onTick: (secs) => setVoiceRecordingDuration(secs),
      });
    } catch (err) {
      setIsVoiceRecording(false);
      setActionFeedback(err instanceof Error ? err.message : "Microphone permission denied.");
    }
  }

  async function finishVoiceRecording() {
    setIsVoiceRecording(false);
    const result = await voiceRecorder.stop();
    if (!result || !activeConversationId) return;

    services?.chat.send({
      conversationId: activeConversationId,
      senderId: sessionUser.id,
      senderName: sessionUser.name,
      body: "Voice message",
      kind: "user",
      mediaUrl: result.audioUrl,
      mediaType: "voice",
      audioDuration: result.duration,
      audioWaveform: result.waveform,
    });
  }

  function cancelVoiceRecording() {
    voiceRecorder.cancel();
    setIsVoiceRecording(false);
  }

  if (!activeConversationId) {
    return (
      <section className="chat-pane" style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", maxWidth: "340px" }}>
          <div
            style={{
              width: "90px",
              height: "90px",
              borderRadius: "50%",
              border: "2px solid #ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MessageCircle size={44} />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Your Messages</h2>
          <p style={{ color: "var(--ig-text-secondary)", fontSize: "14px" }}>
            Send private photos, voice messages, and make voice or video calls to friends.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="chat-pane">
      {/* Top Header */}
      <header className="chat-pane-header">
        <div className="chat-header-user">
          <div className="chat-header-avatar">
            {otherParticipant?.profile?.avatarUrl ? (
              <img src={otherParticipant.profile.avatarUrl} alt="" />
            ) : (
              <div className="avatar-init">{displayName[0]?.toUpperCase()}</div>
            )}
            {isOtherOnline && <div className="online-badge" />}
          </div>
          <div>
            <h2 className="chat-header-title">{displayName}</h2>
            <div className={isOtherOnline ? "chat-header-status online" : "chat-header-status"}>
              {isOtherTyping ? (
                "Typing..."
              ) : isOtherOnline ? (
                <>
                  <Circle size={8} fill="currentColor" /> Active now
                </>
              ) : (
                otherParticipant?.profile?.username ? `@${otherParticipant.profile.username}` : "Offline"
              )}
            </div>
          </div>
        </div>

        <div className="chat-header-actions">
          <button
            className="header-tool-btn"
            type="button"
            title="Voice Call"
            onClick={() => onStartCall("audio")}
          >
            <Phone size={20} />
          </button>
          <button
            className="header-tool-btn"
            type="button"
            title="Video Call"
            onClick={() => onStartCall("video")}
          >
            <Video size={22} />
          </button>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="messages-scroll">
        {/* Recipient Profile Banner at top of thread */}
        <div className="thread-profile-banner">
          {otherParticipant?.profile?.avatarUrl ? (
            <img className="banner-avatar" src={otherParticipant.profile.avatarUrl} alt="" />
          ) : (
            <div className="banner-avatar">{displayName[0]?.toUpperCase()}</div>
          )}
          <span className="banner-name">{displayName}</span>
          {otherParticipant?.profile?.username && (
            <span className="banner-handle">@{otherParticipant.profile.username} · Instagram</span>
          )}
          {otherParticipant?.profile?.bio && (
            <p className="banner-bio">{otherParticipant.profile.bio}</p>
          )}
        </div>

        {/* Message Items */}
        {messages.map((message) => (
          <InstagramMessageRow
            key={message.id}
            message={message}
            mine={message.senderId === sessionUser.id}
            sessionUser={sessionUser}
            services={services}
            onReply={() => setReplyTarget(message)}
            onImageClick={(url) => setActiveLightboxMedia(url)}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer Section */}
      <footer className="chat-composer-wrap">
        {replyTarget && (
          <div className="replying-banner">
            <span>
              Replying to <strong>{replyTarget.senderName}</strong>: {replyTarget.body || "Attachment"}
            </span>
            <button type="button" onClick={() => setReplyTarget(null)}>
              <X size={16} />
            </button>
          </div>
        )}

        {isVoiceRecording ? (
          <div className="voice-recorder-bar">
            <div className="recorder-left">
              <div className="recording-dot" />
              <span className="recording-time">{formatDuration(voiceRecordingDuration)}</span>
              <div className="recording-live-waveform">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div
                    key={i}
                    className="live-bar"
                    style={{
                      height: `${Math.max(4, Math.min(22, (voiceRecordingLevel * 24 * (1 + Math.sin(i + voiceRecordingDuration * 4)))))}px`,
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="recorder-actions">
              <button className="record-cancel-btn" type="button" onClick={cancelVoiceRecording}>
                <Trash2 size={16} style={{ verticalAlign: "middle", marginRight: "4px" }} /> Cancel
              </button>
              <button className="record-send-btn" type="button" onClick={finishVoiceRecording}>
                <Send size={16} />
              </button>
            </div>
          </div>
        ) : (
          <form className="composer-bar" onSubmit={sendTextMessage}>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageUpload}
            />

            <button
              className="composer-tool-btn"
              type="button"
              title="Attach Photo"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon size={22} />
            </button>

            <input
              className="composer-input"
              type="text"
              placeholder="Message..."
              value={draft}
              onChange={(e) => handleDraftChange(e.target.value)}
            />

            {draft.trim().length > 0 ? (
              <button className="send-text-btn" type="submit">
                Send
              </button>
            ) : (
              <>
                <button
                  className="composer-tool-btn"
                  type="button"
                  title="Voice Message"
                  onClick={startVoiceRecording}
                >
                  <Mic size={22} />
                </button>

                <button
                  className="composer-tool-btn heart-send-btn"
                  type="button"
                  title="Send Heart"
                  onClick={sendQuickHeart}
                >
                  <Heart size={22} fill="#ff3040" />
                </button>
              </>
            )}
          </form>
        )}
      </footer>
    </section>
  );
}

/* ==========================================================================
   Instagram Message Row & Voice Note Player
   ========================================================================== */
function InstagramMessageRow({
  message,
  mine,
  sessionUser,
  services,
  onReply,
  onImageClick,
}: {
  message: ChatMessage;
  mine: boolean;
  sessionUser: SessionUser;
  services: { chat: ChatService } | null;
  onReply: () => void;
  onImageClick: (url: string) => void;
}) {
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  function handleDoubleTap() {
    setShowHeartPop(true);
    soundService.playHeartPop();
    services?.chat.sendReaction({
      messageId: message.id,
      conversationId: message.conversationId,
      userId: sessionUser.id,
      emoji: "❤️",
    });
    setTimeout(() => setShowHeartPop(false), 700);
  }

  function handleReactionPick(emoji: string) {
    setShowReactionsMenu(false);
    services?.chat.sendReaction({
      messageId: message.id,
      conversationId: message.conversationId,
      userId: sessionUser.id,
      emoji,
    });
  }

  function handleDelete() {
    setShowActionsMenu(false);
    services?.chat.deleteMessage({
      messageId: message.id,
      conversationId: message.conversationId,
      userId: sessionUser.id,
    });
  }

  const reactionList = Object.entries(message.reactions || {});

  return (
    <div className={mine ? "message-wrap mine" : "message-wrap"}>
      <div className="message-row">
        {/* Action button triggers on hover */}
        <div className="msg-actions-trigger">
          <button
            className="action-icon-btn"
            type="button"
            title="React"
            onClick={() => setShowReactionsMenu((v) => !v)}
          >
            <Smile size={16} />
          </button>
          <button
            className="action-icon-btn"
            type="button"
            title="Reply"
            onClick={onReply}
          >
            <Reply size={16} />
          </button>
          {mine && (
            <button
              className="action-icon-btn"
              type="button"
              title="More"
              onClick={() => setShowActionsMenu((v) => !v)}
            >
              <MoreHorizontal size={16} />
            </button>
          )}
        </div>

        {/* Reaction picker popover */}
        {showReactionsMenu && (
          <div className="reaction-picker-pop">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                className="reaction-opt-btn"
                type="button"
                onClick={() => handleReactionPick(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Unsend menu */}
        {showActionsMenu && (
          <div className="reaction-picker-pop" style={{ flexDirection: "column", gap: "4px" }}>
            <button
              type="button"
              onClick={handleDelete}
              style={{ color: "var(--ig-danger)", fontSize: "13px", padding: "4px 8px" }}
            >
              Unsend
            </button>
          </div>
        )}

        {/* The Message Bubble */}
        <div className="bubble" onDoubleClick={handleDoubleTap}>
          {showHeartPop && <Heart className="heart-pop-anim" size={48} fill="#ff3040" />}

          {/* Reply Quote Banner */}
          {message.replyTo && (
            <div className="bubble-reply-preview">
              <div className="bubble-reply-author">{message.replyTo.senderName}</div>
              <div>{message.replyTo.body}</div>
            </div>
          )}

          {/* Content: Voice note, Image, or Text */}
          {message.mediaType === "voice" && message.mediaUrl ? (
            <InstagramVoicePlayer audioUrl={message.mediaUrl} duration={message.audioDuration ?? 0} waveform={message.audioWaveform} />
          ) : message.mediaType === "image" && message.mediaUrl ? (
            <img
              className="bubble-image"
              src={message.mediaUrl}
              alt="Photo"
              onClick={() => onImageClick(message.mediaUrl!)}
            />
          ) : message.body === "❤️" ? (
            <Heart size={38} fill="#ff3040" color="#ff3040" style={{ display: "block" }} />
          ) : (
            <span>{message.body}</span>
          )}

          {/* Floating reactions badge */}
          {reactionList.length > 0 && (
            <div className="message-reactions" onClick={handleDoubleTap}>
              {reactionList.map(([uid, emoji]) => (
                <span key={uid}>{emoji}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   Instagram Voice Note Player with Waveform & Scrubber
   ========================================================================== */
function InstagramVoicePlayer({
  audioUrl,
  duration,
  waveform,
}: {
  audioUrl: string;
  duration: number;
  waveform?: number[];
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const bars = useMemo(() => {
    if (waveform && waveform.length > 0) return waveform;
    return Array.from({ length: 30 }, () => 0.2 + Math.random() * 0.5);
  }, [waveform]);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };
    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [audioUrl]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  }

  function seekTo(index: number) {
    const audio = audioRef.current;
    if (!audio || duration <= 0) return;
    const progress = index / bars.length;
    const target = progress * (audio.duration || duration);
    audio.currentTime = target;
    setCurrentTime(target);
  }

  const effectiveDuration = audioRef.current?.duration || duration || 1;
  const progressRatio = currentTime / effectiveDuration;
  const playedBarIndex = Math.floor(progressRatio * bars.length);

  return (
    <div className="voice-bubble">
      <button className="voice-play-btn" type="button" onClick={togglePlay}>
        {isPlaying ? <Pause size={18} fill="#000" /> : <Play size={18} fill="#000" style={{ marginLeft: "2px" }} />}
      </button>

      <div className="voice-waveform-wrap">
        <div className="waveform-bars">
          {bars.map((barHeight, idx) => (
            <div
              key={idx}
              className={idx <= playedBarIndex ? "waveform-bar played" : "waveform-bar"}
              style={{ height: `${Math.max(6, Math.min(26, barHeight * 26))}px` }}
              onClick={() => seekTo(idx)}
            />
          ))}
        </div>
        <span className="voice-timer">
          {isPlaying ? formatDuration(currentTime) : formatDuration(duration)}
        </span>
      </div>
    </div>
  );
}

/* ==========================================================================
   Instagram Call View (WebRTC Voice & Video Calls)
   ========================================================================== */
function InstagramCallView({
  mode,
  initiator,
  services,
  sessionUser,
  conversations,
  onEnd,
}: {
  mode: CallMode;
  initiator: boolean;
  services: {
    socket: ReturnType<typeof createSocket>;
    callConfig: CallConfigService;
  } | null;
  sessionUser: SessionUser;
  conversations: ConversationWithParticipants[];
  onEnd: () => void;
}) {
  const callServiceRef = useRef<CallService | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [muted, setMuted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(mode === "video");
  const [screenSharing, setScreenSharing] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const conversationId = useCoralStore((state) => state.activeConversationId);
  const callStatus = useCoralStore((state) => state.callStatus);
  const callError = useCoralStore((state) => state.callError);
  const setCallStatus = useCoralStore((state) => state.setCallStatus);
  const setCallError = useCoralStore((state) => state.setCallError);

  const activeConversation = conversations.find((c) => c.id === conversationId);
  const otherParticipant = activeConversation?.participants.find((p) => p.userId !== sessionUser.id);
  const displayName = otherParticipant?.profile?.nickname ?? "Friend";

  useEffect(() => {
    let active = true;
    if (!services || !conversationId) {
      setCallError("Call service not connected.");
      return;
    }

    if (initiator) {
      soundService.startCallingTone();
    }

    setCallStatus("connecting");
    setCallError(null);
    setElapsedSeconds(0);

    services.callConfig
      .getIceServers()
      .then((iceServers) => {
        const callService = new CallService(services.socket, sessionUser.id, iceServers);
        callServiceRef.current = callService;
        return callService.startCall({
          conversationId,
          mode,
          initiator,
          onLocalStream: (s) => {
            if (active) setLocalStream(s);
          },
          onRemoteStream: (s) => {
            if (active) {
              soundService.stopAll();
              soundService.playCallConnected();
              setRemoteStream(s);
              setCallStatus("active");
            }
          },
        });
      })
      .catch((err) => {
        soundService.stopAll();
        if (active) setCallError(err instanceof Error ? err.message : "Could not connect call.");
      });

    return () => {
      active = false;
      soundService.stopAll();
      callServiceRef.current?.endCall();
      callServiceRef.current = null;
    };
  }, [mode, initiator, conversationId, services, sessionUser.id, setCallError, setCallStatus]);

  useEffect(() => {
    if (callStatus !== "active") return;
    const interval = window.setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(interval);
  }, [callStatus]);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
    if (remoteAudioRef.current && remoteStream) remoteAudioRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  function handleEnd() {
    soundService.stopAll();
    soundService.playCallEnded();
    callServiceRef.current?.endCall();
    callServiceRef.current = null;
    onEnd();
  }

  return (
    <section className="call-overlay-screen">
      <audio ref={remoteAudioRef} autoPlay />

      {/* Top Header info */}
      <header className="call-top-header">
        <div className="call-peer-badge">
          <Circle size={10} fill={callStatus === "active" ? "#25d366" : "#ffd600"} color="transparent" />
          <strong>{displayName}</strong>
          <span className="call-duration-pill">
            {callStatus === "active" ? formatDuration(elapsedSeconds) : callStatus === "calling" ? "Calling..." : "Connecting..."}
          </span>
        </div>
      </header>

      {/* Main Stage: Video or Voice Waveform */}
      <div className="video-stage">
        {mode === "video" ? (
          remoteStream ? (
            <video ref={remoteVideoRef} className="remote-video-full" autoPlay playsInline />
          ) : (
            <div className="voice-call-stage">
              <div className="voice-call-avatar-wrap">
                {otherParticipant?.profile?.avatarUrl ? (
                  <img className="voice-call-avatar" src={otherParticipant.profile.avatarUrl} alt="" />
                ) : (
                  <div className="avatar-init" style={{ fontSize: "44px" }}>{displayName[0]?.toUpperCase()}</div>
                )}
              </div>
              <p style={{ color: "var(--ig-text-secondary)", fontSize: "16px" }}>
                {callStatus === "active" ? "Connected" : "Ringing..."}
              </p>
            </div>
          )
        ) : (
          <div className="voice-call-stage">
            <div className="voice-call-avatar-wrap">
              {otherParticipant?.profile?.avatarUrl ? (
                <img className="voice-call-avatar" src={otherParticipant.profile.avatarUrl} alt="" />
              ) : (
                <div className="avatar-init" style={{ fontSize: "44px" }}>{displayName[0]?.toUpperCase()}</div>
              )}
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: 700 }}>{displayName}</h2>
            <p style={{ color: "var(--ig-text-secondary)", fontSize: "15px" }}>
              {callStatus === "active" ? `In voice call · ${formatDuration(elapsedSeconds)}` : "Calling..."}
            </p>
          </div>
        )}

        {/* Local Camera PiP Tile */}
        {mode === "video" && localStream && (
          <div className="local-pip-box">
            <video ref={localVideoRef} autoPlay playsInline muted />
            <span className="pip-label">You</span>
          </div>
        )}
      </div>

      {/* Floating Control Dock */}
      <footer className="call-floating-dock">
        <button
          className={muted ? "call-tool-btn off" : "call-tool-btn"}
          type="button"
          title="Microphone"
          onClick={() => {
            const next = !muted;
            setMuted(next);
            callServiceRef.current?.setMuted(next);
          }}
        >
          <Mic size={22} />
        </button>

        {mode === "video" && (
          <button
            className={!cameraEnabled ? "call-tool-btn off" : "call-tool-btn"}
            type="button"
            title="Camera"
            onClick={() => {
              const next = !cameraEnabled;
              setCameraEnabled(next);
              callServiceRef.current?.setCameraEnabled(next);
            }}
          >
            <Camera size={22} />
          </button>
        )}

        {mode === "video" && (
          <button
            className={screenSharing ? "call-tool-btn off" : "call-tool-btn"}
            type="button"
            title="Share Screen"
            onClick={async () => {
              if (screenSharing) {
                await callServiceRef.current?.stopScreenShare();
                setScreenSharing(false);
              } else {
                await callServiceRef.current?.startScreenShare();
                setScreenSharing(true);
              }
            }}
          >
            <MonitorUp size={22} />
          </button>
        )}

        {mode === "video" && (
          <button
            className="call-tool-btn"
            type="button"
            title="Flip Camera"
            onClick={() => void callServiceRef.current?.switchCamera()}
          >
            <RefreshCw size={20} />
          </button>
        )}

        <button className="call-tool-btn end-call" type="button" title="End Call" onClick={handleEnd}>
          <Phone size={24} style={{ transform: "rotate(135deg)" }} />
        </button>
      </footer>
    </section>
  );
}

/* ==========================================================================
   Instagram Profile View
   ========================================================================== */
function InstagramProfileView({
  profile,
  sessionUser,
  conversations,
  friends,
  onEditProfile,
  onSignOut,
}: {
  profile: Profile | null;
  sessionUser: SessionUser;
  conversations: ConversationWithParticipants[];
  friends: Friend[];
  onEditProfile: () => void;
  onSignOut: () => Promise<void>;
}) {
  return (
    <section className="profile-view">
      <div className="profile-header-card">
        <div className="profile-avatar-lg">
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" />
          ) : (
            <div className="avatar-init">{profile?.nickname?.[0]?.toUpperCase() ?? "U"}</div>
          )}
        </div>

        <div className="profile-meta-info">
          <div className="profile-username-row">
            <h1>{profile?.username ? `@${profile.username}` : profile?.nickname}</h1>
            <button className="ig-button-secondary" type="button" onClick={onEditProfile}>
              Edit profile
            </button>
            <button className="ig-button-secondary" type="button" onClick={onSignOut}>
              <LogOut size={15} style={{ verticalAlign: "middle", marginRight: "4px" }} /> Log out
            </button>
          </div>

          <div className="profile-stats-row">
            <span className="stat-item">
              <strong>{conversations.length}</strong> direct threads
            </span>
            <span className="stat-item">
              <strong>{friends.length}</strong> friends
            </span>
          </div>

          <div className="profile-bio-block">
            <strong>{profile?.nickname ?? sessionUser.name}</strong>
            <p>{profile?.bio || "No bio yet."}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   Instagram Settings View
   ========================================================================== */
function InstagramSettingsView({
  profile,
  services,
  sessionUser,
  onProfileSaved,
  onSignOut,
}: {
  profile: Profile | null;
  services: { profile: ProfileService } | null;
  sessionUser: SessionUser;
  onProfileSaved: (p: Profile) => void;
  onSignOut: () => Promise<void>;
}) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState("");
  const [selectedCamera, setSelectedCamera] = useState("");
  const setActionFeedback = useCoralStore((state) => state.setActionFeedback);

  useEffect(() => {
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((d) => setDevices(d));
    }
  }, []);

  const mics = devices.filter((d) => d.kind === "audioinput");
  const cams = devices.filter((d) => d.kind === "videoinput");

  return (
    <section className="profile-view" style={{ maxWidth: "600px" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "24px", alignSelf: "flex-start" }}>
        Settings & Preferences
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
        <div className="ig-field">
          <label>Microphone Device</label>
          <select value={selectedMic} onChange={(e) => setSelectedMic(e.target.value)}>
            <option value="">Default Microphone</option>
            {mics.map((m, i) => (
              <option key={m.deviceId || i} value={m.deviceId}>
                {m.label || `Microphone ${i + 1}`}
              </option>
            ))}
          </select>
        </div>

        <div className="ig-field">
          <label>Camera Device</label>
          <select value={selectedCamera} onChange={(e) => setSelectedCamera(e.target.value)}>
            <option value="">Default Camera</option>
            {cams.map((c, i) => (
              <option key={c.deviceId || i} value={c.deviceId}>
                {c.label || `Camera ${i + 1}`}
              </option>
            ))}
          </select>
        </div>

        <div style={{ borderTop: "1px solid var(--ig-border)", paddingTop: "20px", display: "flex", gap: "12px" }}>
          <button
            className="ig-button-primary"
            type="button"
            onClick={() => setActionFeedback("Device preferences saved.")}
          >
            Save preferences
          </button>
          <button className="ig-button-secondary" type="button" onClick={onSignOut}>
            Log Out
          </button>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   User Search & New Chat Modal
   ========================================================================== */
function UserSearchModal({
  sessionUser,
  services,
  onClose,
  onStartDm,
}: {
  sessionUser: SessionUser;
  services: any;
  onClose: () => void;
  onStartDm: (userId: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<{
    profile: Profile | null;
    relationship: "none" | "friend" | "requested" | "pending_response";
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    const q = searchQuery.trim().replace(/^@/, "");
    if (!q || q.length < 3) return;
    setLoading(true);
    try {
      const res = await services?.friends.search(q);
      setSearchResult(res);
    } catch {
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h3>New message</h3>
          <button type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="modal-body">
          <div className="inbox-search-input-wrap">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search user by @username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSearch();
              }}
              autoFocus
            />
            {loading && <Loader2 className="spin" size={16} />}
          </div>

          {searchResult?.profile ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px",
                background: "var(--ig-surface-1)",
                borderRadius: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="thread-avatar" style={{ width: "44px", height: "44px" }}>
                  {searchResult.profile.avatarUrl ? (
                    <img src={searchResult.profile.avatarUrl} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
                  ) : (
                    searchResult.profile.nickname[0]?.toUpperCase()
                  )}
                </div>
                <div>
                  <strong style={{ fontSize: "14.5px" }}>{searchResult.profile.nickname}</strong>
                  <div style={{ fontSize: "12.5px", color: "var(--ig-text-secondary)" }}>
                    @{searchResult.profile.username}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                {searchResult.relationship === "none" && (
                  <button
                    className="ig-button-secondary"
                    type="button"
                    onClick={async () => {
                      await services?.friends.request(searchResult.profile!.username!);
                      await handleSearch();
                    }}
                  >
                    Follow / Add
                  </button>
                )}
                <button
                  className="ig-button-primary"
                  type="button"
                  onClick={() => onStartDm(searchResult.profile!.id)}
                >
                  Chat
                </button>
              </div>
            </div>
          ) : (
            searchQuery.trim().length >= 3 &&
            !loading && (
              <p style={{ textAlign: "center", color: "var(--ig-text-tertiary)", fontSize: "13.5px" }}>
                Press Enter to search
              </p>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   Edit Profile Modal
   ========================================================================== */
function EditProfileModal({
  profile,
  services,
  onClose,
  onSaved,
}: {
  profile: Profile | null;
  services: { profile: ProfileService } | null;
  onClose: () => void;
  onSaved: (p: Profile) => void;
}) {
  const [username, setUsername] = useState(profile?.username ?? "");
  const [nickname, setNickname] = useState(profile?.nickname ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? "");
  const [pending, setPending] = useState(false);

  async function handleSave() {
    if (!services) return;
    setPending(true);
    try {
      const updated = await services.profile.updateMe({
        username,
        nickname,
        bio,
        avatarUrl,
      });
      onSaved(updated);
    } catch {
      // Ignore
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h3>Edit profile</h3>
          <button type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="modal-body">
          <div className="ig-field">
            <label>Name</label>
            <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          </div>

          <div className="ig-field">
            <label>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>

          <div className="ig-field">
            <label>Bio</label>
            <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>

          <div className="ig-field">
            <label>Profile Picture URL</label>
            <input type="url" placeholder="https://..." value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
          </div>
        </div>

        <footer className="modal-footer">
          <button className="ig-button-secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="ig-button-primary" type="button" disabled={pending} onClick={handleSave}>
            {pending ? <Loader2 className="spin" size={16} /> : "Save"}
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ==========================================================================
   Instagram SVG Icons & Wordmark
   ========================================================================== */
function InstagramGlyph({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="6" r="1.2" fill="currentColor" />
    </svg>
  );
}

function InstagramWordmark() {
  return (
    <svg height="36" viewBox="0 0 104 29" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
      <path d="M79.2 16.6c0-2.4 1.6-3.8 3.6-3.8 1.9 0 3.2 1.3 3.2 3.4v6.8h2.8v-7.2c0-3.3-2.2-5.4-5.3-5.4-2.4 0-4 1.2-4.8 2.8V10.7h-2.7v12.7h2.8v-6.8h.4zm-14.8-5.9c-3.8 0-6.7 2.9-6.7 6.8 0 3.8 2.9 6.8 6.7 6.8s6.7-2.9 6.7-6.8c0-3.9-2.9-6.8-6.7-6.8zm0 11.2c-2.4 0-4-1.8-4-4.4 0-2.6 1.6-4.4 4-4.4 2.4 0 4 1.8 4 4.4 0 2.6-1.6 4.4-4 4.4zm-14-11.2c-3.8 0-6.7 2.9-6.7 6.8 0 3.8 2.9 6.8 6.7 6.8 2.3 0 4.1-1.1 5-2.8v2.5h2.6V10.7h-2.6v2.5c-1-1.6-2.8-2.5-5-2.5zm.7 11.2c-2.4 0-4-1.8-4-4.4 0-2.6 1.6-4.4 4-4.4 2.3 0 3.9 1.8 3.9 4.4 0 2.6-1.6 4.4-3.9 4.4zm-14.7-6.4c-.6-.5-1.5-.9-2.6-.9-1.6 0-2.6.8-2.6 1.8 0 1.2 1.3 1.5 2.8 1.9 2.4.6 4.4 1.3 4.4 3.8 0 2.6-2.1 4.2-4.9 4.2-2.1 0-3.7-.7-4.8-1.9l1.6-1.8c.8.9 1.9 1.4 3.2 1.4 1.4 0 2.3-.7 2.3-1.8 0-1.2-1.2-1.6-2.8-2-2.2-.5-4.4-1.2-4.4-3.7 0-2.4 1.9-4.1 4.7-4.1 1.8 0 3.2.6 4.2 1.5l-1.1 2zm-12.7-8.1h2.8v17.2h-2.8V6.2zm-6.8 7.3c-.8-1.7-2.6-2.8-4.8-2.8-3.1 0-5.3 2.1-5.3 5.4v7.2h2.8v-6.8c0-2.1 1.3-3.4 3.2-3.4 2 0 3.6 1.4 3.6 3.8v6.4h2.8V10.7h-2.7v2.8h.4zM3.4 23.4h2.8V6.2H3.4v17.2z" />
    </svg>
  );
}
