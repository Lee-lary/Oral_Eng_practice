import { describe, expect, it } from 'vitest';
import {
  getPracticeTaskById,
  getPracticeTaskTypeLabel,
  listPracticeTasks,
  listPracticeTaskTypes
} from './taskCatalog';

describe('taskCatalog', () => {
  it('lists scripted dialogue and picture description tasks', () => {
    const tasks = listPracticeTasks();

    expect(tasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'dialogue-coffee-order',
          title: '咖啡店点单',
          type: 'scripted-dialogue'
        }),
        expect.objectContaining({
          id: 'picture-office-whiteboard',
          title: '办公室白板讨论',
          type: 'picture-description'
        })
      ])
    );
    expect(tasks.filter((task) => task.type === 'scripted-dialogue')).toHaveLength(2);
    expect(tasks.filter((task) => task.type === 'picture-description')).toHaveLength(2);
  });

  it('finds tasks by id', () => {
    const dialogueTask = getPracticeTaskById('dialogue-coffee-order');
    const pictureTask = getPracticeTaskById('picture-office-whiteboard');

    expect(dialogueTask?.type).toBe('scripted-dialogue');
    expect(pictureTask?.type).toBe('picture-description');
    if (dialogueTask?.type !== 'scripted-dialogue' || pictureTask?.type !== 'picture-description') {
      throw new Error('Task catalog returned unexpected task types.');
    }

    expect(dialogueTask).toEqual(
      expect.objectContaining({
        id: 'dialogue-coffee-order',
        title: '咖啡店点单',
        type: 'scripted-dialogue',
        userGoal: '点一杯少糖拿铁，并确认是否可以外带。'
      })
    );
    expect(dialogueTask?.npcLines).toContain('Hi there. What can I get for you today?');
    expect(dialogueTask?.userPrompts).toContain('说明你想要的饮品和杯型。');

    expect(pictureTask?.descriptionSteps).toEqual([
      '先用一句话总述画面。',
      '再描述三处可见细节。',
      '最后做一个合理推测。'
    ]);
    expect(getPracticeTaskById('missing-task')).toBeNull();
  });

  it('lists task types and labels', () => {
    expect(listPracticeTaskTypes()).toEqual([
      'free-recording',
      'starter',
      'scripted-dialogue',
      'picture-description'
    ]);
    expect(getPracticeTaskTypeLabel('free-recording')).toBe('自由录音');
    expect(getPracticeTaskTypeLabel('starter')).toBe('句型启动');
    expect(getPracticeTaskTypeLabel('scripted-dialogue')).toBe('情境对话');
    expect(getPracticeTaskTypeLabel('picture-description')).toBe('看图描述');
  });
});
