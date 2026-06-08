import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chooseSupportedMimeType, startBrowserRecording } from './mediaRecorderService';

class FakeTrack {
  stop = vi.fn();
}

class FakeMediaRecorder {
  static instances: FakeMediaRecorder[] = [];
  static isTypeSupported = vi.fn((mimeType: string) => mimeType === 'audio/webm');
  static failOnStart = false;

  mimeType: string;
  state: RecordingState = 'inactive';
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onstop: ((event: Event) => void) | null = null;
  start = vi.fn(() => {
    if (FakeMediaRecorder.failOnStart) {
      throw new Error('start failed');
    }
    this.state = 'recording';
  });
  stop = vi.fn(() => {
    this.state = 'inactive';
  });

  constructor(_stream: MediaStream, options?: MediaRecorderOptions) {
    this.mimeType = options?.mimeType ?? '';
    FakeMediaRecorder.instances.push(this);
  }

  finish() {
    this.ondataavailable?.({ data: new Blob(['audio'], { type: this.mimeType }) } as BlobEvent);
    this.onstop?.(new Event('stop'));
  }
}

function createMediaStream(track = new FakeTrack()) {
  return {
    stream: {
      getTracks: () => [track]
    } as unknown as MediaStream,
    track
  };
}

function installMediaDevices(stream: MediaStream) {
  const getUserMedia = vi.fn().mockResolvedValue(stream);
  vi.stubGlobal('navigator', {
    mediaDevices: {
      getUserMedia
    }
  });
  return getUserMedia;
}

describe('chooseSupportedMimeType', () => {
  it('returns the first supported MIME type', () => {
    const isTypeSupported = vi.fn((mimeType: string) => mimeType === 'audio/mp4');

    const mimeType = chooseSupportedMimeType(isTypeSupported);

    expect(mimeType).toBe('audio/mp4');
    expect(isTypeSupported).toHaveBeenCalledTimes(2);
    expect(isTypeSupported).toHaveBeenNthCalledWith(1, 'audio/webm;codecs=opus');
    expect(isTypeSupported).toHaveBeenNthCalledWith(2, 'audio/mp4');
  });

  it('returns an empty string when no preferred type is supported', () => {
    const isTypeSupported = vi.fn(() => false);

    const mimeType = chooseSupportedMimeType(isTypeSupported);

    expect(mimeType).toBe('');
  });
});

describe('startBrowserRecording', () => {
  beforeEach(() => {
    FakeMediaRecorder.instances = [];
    FakeMediaRecorder.isTypeSupported.mockClear();
    FakeMediaRecorder.failOnStart = false;
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder as unknown as typeof MediaRecorder);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('resolves a finished recording and stops tracks when recording stops', async () => {
    const { stream, track } = createMediaStream();
    const getUserMedia = installMediaDevices(stream);
    vi.useFakeTimers();
    vi.setSystemTime(1_000);

    const recording = await startBrowserRecording();
    const stopPromise = recording.stop();
    vi.setSystemTime(1_750);
    FakeMediaRecorder.instances[0].finish();
    const finished = await stopPromise;

    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(FakeMediaRecorder.instances[0].start).toHaveBeenCalledWith(250);
    expect(FakeMediaRecorder.instances[0].stop).toHaveBeenCalledTimes(1);
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(finished.durationMs).toBe(750);
    expect(finished.mimeType).toBe('audio/webm');
    expect(finished.blob.type).toBe('audio/webm');
    expect(finished.blob.size).toBeGreaterThan(0);
  });

  it('returns the same stop promise for concurrent stop calls', async () => {
    const { stream, track } = createMediaStream();
    installMediaDevices(stream);

    const recording = await startBrowserRecording();
    const firstStop = recording.stop();
    const secondStop = recording.stop();

    expect(secondStop).toBe(firstStop);
    expect(FakeMediaRecorder.instances[0].stop).toHaveBeenCalledTimes(1);

    FakeMediaRecorder.instances[0].finish();
    await expect(firstStop).resolves.toMatchObject({ mimeType: 'audio/webm' });
    expect(track.stop).toHaveBeenCalledTimes(1);
  });

  it('cleans up tracks when recorder setup fails after microphone access succeeds', async () => {
    const { stream, track } = createMediaStream();
    installMediaDevices(stream);
    FakeMediaRecorder.failOnStart = true;

    await expect(startBrowserRecording()).rejects.toThrow('start failed');

    expect(track.stop).toHaveBeenCalledTimes(1);
  });

  it('fails cleanly when MediaRecorder is unavailable', async () => {
    const { stream, track } = createMediaStream();
    const getUserMedia = installMediaDevices(stream);
    vi.stubGlobal('MediaRecorder', undefined);

    await expect(startBrowserRecording()).rejects.toThrow('当前浏览器不支持麦克风录音。');

    expect(getUserMedia).not.toHaveBeenCalled();
    expect(track.stop).not.toHaveBeenCalled();
  });
});
