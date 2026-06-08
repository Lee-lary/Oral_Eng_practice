# Phase 2 Task System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first offline task-driven practice system with scripted dialogue, picture description, and review filtering.

**Architecture:** Keep Phase 2 fully client-side. Add local task definitions as typed TypeScript data, extend recording metadata with `taskId`, and let the existing recorder/save/history flow operate against selected practice tasks.

**Tech Stack:** React, TypeScript, Vite, Dexie/IndexedDB, Vitest, Testing Library.

---

## Scope

This plan implements:

- Local practice task model.
- Seed task pack for scripted dialogue and picture description.
- Practice page task selector and task-specific prompt display.
- Saving recordings with task type and task ID.
- Review page filters by task type.
- Documentation and development log updates.

This plan does not implement ASR, TTS, LLM, VAD, fluency scoring, cloud sync, or branch-based dialogue FSM.

## File Structure

- Modify: `src/domain/practice.ts`
  - Extend `PracticeTaskType` to include `scripted-dialogue`.
  - Add `taskId?: string` to recording metadata.
  - Add `PracticeTask` union types and display helpers.
- Create: `src/domain/taskCatalog.ts`
  - Store local Phase 2 task definitions.
  - Provide `listPracticeTasks()`, `getPracticeTaskById()`, and `listPracticeTaskTypes()`.
- Test: `src/domain/taskCatalog.test.ts`
  - Verify task catalog contains scripted dialogue and picture description tasks.
  - Verify lookup and display labels.
- Modify: `src/data/recordingRepository.test.ts`
  - Verify `taskId` persists when saving a recording.
- Modify: `src/pages/PracticePage.tsx`
  - Replace free-only practice copy with task selector.
  - Render task-specific prompts.
  - Save selected `taskType`, `taskId`, and task title.
- Modify: `src/pages/PracticePage.test.tsx`
  - Verify task cards render.
  - Verify selecting picture description changes prompt.
  - Verify saving includes selected task metadata.
- Modify: `src/pages/ReviewPage.tsx`
  - Add type filter controls.
  - Render task type label and filter result count.
- Modify: `src/pages/ReviewPage.test.tsx`
  - Verify filter controls.
  - Verify filtering hides unrelated recordings.
- Modify: `src/styles.css`
  - Add task selector, task detail, task media placeholder, and review filter styles.
- Modify: `README.md`
  - Add Phase 2 run and manual validation notes after implementation.
- Modify: `docs/task-10-development-log.md`
  - Record implementation and verification results.

## Task 1: Domain Model and Local Task Catalog

**Files:**
- Modify: `src/domain/practice.ts`
- Create: `src/domain/taskCatalog.ts`
- Test: `src/domain/taskCatalog.test.ts`
- Modify: `src/data/recordingRepository.test.ts`

- [ ] **Step 1: Write task catalog tests**

`src/domain/taskCatalog.test.ts` should assert:

```ts
import { describe, expect, it } from 'vitest';
import {
  getPracticeTaskById,
  getPracticeTaskTypeLabel,
  listPracticeTasks,
  listPracticeTaskTypes
} from './taskCatalog';

describe('taskCatalog', () => {
  it('contains scripted dialogue and picture description tasks', () => {
    const tasks = listPracticeTasks();
    expect(tasks.some((task) => task.type === 'scripted-dialogue')).toBe(true);
    expect(tasks.some((task) => task.type === 'picture-description')).toBe(true);
  });

  it('looks up tasks by id', () => {
    expect(getPracticeTaskById('dialogue-coffee-order')?.title).toBe('咖啡店点单');
    expect(getPracticeTaskById('missing-task')).toBeNull();
  });

  it('returns stable type labels for filters and metadata', () => {
    expect(getPracticeTaskTypeLabel('free-recording')).toBe('自由录音');
    expect(getPracticeTaskTypeLabel('scripted-dialogue')).toBe('情境对话');
    expect(getPracticeTaskTypeLabel('picture-description')).toBe('看图描述');
    expect(listPracticeTaskTypes()).toEqual(['free-recording', 'scripted-dialogue', 'picture-description']);
  });
});
```

- [ ] **Step 2: Run tests and confirm RED**

Run:

```powershell
npm test -- src/domain/taskCatalog.test.ts
```

Expected: FAIL because `taskCatalog.ts` does not exist and `scripted-dialogue` is not defined.

- [ ] **Step 3: Extend domain types and implement catalog**

`src/domain/practice.ts` should include:

```ts
export type PracticeTaskType = 'free-recording' | 'scripted-dialogue' | 'picture-description';

export interface RecordingRecord {
  id: string;
  taskType: PracticeTaskType;
  taskId?: string;
  title: string;
  blob: Blob;
  mimeType: string;
  durationMs: number;
  createdAt: string;
}
```

`src/domain/taskCatalog.ts` should export typed local tasks:

```ts
export type PracticeTask =
  | { id: string; type: 'scripted-dialogue'; title: string; difficulty: 'A2-B1' | 'B1-B2'; durationSec: number; scenario: string; userGoal: string; npcLines: string[]; userPrompts: string[]; usefulExpressions: string[] }
  | { id: string; type: 'picture-description'; title: string; difficulty: 'A2-B1' | 'B1-B2'; durationSec: number; imageAlt: string; scene: string; descriptionSteps: string[]; usefulExpressions: string[] };
```

Seed at least two scripted dialogue tasks and two picture description tasks.

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
npm test -- src/domain/taskCatalog.test.ts src/data/recordingRepository.test.ts
```

Expected: PASS.

## Task 2: Practice Page Task-Driven Flow

**Files:**
- Modify: `src/pages/PracticePage.tsx`
- Modify: `src/pages/PracticePage.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write practice page tests**

Add tests that verify:

```ts
expect(screen.getByRole('button', { name: /咖啡店点单/ })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /办公室白板讨论/ })).toBeInTheDocument();
```

After selecting the picture task:

```ts
await user.click(screen.getByRole('button', { name: /办公室白板讨论/ }));
expect(screen.getByText('先用一句话总述画面。')).toBeInTheDocument();
```

When saving:

```ts
expect(mocks.createRecording).toHaveBeenCalledWith(
  expect.objectContaining({
    taskType: 'picture-description',
    taskId: 'picture-office-whiteboard',
    title: '办公室白板讨论'
  })
);
```

- [ ] **Step 2: Run tests and confirm RED**

Run:

```powershell
npm test -- src/pages/PracticePage.test.tsx
```

Expected: FAIL because current page only supports free recording.

- [ ] **Step 3: Implement task selector and task detail**

Use `listPracticeTasks()` for cards. Store `selectedTaskId` in component state. Derive:

```ts
const selectedTask = getPracticeTaskById(selectedTaskId) ?? listPracticeTasks()[0];
const taskTitle = selectedTask.title;
```

Save metadata:

```ts
await createRecording({
  taskType: selectedTask.type,
  taskId: selectedTask.id,
  title: taskTitle,
  blob: recordingToSave.blob,
  mimeType: recordingToSave.mimeType,
  durationMs: recordingToSave.durationMs
});
```

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
npm test -- src/pages/PracticePage.test.tsx
```

Expected: PASS.

## Task 3: Review Page Type Filters

**Files:**
- Modify: `src/pages/ReviewPage.tsx`
- Modify: `src/pages/ReviewPage.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write review filter tests**

Use mock recordings with `free-recording`, `scripted-dialogue`, and `picture-description`. Assert:

```ts
await user.click(screen.getByRole('button', { name: '看图描述' }));
expect(screen.getByText('办公室白板讨论')).toBeInTheDocument();
expect(screen.queryByText('咖啡店点单')).not.toBeInTheDocument();
```

- [ ] **Step 2: Run tests and confirm RED**

Run:

```powershell
npm test -- src/pages/ReviewPage.test.tsx
```

Expected: FAIL because current review page has no filters.

- [ ] **Step 3: Implement filter controls**

Add state:

```ts
type ReviewFilter = 'all' | PracticeTaskType;
const [filter, setFilter] = useState<ReviewFilter>('all');
const filteredRecordings = filter === 'all' ? recordings : recordings.filter((recording) => recording.taskType === filter);
```

Render buttons for `全部`, `自由录音`, `情境对话`, `看图描述`, with `aria-pressed`.

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
npm test -- src/pages/ReviewPage.test.tsx
```

Expected: PASS.

## Task 4: Documentation, Full Verification, and Commit

**Files:**
- Modify: `README.md`
- Modify: `docs/task-10-development-log.md`

- [ ] **Step 1: Update docs**

README should document Phase 2 manual validation:

```md
## 第二阶段手动验收清单

- 进入练习页，选择“咖啡店点单”。
- 确认页面展示 NPC 台词、用户目标和可用表达。
- 录音并保存，进入复盘页。
- 使用“情境对话”筛选，确认记录可见。
- 回到练习页选择“办公室白板讨论”。
- 录音并保存，进入复盘页。
- 使用“看图描述”筛选，确认只显示看图描述记录。
```

- [ ] **Step 2: Run full verification**

Run:

```powershell
npm test
npm run build
```

Expected: both pass.

- [ ] **Step 3: Clean generated artifacts**

Remove ignored generated artifacts:

```powershell
Remove-Item -LiteralPath dist -Recurse -Force
Remove-Item -LiteralPath tsconfig.tsbuildinfo -Force
Remove-Item -LiteralPath tsconfig.node.tsbuildinfo -Force
```

Only remove files if they exist and resolve under `D:\Eng_practice`.

- [ ] **Step 4: Commit**

```powershell
git add README.md docs src
git commit -m "feat: add phase two local practice tasks"
```

## Self-Review

- Spec coverage: scripted dialogue, picture description, and review filtering are covered.
- Offline-first: all data is local TypeScript data and IndexedDB metadata.
- No ASR/TTS/LLM: no new network calls or cloud API files.
- Type consistency: `PracticeTaskType` values are `free-recording`, `scripted-dialogue`, and `picture-description`.
- Test coverage: domain catalog, practice page, review page, repository metadata, full test/build verification.
