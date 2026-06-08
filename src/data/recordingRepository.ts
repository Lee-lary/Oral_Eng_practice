import { appDb } from './db';
import { createId, nowIso, type NewRecordingInput, type RecordingRecord } from '../domain/practice';

const DEFAULT_TITLE = '未命名练习';

export async function createRecording(input: NewRecordingInput): Promise<RecordingRecord> {
  const recording: RecordingRecord = {
    id: createId('recording'),
    taskType: input.taskType,
    taskId: input.taskId,
    title: input.title.trim() || DEFAULT_TITLE,
    blob: input.blob,
    mimeType: input.mimeType,
    durationMs: input.durationMs,
    createdAt: input.createdAt ?? nowIso()
  };

  await appDb.recordings.add(recording);

  return recording;
}

export function listRecordings(): Promise<RecordingRecord[]> {
  return appDb.recordings.orderBy('createdAt').reverse().toArray();
}

export function deleteRecording(id: string): Promise<void> {
  return appDb.recordings.delete(id);
}
