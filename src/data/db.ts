import Dexie, { type Table } from 'dexie';
import type { RecordingRecord } from '../domain/practice';

export class SpeakingTrainerDb extends Dexie {
  recordings!: Table<RecordingRecord, string>;

  constructor() {
    super('speaking-trainer');

    this.version(1).stores({
      recordings: 'id, createdAt, taskType'
    });
  }
}

export const appDb = new SpeakingTrainerDb();
