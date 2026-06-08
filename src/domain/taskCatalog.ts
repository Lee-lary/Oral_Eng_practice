import type { PracticeTaskType } from './practice';

export type PracticeModuleId = 'scripted-dialogue' | 'picture-description';

interface BasePracticeTask {
  id: string;
  title: string;
  difficulty: 'A2-B1' | 'B1-B2';
  durationSec: number;
  usefulExpressions: string[];
}

export interface ScriptedDialogueTask extends BasePracticeTask {
  type: 'scripted-dialogue';
  scenario: string;
  userGoal: string;
  npcLines: string[];
  userPrompts: string[];
  turns: ScriptedDialogueTurn[];
}

export interface ScriptedDialogueTurn {
  id: string;
  npcLine: string;
  userPrompt: string;
  expectedSlots: string[];
}

export interface PictureDescriptionTask extends BasePracticeTask {
  type: 'picture-description';
  imageAlt: string;
  scene: string;
  descriptionSteps: string[];
}

export type PracticeTask = ScriptedDialogueTask | PictureDescriptionTask;

export interface PracticeModule {
  id: PracticeModuleId;
  title: string;
  summary: string;
  taskCount: number;
}

const PRACTICE_TASKS: PracticeTask[] = [
  {
    id: 'dialogue-coffee-order',
    title: '咖啡店点单',
    type: 'scripted-dialogue',
    difficulty: 'A2-B1',
    durationSec: 45,
    scenario: '你在咖啡店柜台前，店员正在等待你点单。',
    userGoal: '点一杯少糖拿铁，并确认是否可以外带。',
    npcLines: [
      'Hi there. What can I get for you today?',
      'Sure. What size would you like?',
      'No problem. Would you like it for here or to go?'
    ],
    userPrompts: ['说明你想要的饮品和杯型。', '提出少糖要求。', '确认是否可以外带。'],
    turns: [
      {
        id: 'coffee-order-drink',
        npcLine: 'Hi there. What can I get for you today?',
        userPrompt: '说明你想要的饮品和杯型。',
        expectedSlots: ['drink']
      },
      {
        id: 'coffee-order-size',
        npcLine: 'Sure. What size would you like?',
        userPrompt: '提出少糖要求。',
        expectedSlots: ['size']
      },
      {
        id: 'coffee-order-takeaway',
        npcLine: 'No problem. Would you like it for here or to go?',
        userPrompt: '确认是否可以外带。',
        expectedSlots: ['takeaway']
      }
    ],
    usefulExpressions: [
      'Could I get a medium latte, please?',
      'Could you make it less sweet?',
      'Can I have it to go?'
    ]
  },
  {
    id: 'dialogue-hotel-checkin',
    title: '酒店入住登记',
    type: 'scripted-dialogue',
    difficulty: 'A2-B1',
    durationSec: 60,
    scenario: '你到达酒店前台，需要办理入住并确认早餐安排。',
    userGoal: '说明你有预订，确认房间和早餐时间。',
    npcLines: [
      'Good evening. Welcome to our hotel.',
      'May I have your name, please?',
      'Your room is ready. Breakfast is served from 7 to 10.'
    ],
    userPrompts: ['说明你想办理入住。', '提供姓名并提到预订。', '确认早餐时间和地点。'],
    turns: [
      {
        id: 'hotel-checkin-arrival',
        npcLine: 'Good evening. Welcome to our hotel.',
        userPrompt: '说明你想办理入住。',
        expectedSlots: ['checkin_intent']
      },
      {
        id: 'hotel-checkin-name',
        npcLine: 'May I have your name, please?',
        userPrompt: '提供姓名并提到预订。',
        expectedSlots: ['reservation_name']
      },
      {
        id: 'hotel-checkin-breakfast',
        npcLine: 'Your room is ready. Breakfast is served from 7 to 10.',
        userPrompt: '确认早餐时间和地点。',
        expectedSlots: ['breakfast_time', 'breakfast_place']
      }
    ],
    usefulExpressions: [
      'I have a reservation under the name...',
      'Could you confirm the breakfast time?',
      'Where is breakfast served?'
    ]
  },
  {
    id: 'picture-office-whiteboard',
    title: '办公室白板讨论',
    type: 'picture-description',
    difficulty: 'B1-B2',
    durationSec: 60,
    imageAlt: '几名同事站在办公室白板前讨论项目计划。',
    scene: '办公室会议',
    descriptionSteps: ['先用一句话总述画面。', '再描述三处可见细节。', '最后做一个合理推测。'],
    usefulExpressions: [
      'The picture shows a team discussing a project.',
      'In the background, there is a whiteboard with notes.',
      'It seems that they are planning the next steps.'
    ]
  },
  {
    id: 'picture-park-weekend',
    title: '周末公园活动',
    type: 'picture-description',
    difficulty: 'A2-B1',
    durationSec: 45,
    imageAlt: '周末公园里有人散步、运动，也有人坐着休息。',
    scene: '户外公园',
    descriptionSteps: ['先说画面地点和整体氛围。', '描述至少三个人的动作。', '补充你对天气或时间的推测。'],
    usefulExpressions: [
      'This looks like a relaxing weekend in a park.',
      'Some people are walking while others are exercising.',
      'The weather seems pleasant.'
    ]
  }
];

const TASK_TYPE_LABELS: Record<PracticeTaskType, string> = {
  'free-recording': '自由录音',
  starter: '句型启动',
  'scripted-dialogue': '情境对话',
  'picture-description': '看图描述'
};

const PRACTICE_MODULES: Omit<PracticeModule, 'taskCount'>[] = [
  {
    id: 'scripted-dialogue',
    title: '情境对话',
    summary: '用固定脚本轮次练习真实场景回应，适合训练开口和推进对话。'
  },
  {
    id: 'picture-description',
    title: '看图描述',
    summary: '根据画面线索组织连续表达，适合训练描述、推测和结构化输出。'
  }
];

function cloneTask(task: PracticeTask): PracticeTask {
  if (task.type === 'scripted-dialogue') {
    return {
      ...task,
      npcLines: [...task.npcLines],
      userPrompts: [...task.userPrompts],
      turns: task.turns.map((turn) => ({
        ...turn,
        expectedSlots: [...turn.expectedSlots]
      })),
      usefulExpressions: [...task.usefulExpressions]
    };
  }

  return {
    ...task,
    descriptionSteps: [...task.descriptionSteps],
    usefulExpressions: [...task.usefulExpressions]
  };
}

export function listPracticeTasks(): PracticeTask[] {
  return PRACTICE_TASKS.map(cloneTask);
}

export function listPracticeModules(): PracticeModule[] {
  return PRACTICE_MODULES.map((module) => ({
    ...module,
    taskCount: PRACTICE_TASKS.filter((task) => task.type === module.id).length
  }));
}

export function listPracticeTasksByModule(moduleId: PracticeModuleId): PracticeTask[] {
  return PRACTICE_TASKS.filter((task) => task.type === moduleId).map(cloneTask);
}

export function getPracticeTaskById(id: string): PracticeTask | null {
  const task = PRACTICE_TASKS.find((nextTask) => nextTask.id === id);
  return task ? cloneTask(task) : null;
}

export function listPracticeTaskTypes(): PracticeTaskType[] {
  return ['free-recording', 'starter', 'scripted-dialogue', 'picture-description'];
}

export function getPracticeTaskTypeLabel(type: PracticeTaskType): string {
  return TASK_TYPE_LABELS[type];
}
