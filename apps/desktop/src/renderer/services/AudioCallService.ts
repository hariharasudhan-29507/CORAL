import { webRTCService } from "./WebRTCService";

export class AudioCallService {
  private stream: MediaStream | null = null;

  async startAudioCall() {
    const { connection, stream } = await webRTCService.attachLocalStream({ audio: true, video: false });
    this.stream = stream;
    return { connection, stream };
  }

  setMuted(muted: boolean) {
    webRTCService.toggleTrack("audio", !muted);
  }

  endAudioCall() {
    webRTCService.stopStream(this.stream);
    this.stream = null;
    webRTCService.close();
  }
}

export const audioCallService = new AudioCallService();
