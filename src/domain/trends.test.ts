import { describe, expect, it } from 'vitest';
import type { RecordingRecord } from './practice';
import { buildSevenDayTrend } from './trends';

function recording(overrides: Partial<RecordingRecord>): RecordingRecord {
  return {
    id: overrides.id ?? 'rec',
    taskType: overrides.taskType ?? 'free-recording',
    title: overrides.title ?? 'Practice',
    blob: overrides.blob ?? new Blob(['audio'], { type: 'audio/webm' }),
    mimeType: overrides.mimeType ?? 'audio/webm',
    durationMs: overrides.durationMs ?? 60_000,
    createdAt: overrides.createdAt ?? '2026-06-09T10:00:00.000Z',
    ...overrides
  };
}

describe('trends', () => {
  it('builds a 7 day trend from recordings with local fluency metrics', () => {
    const trend = buildSevenDayTrend(
      [
        recording({
          id: 'rec-1',
          durationMs: 60_000,
          createdAt: '2026-06-07T10:00:00.000Z',
          fluencyMetrics: {
            source: 'local-vad',
            durationMs: 60_000,
            voicedMs: 42_000,
            startDelayMs: 900,
            pauseRatio: 0.3,
            longPauseCount: 2,
            longPauseMs: 1_600
          }
        }),
        recording({
          id: 'rec-2',
          durationMs: 30_000,
          createdAt: '2026-06-07T11:00:00.000Z',
          fluencyMetrics: {
            source: 'local-vad',
            durationMs: 30_000,
            voicedMs: 24_000,
            startDelayMs: 300,
            pauseRatio: 0.2,
            longPauseCount: 1,
            longPauseMs: 800
          }
        }),
        recording({
          id: 'rec-3',
          durationMs: 45_000,
          createdAt: '2026-06-09T09:00:00.000Z',
          fluencyMetrics: {
            source: 'local-vad',
            durationMs: 45_000,
            voicedMs: 30_000,
            startDelayMs: 600,
            pauseRatio: 0.33,
            longPauseCount: 3,
            longPauseMs: 2_400
          }
        })
      ],
      new Date('2026-06-09T12:00:00.000Z')
    );

    expect(trend).toHaveLength(7);
    expect(trend.map((day) => day.date)).toEqual([
      '2026-06-03',
      '2026-06-04',
      '2026-06-05',
      '2026-06-06',
      '2026-06-07',
      '2026-06-08',
      '2026-06-09'
    ]);
    expect(trend[4]).toEqual({
      date: '2026-06-07',
      recordingCount: 2,
      totalDurationMs: 90_000,
      averagePauseRatio: 0.25,
      averageStartDelayMs: 600,
      longPauseCount: 3
    });
    expect(trend[6]).toEqual({
      date: '2026-06-09',
      recordingCount: 1,
      totalDurationMs: 45_000,
      averagePauseRatio: 0.33,
      averageStartDelayMs: 600,
      longPauseCount: 3
    });
  });
});
