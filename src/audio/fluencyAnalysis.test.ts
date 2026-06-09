import { describe, expect, it } from 'vitest';
import { calculateFluencyMetricsFromFrames, type EnergyFrame } from './fluencyAnalysis';

function frame(startMs: number, endMs: number, rms: number): EnergyFrame {
  return { startMs, endMs, rms };
}

describe('fluencyAnalysis', () => {
  it('calculates start delay, voiced time, long pauses, and pause ratio from energy frames', () => {
    const metrics = calculateFluencyMetricsFromFrames(
      [
        frame(0, 400, 0.01),
        frame(400, 800, 0.01),
        frame(800, 1_300, 0.08),
        frame(1_300, 1_800, 0.08),
        frame(1_800, 2_200, 0.01),
        frame(2_200, 2_600, 0.01),
        frame(2_600, 3_300, 0.09),
        frame(3_300, 4_000, 0.09),
        frame(4_000, 5_000, 0.01)
      ],
      5_000
    );

    expect(metrics).toEqual({
      source: 'local-vad',
      durationMs: 5_000,
      voicedMs: 2_400,
      startDelayMs: 800,
      pauseRatio: 0.52,
      longPauseCount: 1,
      longPauseMs: 800
    });
  });

  it('handles recordings with no detected voice', () => {
    const metrics = calculateFluencyMetricsFromFrames(
      [frame(0, 1_000, 0.01), frame(1_000, 2_000, 0.01), frame(2_000, 3_000, 0.01)],
      3_000
    );

    expect(metrics).toEqual({
      source: 'local-vad',
      durationMs: 3_000,
      voicedMs: 0,
      startDelayMs: 3_000,
      pauseRatio: 1,
      longPauseCount: 0,
      longPauseMs: 0
    });
  });
});
