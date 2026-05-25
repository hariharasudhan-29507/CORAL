import { type CSSProperties, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Camera,
  Check,
  Circle,
  Loader2,
  LogIn,
  MessageCircle,
  Mic,
  MonitorUp,
  Phone,
  Search,
  Send,
  Settings,
  UserPlus,
  Video,
  X,
} from "lucide-react";
import { type ChatMessage } from "@coral/shared";
import { Logo } from "../components/Logo";
import { callParticipants, contacts, currentUser } from "../lib/sampleData";
import { authService, type SessionUser } from "../services/AuthService";
import { AIService } from "../services/AIService";
import { ChatService } from "../services/ChatService";
import { createSocket } from "../services/SocketService";
import { useCoralStore, type CoralView } from "../store/useCoralStore";

const navItems: Array<{ view: CoralView; label: string; icon: typeof MessageCircle }> = [
  { view: "chat", label: "Messages", icon: MessageCircle },
  { view: "call", label: "Calls", icon: Video },
  { view: "settings", label: "Settings", icon: Settings },
];

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
          <Logo />
          <span>Coral</span>
        </section>
        <div className="login-panel login-panel-compact">
          <Loader2 className="spin" size={18} />
          <p>Checking your session</p>
        </div>
      </main>
    );
  }

  if (!sessionUser)
    return (
      <LoginScreen
        onAuthenticate={async (mode, request) => {
          const user = mode === "register" ? await authService.register(request) : await authService.signIn(request);
          setSessionUser(user);
        }}
      />
    );

  return <CoralShell sessionUser={sessionUser} />;
}

type AuthMode = "login" | "register";

function LoginScreen({
  onAuthenticate,
}: {
  onAuthenticate: (mode: AuthMode, request: { credential: string; password: string; name?: string }) => Promise<void>;
}) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      await onAuthenticate(mode, { credential, password, name });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign in.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-brand">
        <Logo />
        <span>Coral</span>
      </section>

      <form
        className="login-panel"
        onSubmit={submit}
      >
        <div>
          <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p>Use an email address or phone number to continue</p>
        </div>
        <div className="auth-mode" role="tablist" aria-label="Authentication mode">
          <button
            aria-selected={mode === "login"}
            className={mode === "login" ? "active" : ""}
            role="tab"
            type="button"
            onClick={() => setMode("login")}
          >
            Sign in
          </button>
          <button
            aria-selected={mode === "register"}
            className={mode === "register" ? "active" : ""}
            role="tab"
            type="button"
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        {mode === "register" && (
          <label className="field">
            <span>Name</span>
            <input
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
        )}

        <label className="field">
          <span>Email or phone</span>
          <input
            type="text"
            required
            autoComplete={mode === "register" ? "email" : "username"}
            inputMode="email"
            value={credential}
            onChange={(event) => setCredential(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            required
            minLength={mode === "register" ? 8 : undefined}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <button className="button button-primary" type="submit" disabled={pending}>
          {pending ? <Loader2 className="spin" size={16} /> : mode === "register" ? <UserPlus size={16} /> : <LogIn size={16} />}
          {pending ? "Working" : mode === "register" ? "Create account" : "Sign in"}
        </button>

        <div className="login-divider" />

        <p className="auth-hint">
          {mode === "register" ? "Passwords are hashed before storage." : "No account yet? Use Register above."}
        </p>
      </form>
    </main>
  );
}

function CoralShell({ sessionUser }: { sessionUser: SessionUser }) {
  const view = useCoralStore((state) => state.view);
  const setView = useCoralStore((state) => state.setView);
  const servicesRef = useRef<{
    chat: ChatService;
    ai: AIService;
    socket: ReturnType<typeof createSocket>;
  } | null>(null);

  if (!servicesRef.current) {
    const activeUser = authService.getCurrentUser() ?? sessionUser ?? {
      id: currentUser.id,
      name: currentUser.name,
      email: "you@coral.app",
    };
    const socket = createSocket(activeUser, authService.getSessionToken());
    servicesRef.current = {
      socket,
      chat: new ChatService(socket),
      ai: new AIService(socket),
    };
  }

  useEffect(() => {
    const services = servicesRef.current;
    if (!services) return;

    const { socket, chat, ai } = services;
    const addMessage = useCoralStore.getState().addMessage;
    const appendAiToken = useCoralStore.getState().appendAiToken;
    const finishAiReply = useCoralStore.getState().finishAiReply;

    const offMessage = chat.onMessage((message) => {
      addMessage(message);
    });
    const offAi = ai.stream({
      onToken: ({ replyId, roomId, token }) => {
        appendAiToken(replyId, roomId, token);
      },
      onDone: ({ replyId }) => {
        finishAiReply(replyId);
      },
      onError: (message) => {
        useCoralStore.getState().addMessage({
          id: crypto.randomUUID(),
          roomId: "design-review",
          senderId: "coral-ai",
          senderName: "Coral AI",
          body: message,
          createdAt: new Date().toISOString(),
          kind: "system",
        });
      },
    });

    socket.connect();
    chat.join("design-review");

    return () => {
      chat.leave("design-review");
      offMessage();
      offAi();
      socket.disconnect();
    };
  }, []);

  return (
    <main className={view === "call" ? "app-shell call-mode" : "app-shell"}>
      {view !== "call" && <NavigationRail view={view} onChange={setView} />}
      {view !== "call" && <ContactList />}
      {view === "chat" && <ChatView services={servicesRef.current} sessionUser={sessionUser} />}
      {view === "call" && <CallView onBack={() => setView("chat")} />}
      {view === "settings" && <SettingsView />}
    </main>
  );
}

function NavigationRail({ view, onChange }: { view: CoralView; onChange: (view: CoralView) => void }) {
  return (
    <aside className="nav-rail">
      <Logo />
      <nav aria-label="Primary">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.view}
              className={view === item.view ? "rail-button active" : "rail-button"}
              type="button"
              onClick={() => onChange(item.view)}
              title={item.label}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </nav>
      <div className="profile-dot" />
    </aside>
  );
}

function ContactList() {
  return (
    <aside className="contact-list">
      <div className="contact-search">
        <h2>Direct messages</h2>
        <label>
          <Search size={14} />
          <input aria-label="Search contacts" placeholder="Search" />
        </label>
      </div>

      <div className="contacts">
        {contacts.map((contact, index) => (
          <button key={contact.id} className={index === 1 ? "contact-row selected" : "contact-row"}>
            <span className="avatar" style={{ "--avatar-hue": `${index * 47 + 200}` } as CSSProperties}>
              <span className={`presence ${contact.status}`} />
            </span>
            <span className="contact-copy">
              <span>{contact.name}</span>
              <small>{contact.preview}</small>
            </span>
            {contact.unread > 0 && <strong>{contact.unread}</strong>}
          </button>
        ))}
      </div>
    </aside>
  );
}

function ChatView({
  services,
  sessionUser,
}: {
  services: {
    chat: ChatService;
    ai: AIService;
    socket: ReturnType<typeof createSocket>;
  } | null;
  sessionUser: SessionUser;
}) {
  const messages = useCoralStore((state) => state.messages);
  const addMessage = useCoralStore((state) => state.addMessage);
  const appendAiToken = useCoralStore((state) => state.appendAiToken);
  const aiPanelOpen = useCoralStore((state) => state.aiPanelOpen);
  const aiStreaming = useCoralStore((state) => state.aiStreaming);
  const toggleAiPanel = useCoralStore((state) => state.toggleAiPanel);
  const [draft, setDraft] = useState("");

  function sendMessage(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      roomId: "design-review",
      senderId: sessionUser.id,
      senderName: sessionUser.name,
      body,
      createdAt: new Date().toISOString(),
      kind: body.startsWith("@ai") ? "ai" : "user",
    };

    if (body.startsWith("@ai")) {
      addMessage({
        ...message,
        kind: "user",
      });

      const prompt = body.replace(/^@ai\s*/i, "").trim();
      const contextMessages = messages.slice(-6);

      if (services?.socket.connected) {
        services.ai.ask({
          roomId: "design-review",
          prompt: prompt || "Summarize the latest conversation.",
          contextMessageIds: contextMessages.map((item) => item.id),
        });
      } else {
        const replyId = crypto.randomUUID();
        const fallback = services?.ai.createLocalFallback(prompt, contextMessages) ?? "Local Coral draft is unavailable.";
        appendAiToken(replyId, "design-review", fallback);
        useCoralStore.getState().finishAiReply(replyId);
      }
    } else if (services?.socket.connected) {
      services.chat.send({
        roomId: message.roomId,
        senderId: message.senderId,
        senderName: message.senderName,
        body: message.body,
        kind: message.kind,
      });
    } else {
      addMessage(message);
    }

    setDraft("");
  }

  return (
    <section className={aiPanelOpen ? "chat-layout ai-open" : "chat-layout"}>
      <div className="chat-thread">
        <header className="chat-header">
          <div className="conversation-title">
            <span className="avatar" style={{ "--avatar-hue": "247" } as CSSProperties} />
            <div>
              <h1>Arjun Mehra</h1>
              <p>Online</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="icon-button primary" type="button" title="Start audio call">
              <Phone size={17} />
            </button>
            <button className="icon-button" type="button" title="Start video call">
              <Video size={17} />
            </button>
            <button className="icon-button ai" type="button" title="Toggle Coral AI" onClick={toggleAiPanel}>
              <Bot size={17} />
            </button>
          </div>
        </header>

        <div className="messages">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} mine={message.senderId === sessionUser.id} />
          ))}
        </div>

        <form className="composer" onSubmit={sendMessage}>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Message Arjun or type @ai to ask Coral"
          />
          <button className="send-button" type="submit" title="Send message">
            <Send size={16} />
          </button>
        </form>
      </div>

      {aiPanelOpen && <AiPanel />}
    </section>
  );
}

function MessageBubble({ message, mine }: { message: ChatMessage; mine: boolean }) {
  const time = useMemo(
    () =>
      new Intl.DateTimeFormat("en", {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(message.createdAt)),
    [message.createdAt],
  );

  return (
    <article className={mine ? "message mine" : message.kind === "ai" ? "message ai-message" : "message"}>
      {!mine && <strong>{message.senderName}</strong>}
      <div>{message.body}</div>
      <time>{time}</time>
    </article>
  );
}

function AiPanel() {
  const messages = useCoralStore((state) =>
    state.messages.filter((message) => message.kind === "ai" || message.body.startsWith("@ai")),
  );
  const aiStreaming = useCoralStore((state) => state.aiStreaming);

  return (
    <aside className="ai-panel">
      <header>
        <Bot size={18} />
        <span>Coral AI</span>
      </header>
      <button type="button">Summarize thread</button>
      <button type="button">Translate message</button>
      <button type="button">Smart reply</button>
      <section>
        <h2>{aiStreaming ? "Streaming reply" : "Recent AI context"}</h2>
        {messages.slice(-4).map((message) => (
          <p key={message.id}>{message.body}</p>
        ))}
      </section>
    </aside>
  );
}

function CallView({ onBack }: { onBack: () => void }) {
  return (
    <section className="call-view">
      <header className="call-topbar">
        <div>
          <Circle size={10} fill="currentColor" />
          <strong>Design Review</strong>
          <span>42:17</span>
        </div>
        <div>
          <span>4 people</span>
          <span className="transcribing">
            <Bot size={14} />
            Transcribing
          </span>
        </div>
      </header>

      <div className="video-grid">
        {callParticipants.map((participant, index) => (
          <div
            key={participant}
            className={index === 2 ? "video-tile active-speaker" : "video-tile"}
            style={{ "--avatar-hue": `${index * 51 + 210}` } as CSSProperties}
          >
            <span>{participant}</span>
          </div>
        ))}
      </div>

      <div className="call-dock">
        <button className="call-button" type="button" title="Microphone">
          <Mic size={19} />
        </button>
        <button className="call-button" type="button" title="Camera">
          <Camera size={19} />
        </button>
        <button className="call-button" type="button" title="Screen share">
          <MonitorUp size={19} />
        </button>
        <button className="call-button ai" type="button" title="Coral AI">
          <Bot size={19} />
        </button>
        <button className="call-button end" type="button" title="End call" onClick={onBack}>
          <Phone size={22} />
        </button>
      </div>
    </section>
  );
}

function SettingsView() {
  const navItems = ["Profile", "Audio & video", "Appearance", "Notifications", "AI & Coral", "Privacy", "About"];

  return (
    <section className="settings-layout">
      <aside>
        <h1>Settings</h1>
        {navItems.map((item, index) => (
          <button key={item} className={index === 1 ? "selected" : ""} type="button">
            {item}
          </button>
        ))}
      </aside>

      <form className="settings-form">
        <div>
          <h2>Audio & Video</h2>
          <p>Configure your microphone, speakers, and camera</p>
        </div>
        {[
          ["Microphone", "Built-in microphone"],
          ["Speakers", "Default output"],
          ["Camera", "Default camera"],
        ].map(([label, value]) => (
          <label className="field" key={label}>
            <span>{label}</span>
            <select defaultValue={value}>
              <option>{value}</option>
            </select>
          </label>
        ))}
        <div className="settings-actions">
          <button className="button button-primary" type="button">
            <Check size={16} />
            Save changes
          </button>
          <button className="button button-secondary" type="button">
            <X size={16} />
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
