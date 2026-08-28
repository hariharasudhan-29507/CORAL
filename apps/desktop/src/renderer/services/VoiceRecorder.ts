// Voice recorder and audio waveform extraction service for Instagram Direct voice messages

export type VoiceRecordResult = {
  audioUrl: string; // Base64 data URL
  duration: number; // in seconds
  waveform: number[]; // Array of 30 normalized bar heights (0.15 to 1.0)
  mimeType: string;
};

export type VoiceRecorderListener = {
  onLevel?: (level: number) => void;
  onTick?: (seconds: number) => void;
};

export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private tickIntervalId: number | null = null;
  private chunks: Blob[] = [];
  private startTime: number = 0;
  private rawLevels: number[] = [];

  async start(listeners?: VoiceRecorderListener): Promise<void> {
    this.stop();
    this.chunks = [];
    this.rawLevels = [];

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    this.audioStream = stream;

    // Set up Web Audio Analyser
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioContext = new AudioCtx();
    this.audioContext = audioContext;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.6;
    source.connect(analyser);
    this.analyser = analyser;

    // Pick best supported MIME type
    let mimeType = "audio/webm;codecs=opus";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
        mimeType = "audio/ogg";
      } else {
        mimeType = "";
      }
    }

    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    this.mediaRecorder = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    recorder.start(100);
    this.startTime = Date.now();

    // Visualizer loop
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const updateLevel = () => {
      if (!this.analyser) return;
      this.analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] ?? 0;
      }
      const avg = sum / (dataArray.length || 1);
      const normalized = Math.min(1.0, Math.max(0.15, avg / 128));
      this.rawLevels.push(normalized);

      listeners?.onLevel?.(normalized);
      this.animFrameId = requestAnimationFrame(updateLevel);
    };
    this.animFrameId = requestAnimationFrame(updateLevel);

    // Duration timer
    this.tickIntervalId = window.setInterval(() => {
      const elapsed = (Date.now() - this.startTime) / 1000;
      listeners?.onTick?.(elapsed);
    }, 200);
  }

  async stop(): Promise<VoiceRecordResult | null> {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.tickIntervalId) {
      clearInterval(this.tickIntervalId);
      this.tickIntervalId = null;
    }

    if (this.audioContext && this.audioContext.state !== "closed") {
      void this.audioContext.close();
      this.audioContext = null;
      this.analyser = null;
    }

    const recorder = this.mediaRecorder;
    const stream = this.audioStream;
    const duration = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));
    const capturedLevels = [...this.rawLevels];

    this.mediaRecorder = null;
    this.audioStream = null;

    if (!recorder || recorder.state === "inactive") {
      stream?.getTracks().forEach((track) => track.stop());
      return null;
    }

    return new Promise((resolve) => {
      recorder.onstop = async () => {
        stream?.getTracks().forEach((track) => track.stop());

        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(this.chunks, { type: mimeType });

        if (blob.size === 0) {
          resolve(null);
          return;
        }

        // Convert blob to base64 Data URL for instant messaging relay
        const reader = new FileReader();
        reader.onloadend = () => {
          const audioUrl = reader.result as string;

          // Downsample captured levels into exactly 30 waveform bars
          const waveform = processWaveform(capturedLevels, 30);

          resolve({
            audioUrl,
            duration,
            waveform,
            mimeType,
          });
        };
        reader.readAsDataURL(blob);
      };

      recorder.stop();
    });
  }

  cancel() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.tickIntervalId) {
      clearInterval(this.tickIntervalId);
      this.tickIntervalId = null;
    }

    if (this.audioContext && this.audioContext.state !== "closed") {
      void this.audioContext.close();
      this.audioContext = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.onstop = null;
      this.mediaRecorder.stop();
    }
    this.audioStream?.getTracks().forEach((t) => t.stop());

    this.mediaRecorder = null;
    this.audioStream = null;
    this.chunks = [];
    this.rawLevels = [];
  }
}

function processWaveform(raw: number[], barCount: number): number[] {
  if (raw.length === 0) {
    return Array.from({ length: barCount }, () => 0.2 + Math.random() * 0.4);
  }

  const result: number[] = [];
  const step = raw.length / barCount;

  for (let i = 0; i < barCount; i++) {
    const start = Math.floor(i * step);
    const end = Math.floor((i + 1) * step);
    let max = 0.15;
    for (let j = start; j < end && j < raw.length; j++) {
      const val = raw[j];
      if (val !== undefined && val > max) max = val;
    }
    result.push(Math.round(Math.min(1.0, Math.max(0.15, max)) * 100) / 100);
  }

  return result;
}

export const voiceRecorder = new VoiceRecorder();
