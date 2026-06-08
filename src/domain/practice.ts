export type PracticeTaskType = 'free-recording' | 'starter' | 'scripted-dialogue' | 'picture-description';

export interface RecordingRecord {
  id: string;
  taskType: PracticeTaskType;
  taskId?: string;
  title: string;
  blob: Blob;
  mimeType: string;
  durationMs: number;
  dialogueTurn?: ScriptedDialogueTurnRecord;
  reviewSummary?: RecordingReviewSummary;
  createdAt: string;
}

export interface ScriptedDialogueTurnRecord {
  turnId: string;
  turnIndex: number;
  totalTurns: number;
  npcLine: string;
  userPrompt: string;
  expectedSlots: string[];
}

export type RecordingDurationBand = 'too-short' | 'on-target' | 'too-long';

export interface RecordingReviewSummary {
  source: 'local-rules';
  durationBand: RecordingDurationBand;
  durationLabel: string;
  targetDurationSec?: number;
  checklist: string[];
  retryTip: string;
}

export type NewRecordingInput = Omit<RecordingRecord, 'id' | 'createdAt'> & {
  createdAt?: string;
};

export function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10).padEnd(8, '0');
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(Math.max(0, ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
