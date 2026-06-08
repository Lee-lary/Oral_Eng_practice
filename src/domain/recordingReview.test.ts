import { describe, expect, it } from 'vitest';
import { getPracticeTaskById } from './taskCatalog';
import { buildLocalReviewSummary } from './recordingReview';

describe('buildLocalReviewSummary', () => {
  it('builds scripted dialogue review guidance from task structure and duration', () => {
    const task = getPracticeTaskById('dialogue-coffee-order');
    if (!task || task.type !== 'scripted-dialogue') {
      throw new Error('Expected scripted dialogue task fixture.');
    }

    const summary = buildLocalReviewSummary(task, 42_000);

    expect(summary).toMatchObject({
      source: 'local-rules',
      durationBand: 'on-target',
      durationLabel: '节奏合适',
      targetDurationSec: 45
    });
    expect(summary.checklist).toEqual(
      expect.arrayContaining([
        '覆盖 3 个回应点',
        '按 NPC 轮次推进对话',
        `确认用户目标：${task.userGoal}`
      ])
    );
    expect(summary.retryTip).toContain('下一轮继续按 NPC 轮次推进');
  });

  it('marks short picture descriptions and asks for the full description structure', () => {
    const task = getPracticeTaskById('picture-office-whiteboard');
    if (!task || task.type !== 'picture-description') {
      throw new Error('Expected picture description task fixture.');
    }

    const summary = buildLocalReviewSummary(task, 20_000);

    expect(summary).toMatchObject({
      source: 'local-rules',
      durationBand: 'too-short',
      durationLabel: '时长偏短',
      targetDurationSec: 60
    });
    expect(summary.checklist).toEqual(['总述画面', '描述至少 3 个细节', '补充合理推测']);
    expect(summary.retryTip).toBe('下一轮先按“总述-细节-推测”说满 60 秒。');
  });
});
