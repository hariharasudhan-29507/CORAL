import { webRTCService } from "./WebRTCService";

export class VideoCallService {
  private stream: MediaStream | null = null;
  private screenTrack: MediaStreamTrack | null = null;
  private facingMode: "user" | "environment" = "user";

  async startVideoCall() {
    const { connection, stream } = await webRTCService.attachLocalStream({ audio: true, video: true });
    this.stream = stream;
    return { connection, stream };
  }

  setMuted(muted: boolean) {
    webRTCService.toggleTrack("audio", !muted);
  }

  setCameraEnabled(enabled: boolean) {
    webRTCService.toggleTrack("video", enabled);
  }

  async startScreenShare() {
    const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    const [track] = displayStream.getVideoTracks();

    if (!track) return null;

    this.screenTrack = track;
    track.addEventListener("ended", () => {
      void this.stopScreenShare();
    });
    await webRTCService.replaceVideoTrack(track);

    return track;
  }

  async stopScreenShare() {
    this.screenTrack?.stop();
    this.screenTrack = null;
    const cameraTrack = this.stream?.getVideoTracks()[0] ?? null;
    await webRTCService.replaceVideoTrack(cameraTrack);
  }

  async switchCamera() {
    if (!this.stream) return null;
    this.facingMode = this.facingMode === "user" ? "environment" : "user";
    const nextStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: this.facingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 24, max: 30 },
      },
    });
    const [nextTrack] = nextStream.getVideoTracks();
    if (!nextTrack) return null;

    const [currentTrack] = this.stream.getVideoTracks();
    currentTrack?.stop();
    if (currentTrack) this.stream.removeTrack(currentTrack);
    this.stream.addTrack(nextTrack);
    await webRTCService.replaceVideoTrack(nextTrack);
    return this.stream;
  }

  endVideoCall() {
    void this.stopScreenShare();
    webRTCService.stopStream(this.stream);
    this.stream = null;
    webRTCService.close();
  }
}

export const videoCallService = new VideoCallService();
