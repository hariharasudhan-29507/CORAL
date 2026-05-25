export type PeerMedia = {
  audio: boolean;
  video: boolean;
};

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;

  createPeerConnection() {
    if (this.peerConnection) return this.peerConnection;

    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
      iceTransportPolicy: "all",
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require",
    });

    return this.peerConnection;
  }

  async getLocalStream(media: PeerMedia) {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: media.audio
        ? {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        : false,
      video: media.video
        ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 24, max: 30 },
          }
        : false,
    });

    return this.localStream;
  }

  async attachLocalStream(media: PeerMedia) {
    const connection = this.createPeerConnection();
    const stream = await this.getLocalStream(media);
    stream.getTracks().forEach((track) => connection.addTrack(track, stream));
    return { connection, stream };
  }

  async createOffer() {
    const connection = this.createPeerConnection();
    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(remoteDescription: RTCSessionDescriptionInit) {
    const connection = this.createPeerConnection();
    await connection.setRemoteDescription(remoteDescription);
    const answer = await connection.createAnswer();
    await connection.setLocalDescription(answer);
    return answer;
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit) {
    const connection = this.createPeerConnection();
    await connection.setRemoteDescription(description);
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection) return;
    await this.peerConnection.addIceCandidate(candidate);
  }

  toggleTrack(kind: "audio" | "video", enabled: boolean) {
    this.localStream
      ?.getTracks()
      .filter((track) => track.kind === kind)
      .forEach((track) => {
        track.enabled = enabled;
      });
  }

  async replaceVideoTrack(track: MediaStreamTrack | null) {
    const sender = this.peerConnection?.getSenders().find((current) => current.track?.kind === "video");
    if (!sender) return;
    await sender.replaceTrack(track);
  }

  stopStream(stream = this.localStream) {
    stream?.getTracks().forEach((track) => track.stop());
    if (stream === this.localStream) this.localStream = null;
  }

  close() {
    this.stopStream();
    this.peerConnection?.close();
    this.peerConnection = null;
  }
}

export const webRTCService = new WebRTCService();
