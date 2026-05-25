import { webRTCService } from "./WebRTCService";

export class VideoCallService {
  private stream: MediaStream | null = null;
  private screenTrack: MediaStreamTrack | null = null;

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

  endVideoCall() {
    void this.stopScreenShare();
    webRTCService.stopStream(this.stream);
    this.stream = null;
    webRTCService.close();
  }
}

export const videoCallService = new VideoCallService();
