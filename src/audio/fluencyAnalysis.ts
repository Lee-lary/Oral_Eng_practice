import type { FluencyMetrics } from '../domain/practice';

export interface EnergyFrame {
  startMs: number;
  endMs: number;
  rms: number;
}

interface VoiceSegment {
  startMs: number;
  endMs: number;
}

type AudioContextConstructor = new (contextOptions?: AudioContextOptions) => AudioContext;

export interface FluencyAnalysisOptions {
  frameMs?: number;
  voicedThreshold?: number;
  longPauseThresholdMs?: number;
}

const DEFAULT_FRAME_MS = 50;
const DEFAULT_VOICED_THRESHOLD = 0.03;
const DEFAULT_LONG_PAUSE_THRESHOLD_MS = 700;

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function createVoiceSegments(frames: EnergyFrame[], voicedThreshold: number): VoiceSegment[] {
  const segments: VoiceSegment[] = [];

  for (const frame of frames) {
    if (frame.rms < voicedThreshold) {
      continue;
    }

    const previous = segments[segments.length - 1];
    if (previous && frame.startMs <= previous.endMs) {
      previous.endMs = Math.max(previous.endMs, frame.endMs);
      continue;
    }

    segments.push({
      startMs: frame.startMs,
      endMs: frame.endMs
    });
  }

  return segments;
}

export function calculateFluencyMetricsFromFrames(
  frames: EnergyFrame[],
  durationMs: number,
  options: FluencyAnalysisOptions = {}
): FluencyMetrics {
  const safeDurationMs = Math.max(0, Math.round(durationMs));
  const voicedThreshold = options.voicedThreshold ?? DEFAULT_VOICED_THRESHOLD;
  const longPauseThresholdMs = options.longPauseThresholdMs ?? DEFAULT_LONG_PAUSE_THRESHOLD_MS;
  const orderedFrames = [...frames].sort((first, second) => first.startMs - second.startMs);
  const segments = createVoiceSegments(orderedFrames, voicedThreshold);
  const voicedMs = Math.round(
    segments.reduce((total, segment) => total + Math.max(0, segment.endMs - segment.startMs), 0)
  );

  let longPauseCount = 0;
  let longPauseMs = 0;
  for (let index = 1; index < segments.length; index += 1) {
    const pauseMs = Math.max(0, segments[index].startMs - segments[index - 1].endMs);
    if (pauseMs >= longPauseThresholdMs) {
      longPauseCount += 1;
      longPauseMs += pauseMs;
    }
  }

  const pauseMs = Math.max(0, safeDurationMs - voicedMs);

  return {
    source: 'local-vad',
    durationMs: safeDurationMs,
    voicedMs,
    startDelayMs: segments[0] ? Math.round(segments[0].startMs) : safeDurationMs,
    pauseRatio: safeDurationMs > 0 ? roundTo(pauseMs / safeDurationMs, 2) : 0,
    longPauseCount,
    longPauseMs: Math.round(longPauseMs)
  };
}

function getAudioContextConstructor(): AudioContextConstructor {
  const audioWindow = window as unknown as {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  const AudioContextConstructor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;

  if (!AudioContextConstructor) {
    throw new Error('Web Audio API is not available in this browser.');
  }

  return AudioContextConstructor;
}

function extractEnergyFrames(audioBuffer: AudioBuffer, frameMs: number): EnergyFrame[] {
  const frames: EnergyFrame[] = [];
  const frameSampleCount = Math.max(1, Math.round((audioBuffer.sampleRate * frameMs) / 1_000));
  const channelData = audioBuffer.getChannelData(0);

  for (let startSample = 0; startSample < channelData.length; startSample += frameSampleCount) {
    const endSample = Math.min(channelData.length, startSample + frameSampleCount);
    let squareTotal = 0;

    for (let sampleIndex = startSample; sampleIndex < endSample; sampleIndex += 1) {
      squareTotal += channelData[sampleIndex] ** 2;
    }

    const sampleCount = Math.max(1, endSample - startSample);
    frames.push({
      startMs: (startSample / audioBuffer.sampleRate) * 1_000,
      endMs: (endSample / audioBuffer.sampleRate) * 1_000,
      rms: Math.sqrt(squareTotal / sampleCount)
    });
  }

  return frames;
}

export async function analyzeRecordingFluency(
  blob: Blob,
  options: FluencyAnalysisOptions = {}
): Promise<FluencyMetrics> {
  const AudioContextConstructor = getAudioContextConstructor();
  const audioContext = new AudioContextConstructor();

  try {
    const audioBuffer = await audioContext.decodeAudioData(await blob.arrayBuffer());
    const frames = extractEnergyFrames(audioBuffer, options.frameMs ?? DEFAULT_FRAME_MS);
    return calculateFluencyMetricsFromFrames(frames, audioBuffer.duration * 1_000, options);
  } finally {
    await audioContext.close();
  }
}
