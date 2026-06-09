import type { RecordingRecord } from './practice';

export interface DailyTrend {
  date: string;
  recordingCount: number;
  totalDurationMs: number;
  averagePauseRatio: number | null;
  averageStartDelayMs: number | null;
  longPauseCount: number;
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function buildSevenDayTrend(recordings: RecordingRecord[], today = new Date()): DailyTrend[] {
  const todayStart = startOfLocalDay(today);
  const dayMap = new Map<string, RecordingRecord[]>();

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(todayStart);
    date.setDate(todayStart.getDate() - offset);
    dayMap.set(toDateKey(date), []);
  }

  for (const recording of recordings) {
    const dateKey = toDateKey(new Date(recording.createdAt));
    const dayRecordings = dayMap.get(dateKey);
    if (dayRecordings) {
      dayRecordings.push(recording);
    }
  }

  return [...dayMap.entries()].map(([date, dayRecordings]) => {
    const metricRecordings = dayRecordings.filter((recording) => recording.fluencyMetrics);
    const recordingCount = dayRecordings.length;
    const totalDurationMs = dayRecordings.reduce((total, recording) => total + recording.durationMs, 0);
    const averagePauseRatio =
      metricRecordings.length > 0
        ? roundTo(
            metricRecordings.reduce((total, recording) => total + recording.fluencyMetrics!.pauseRatio, 0) /
              metricRecordings.length,
            2
          )
        : null;
    const averageStartDelayMs =
      metricRecordings.length > 0
        ? Math.round(
            metricRecordings.reduce((total, recording) => total + recording.fluencyMetrics!.startDelayMs, 0) /
              metricRecordings.length
          )
        : null;
    const longPauseCount = metricRecordings.reduce(
      (total, recording) => total + recording.fluencyMetrics!.longPauseCount,
      0
    );

    return {
      date,
      recordingCount,
      totalDurationMs,
      averagePauseRatio,
      averageStartDelayMs,
      longPauseCount
    };
  });
}
