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
      taskType: 'starter',
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
        taskType: 'starter',
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
});
