import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TrendPage from './TrendPage';

const mocks = vi.hoisted(() => ({
  listRecordings: vi.fn()
}));

vi.mock('../data/recordingRepository', () => ({
  listRecordings: mocks.listRecordings
}));

function createRecording(createdAt: string, pauseRatio: number, startDelayMs: number, longPauseCount: number) {
  return {
    id: createdAt,
    taskType: 'scripted-dialogue',
    title: 'Coffee order',
    blob: new Blob(['audio'], { type: 'audio/webm' }),
    mimeType: 'audio/webm',
    durationMs: 60_000,
    createdAt,
    fluencyMetrics: {
      source: 'local-vad',
      durationMs: 60_000,
      voicedMs: 42_000,
      startDelayMs,
      pauseRatio,
      longPauseCount,
      longPauseMs: longPauseCount * 800
    }
  };
}

describe('TrendPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders recent 7 day fluency trend', async () => {
    mocks.listRecordings.mockResolvedValue([
      createRecording('2026-06-07T10:00:00.000Z', 0.3, 900, 2),
      createRecording('2026-06-09T10:00:00.000Z', 0.2, 500, 1)
    ]);

    render(<TrendPage today={new Date('2026-06-09T12:00:00.000Z')} />);

    expect(await screen.findByRole('heading', { name: '趋势' })).toBeInTheDocument();
    expect(screen.getByText('最近 7 天')).toBeInTheDocument();
    expect(screen.getByText('2026-06-07')).toBeInTheDocument();
    expect(screen.getByText('2026-06-09')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
    expect(screen.getByText('0.9 秒')).toBeInTheDocument();
    expect(screen.getByText('2 次')).toBeInTheDocument();
  });

  it('shows an empty state before any recording has metrics', async () => {
    mocks.listRecordings.mockResolvedValue([]);

    render(<TrendPage today={new Date('2026-06-09T12:00:00.000Z')} />);

    expect(await screen.findByText('还没有可用的流利度指标')).toBeInTheDocument();
  });
});
