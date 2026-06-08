import type { RecordingDurationBand, RecordingReviewSummary } from './practice';
import type { PracticeTask } from './taskCatalog';

function getDurationBand(durationMs: number, targetDurationSec: number): RecordingDurationBand {
  const actualSeconds = Math.max(0, durationMs) / 1000;

  if (actualSeconds < targetDurationSec * 0.7) {
    return 'too-short';
  }

  if (actualSeconds > targetDurationSec * 1.4) {
    return 'too-long';
  }

  return 'on-target';
}

function getDurationLabel(durationBand: RecordingDurationBand): string {
  if (durationBand === 'too-short') {
    return '时长偏短';
  }

  if (durationBand === 'too-long') {
    return '时长偏长';
  }

  return '节奏合适';
}

function buildRetryTip(task: PracticeTask, durationBand: RecordingDurationBand): string {
  if (task.type === 'picture-description') {
    if (durationBand === 'too-short') {
      return `下一轮先按“总述-细节-推测”说满 ${task.durationSec} 秒。`;
    }

    if (durationBand === 'too-long') {
      return '下一轮先给一句总述，再挑最关键的 3 个细节说。';
    }

    return '下一轮继续保持“总述-细节-推测”的结构。';
  }

  if (durationBand === 'too-short') {
    return '下一轮把每个回应点都扩展成完整句子。';
  }

  if (durationBand === 'too-long') {
    return '下一轮保持回应完整，但减少重复铺垫。';
  }

  return '下一轮继续按 NPC 轮次推进，并把回应说完整。';
}

export function buildLocalReviewSummary(task: PracticeTask, durationMs: number): RecordingReviewSummary {
  const durationBand = getDurationBand(durationMs, task.durationSec);

  if (task.type === 'picture-description') {
    return {
      source: 'local-rules',
      durationBand,
      durationLabel: getDurationLabel(durationBand),
      targetDurationSec: task.durationSec,
      checklist: ['总述画面', '描述至少 3 个细节', '补充合理推测'],
      retryTip: buildRetryTip(task, durationBand)
    };
  }

  return {
    source: 'local-rules',
    durationBand,
    durationLabel: getDurationLabel(durationBand),
    targetDurationSec: task.durationSec,
    checklist: [
      `覆盖 ${task.userPrompts.length} 个回应点`,
      '按 NPC 轮次推进对话',
      `确认用户目标：${task.userGoal}`
    ],
    retryTip: buildRetryTip(task, durationBand)
  };
}
