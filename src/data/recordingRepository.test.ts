import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { appDb } from './db';
import { createRecording, deleteRecording, listRecordings } from './recordingRepository';

describe('recordingRepository', () => {
  afterEach(async () => {
    await appDb.recordings.clear();
  });

  it('creates recordings and lists them newest first', async () => {
    const olderBlob = new Blob(['older'], { type: 'audio/webm' });
    const newerBlob = new Blob(['newer'], { type: 'audio/webm' });

    const older = await createRecording({
      taskType: 'free-recording',
      title: 'First attempt',
      blob: olderBlob,
      mimeType: olderBlob.type,
      durationMs: 12_000,
      createdAt: '2026-06-05T10:00:00.000Z'
    });
    const newer = await createRecording({
      taskType: 'scripted-dialogue',
      taskId: 'dialogue-coffee-order',
      title: 'Second attempt',
      blob: newerBlob,
      mimeType: newerBlob.type,
      durationMs: 8_000,
      createdAt: '2026-06-05T10:01:00.000Z'
    });

    const recordings = await listRecordings();

    expect(recordings.map((recording) => recording.id)).toEqual([newer.id, older.id]);
    expect(recordings).toMatchObject([
      {
        taskType: 'scripted-dialogue',
        taskId: 'dialogue-coffee-order',
        title: 'Second attempt',
        mimeType: 'audio/webm',
        durationMs: 8_000,
        createdAt: '2026-06-05T10:01:00.000Z'
      },
      {
        taskType: 'free-recording',
        title: 'First attempt',
        mimeType: 'audio/webm',
        durationMs: 12_000,
        createdAt: '2026-06-05T10:00:00.000Z'
      }
    ]);
  });

  it('deletes a recording by id', async () => {
    const blob = new Blob(['audio'], { type: 'audio/webm' });
    const recording = await createRecording({
      taskType: 'picture-description',
      title: 'Picture practice',
      blob,
      mimeType: blob.type,
      durationMs: 34_000,
      createdAt: '2026-06-05T10:00:00.000Z'
    });

    await deleteRecording(recording.id);

    await expect(listRecordings()).resolves.toEqual([]);
  });

  it('persists local review summaries with recordings', async () => {
    const blob = new Blob(['audio'], { type: 'audio/webm' });

    await createRecording({
      taskType: 'scripted-dialogue',
      taskId: 'dialogue-coffee-order',
      title: 'Coffee order',
      blob,
      mimeType: blob.type,
      durationMs: 45_000,
      reviewSummary: {
        source: 'local-rules',
        durationBand: 'on-target',
        durationLabel: '节奏合适',
        targetDurationSec: 45,
        checklist: ['覆盖 3 个回应点'],
        retryTip: '下一轮继续按 NPC 轮次推进。'
      },
      createdAt: '2026-06-05T10:00:00.000Z'
    });

    await expect(listRecordings()).resolves.toEqual([
      expect.objectContaining({
        taskId: 'dialogue-coffee-order',
        reviewSummary: expect.objectContaining({
          source: 'local-rules',
          durationBand: 'on-target',
          checklist: ['覆盖 3 个回应点']
        })
      })
    ]);
  });

  it('persists scripted dialogue turn metadata with recordings', async () => {
    const blob = new Blob(['audio'], { type: 'audio/webm' });

    await createRecording({
      taskType: 'scripted-dialogue',
      taskId: 'dialogue-coffee-order',
      title: 'Coffee order',
      blob,
      mimeType: blob.type,
      durationMs: 18_000,
      dialogueTurn: {
        turnId: 'coffee-order-drink',
        turnIndex: 0,
        totalTurns: 3,
        npcLine: 'Hi there. What can I get for you today?',
        userPrompt: '说明你想要的饮品和杯型。',
        expectedSlots: ['drink']
      },
      createdAt: '2026-06-05T10:00:00.000Z'
    });

    await expect(listRecordings()).resolves.toEqual([
      expect.objectContaining({
        taskType: 'scripted-dialogue',
        taskId: 'dialogue-coffee-order',
        dialogueTurn: expect.objectContaining({
          turnId: 'coffee-order-drink',
          turnIndex: 0,
          totalTurns: 3,
          expectedSlots: ['drink']
        })
      })
    ]);
  });
});
