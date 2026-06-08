import { describe, expect, it } from 'vitest';
import {
  getPracticeTaskById,
  getPracticeTaskTypeLabel,
  listPracticeModules,
  listPracticeTasks,
  listPracticeTasksByModule,
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

  it('groups tasks by practice module', () => {
    expect(listPracticeModules()).toEqual([
      expect.objectContaining({
        id: 'scripted-dialogue',
        title: '情境对话',
        taskCount: 2
      }),
      expect.objectContaining({
        id: 'picture-description',
        title: '看图描述',
        taskCount: 2
      })
    ]);

    expect(listPracticeTasksByModule('scripted-dialogue').map((task) => task.id)).toEqual([
      'dialogue-coffee-order',
      'dialogue-hotel-checkin'
    ]);
    expect(listPracticeTasksByModule('picture-description').map((task) => task.id)).toEqual([
      'picture-office-whiteboard',
      'picture-park-weekend'
    ]);
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
    expect(dialogueTask?.turns).toEqual([
      expect.objectContaining({
        id: 'coffee-order-drink',
        npcLine: 'Hi there. What can I get for you today?',
        expectedSlots: ['drink']
      }),
      expect.objectContaining({
        id: 'coffee-order-size',
        npcLine: 'Sure. What size would you like?',
        expectedSlots: ['size']
      }),
      expect.objectContaining({
        id: 'coffee-order-takeaway',
        npcLine: 'No problem. Would you like it for here or to go?',
        expectedSlots: ['takeaway']
      })
    ]);

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
