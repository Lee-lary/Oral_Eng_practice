# Task 10 开发日志：阶段 2 启动

日期：2026-06-08

## 目标

- 修正 README 和开发日志中关于 Node、WebKit、Git 同步状态的过期信息。
- 按设计文档启动阶段 2：任务系统与本地题库。
- 优先实现情境对话、看图描述和复盘筛选。

## 已确认的阶段 2 范围

- 不接入 ASR、TTS、LLM。
- 不引入后端服务。
- 练习任务先由本地 TypeScript 数据定义。
- 录音仍使用阶段 1 的 `useRecorder`、`MediaRecorderService` 和 IndexedDB 存储链路。
- 保存历史记录时补充任务类型和任务 ID，方便复盘页筛选。

## 执行记录

- 已修正 `README.md`：
  - Node 路径改为 `D:\Eng_practice\.tools\nodejs\node-v24.16.0-win-x64`。
  - WebKit 状态改为已安装并已验证可启动。
  - 增加阶段 2 开发范围说明。
- 已修正 `docs/task-9-development-log.md`：
  - 记录初始提交和 GitHub 推送已完成。
- 已创建阶段 2 实施计划：
  - `docs/superpowers/plans/2026-06-08-phase-2-task-system.md`
- 已实现领域模型与本地题库：
  - `PracticeTaskType` 扩展为 `free-recording`、`scripted-dialogue`、`picture-description`。
  - `RecordingRecord` 支持可选 `taskId`。
  - 新增 `src/domain/taskCatalog.ts`，提供任务列表、任务查询和任务类型标签。
  - 本地题库包含“咖啡店点单”“酒店入住登记”“办公室白板讨论”“周末公园活动”。
- 已改造练习页：
  - 支持选择情境对话和看图描述任务。
  - 支持展示 NPC 台词、用户目标、看图描述步骤和可用表达。
  - 保存录音时写入 `taskType` 和 `taskId`。
- 已改造复盘页：
  - 每条记录显示任务类型标签。
  - 支持按全部、自由录音、情境对话、看图描述筛选。
  - 显示总记录数和当前筛选结果数。
- 已根据 reviewer 反馈修复：
  - 录音生成时绑定任务，避免录音后切换任务导致保存归类错误。
  - 恢复旧 `starter` 历史记录兼容，复盘页可显示和筛选“句型启动”旧记录。

## 下一步

- 清理构建产物。
- 提交阶段 2 开发分支。

## 局部验证结果

- `npm test -- src/domain/taskCatalog.test.ts src/data/recordingRepository.test.ts`：通过，2 个测试文件、5 个测试通过。
- `npm test -- src/pages/PracticePage.test.tsx`：通过，1 个测试文件、8 个测试通过。
- `npm test -- src/pages/ReviewPage.test.tsx`：通过，1 个测试文件、9 个测试通过。
- `npm test -- src/domain/taskCatalog.test.ts src/pages/PracticePage.test.tsx src/pages/ReviewPage.test.tsx`：通过，3 个测试文件、20 个测试通过。
- `npm test`：通过，7 个测试文件、38 个测试通过；仍有 React Router v7 future flag 警告。
- `npm run build`：通过，Vite 与 PWA service worker 构建成功。
