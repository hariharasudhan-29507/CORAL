import type { CoralSocket } from "./SocketService";
import { webRTCService } from "./WebRTCService";
import { audioCallService } from "./AudioCallService";
import { videoCallService } from "./VideoCallService";
import type { CallInvite, SignalingPayload } from "@coral/shared";

type CallMode = "audio" | "video";

export type StartCallOptions = {
  conversationId: string;
  mode: CallMode;
  initiator: boolean;
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream) => void;
};

export class CallService {
  private conversationId: string | null = null;
  private mode: CallMode = "video";

  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  private onLocalStream?: (stream: MediaStream) => void;
  private onRemoteStream?: (stream: MediaStream) => void;

  private handleAccepted = async (payload: CallInvite) => {
    if (!this.conversationId || payload.conversationId !== this.conversationId) return;

    const offer = await webRTCService.createOffer();
    this.socket.emit("signal:offer", {
      conversationId: this.conversationId,
      fromUserId: this.userId,
      description: offer,
    });
  };

  private handleRemoteEnded = (payload: CallInvite) => {
    if (!this.conversationId || payload.conversationId !== this.conversationId) return;
    this.endCall(false);
  };

  private handleOffer = async (payload: SignalingPayload) => {
    if (!this.conversationId || payload.conversationId !== this.conversationId) return;
    if (this.mode === "audio") {
      if (!this.localStream) {
        const { stream } = await audioCallService.startAudioCall();
        this.localStream = stream;
        this.onLocalStream?.(stream);
      }

      const answer = await webRTCService.createAnswer(payload.description as RTCSessionDescriptionInit);
      this.socket.emit("signal:answer", {
        conversationId: this.conversationId,
        fromUserId: this.userId,
        description: answer,
      });
      return;
    }

    if (this.mode === "video") {
      if (!this.localStream) {
        const { stream } = await videoCallService.startVideoCall();
        this.localStream = stream;
        this.onLocalStream?.(stream);
      }

      const answer = await webRTCService.createAnswer(payload.description as RTCSessionDescriptionInit);
      this.socket.emit("signal:answer", {
        conversationId: this.conversationId,
        fromUserId: this.userId,
        description: answer,
      });
    }
  };

  private handleAnswer = async (payload: SignalingPayload) => {
    if (!this.conversationId || payload.conversationId !== this.conversationId) return;
    await webRTCService.setRemoteDescription(payload.description as RTCSessionDescriptionInit);
  };

  private handleIceCandidate = async (payload: SignalingPayload) => {
    if (!this.conversationId || payload.conversationId !== this.conversationId) return;
    if (!payload.candidate) return;
    await webRTCService.addIceCandidate(payload.candidate as RTCIceCandidateInit);
  };

  private handleIceOnPc = (event: RTCPeerConnectionIceEvent) => {
    if (!this.conversationId) return;
    if (!event.candidate) return;

    this.socket.emit("signal:ice-candidate", {
      conversationId: this.conversationId,
      fromUserId: this.userId,
      candidate: event.candidate.toJSON(),
    });
  };

  private handleTrack = (event: RTCTrackEvent) => {
    const streamFromEvent = event.streams?.[0];
    if (streamFromEvent) {
      this.remoteStream = streamFromEvent;
      this.onRemoteStream?.(streamFromEvent);
      return;
    }

    if (!this.remoteStream) {
      this.remoteStream = new MediaStream();
    }
    this.remoteStream.addTrack(event.track);
    this.onRemoteStream?.(this.remoteStream);
  };

  constructor(
    private readonly socket: CoralSocket,
    private readonly userId: string,
    iceServers: RTCIceServer[],
  ) {
    webRTCService.configure(iceServers);
  }

  async startCall(options: StartCallOptions) {
    this.conversationId = options.conversationId;
    this.mode = options.mode;
    this.onLocalStream = options.onLocalStream;
    this.onRemoteStream = options.onRemoteStream;

    // Join the socket conversation used for signaling relay.
    this.socket.emit("conversation:join", { conversationId: this.conversationId });

    const pc = webRTCService.createPeerConnection();
    pc.onicecandidate = this.handleIceOnPc;
    pc.ontrack = this.handleTrack;

    this.socket.on("signal:offer", this.handleOffer);
    this.socket.on("signal:answer", this.handleAnswer);
    this.socket.on("signal:ice-candidate", this.handleIceCandidate);
    this.socket.on("call:accept", this.handleAccepted);
    this.socket.on("call:end", this.handleRemoteEnded);

    // Create/attach local media once so both offer and answer can use it.
    if (this.mode === "audio") {
      const { stream } = await audioCallService.startAudioCall();
      this.localStream = stream;
      this.onLocalStream?.(stream);
    } else {
      const { stream } = await videoCallService.startVideoCall();
      this.localStream = stream;
      this.onLocalStream?.(stream);
    }

    if (options.initiator) {
      this.socket.emit("call:invite", {
        conversationId: this.conversationId,
        fromUserId: this.userId,
        mode: this.mode,
      });
    } else {
      this.socket.emit("call:accept", {
        conversationId: this.conversationId,
        fromUserId: this.userId,
        mode: this.mode,
      });
    }
  }

  endCall(notifyRemote = true) {
    if (!this.conversationId) return;
    const endedConversationId = this.conversationId;
    const endedMode = this.mode;

    // Remove socket listeners first to avoid callbacks after cleanup.
    this.socket.off("signal:offer", this.handleOffer);
    this.socket.off("signal:answer", this.handleAnswer);
    this.socket.off("signal:ice-candidate", this.handleIceCandidate);
    this.socket.off("call:accept", this.handleAccepted);
    this.socket.off("call:end", this.handleRemoteEnded);

    if (this.mode === "audio") audioCallService.endAudioCall();
    if (this.mode === "video") videoCallService.endVideoCall();

    // Intentionally do not leave the conversation here.
    // The chat layer may still be joined to the same conversation.
    this.conversationId = null;
    this.localStream = null;
    this.remoteStream = null;

    if (notifyRemote) {
      this.socket.emit("call:end", {
        conversationId: endedConversationId,
        fromUserId: this.userId,
        mode: endedMode,
      });
    }
  }

  getLocalStream() {
    return this.localStream;
  }

  getRemoteStream() {
    return this.remoteStream;
  }

  setMuted(muted: boolean) {
    if (this.mode === "audio") audioCallService.setMuted(muted);
    if (this.mode === "video") videoCallService.setMuted(muted);
  }

  setCameraEnabled(enabled: boolean) {
    if (this.mode === "video") videoCallService.setCameraEnabled(enabled);
  }

  async switchCamera() {
    if (this.mode !== "video") return null;
    return videoCallService.switchCamera();
  }

  async startScreenShare() {
    if (this.mode !== "video") return null;
    return videoCallService.startScreenShare();
  }

  async stopScreenShare() {
    if (this.mode !== "video") return;
    return videoCallService.stopScreenShare();
  }
}
