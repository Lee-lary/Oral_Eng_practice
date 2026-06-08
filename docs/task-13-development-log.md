# Task 13 开发日志：阶段 2 情境对话多轮脚本流程

日期：2026-06-08

## 目标

- 以主设计文档 `docs/superpowers/specs/2026-06-05-english-speaking-pwa-design.md` 为最高层依据，把当前静态情境对话升级为离线可运行的多轮脚本流程。
- 每个脚本任务拆成稳定的 `turns`，每轮包含 `turnId`、NPC 台词、用户回应提示和 `expectedSlots`，为后续 ASR slot 命中与有限状态机推进预留接口。
- 用户每保存一轮录音，就写入该轮对应的录音元数据；复盘页能看到这条录音属于第几轮、NPC 说了什么、用户应回应什么。

## 设计边界

- 本次仍不接入 ASR、TTS 或 LLM；轮次推进先由用户保存录音触发。
- 当前不判断用户是否真实命中 `expectedSlots`，只保存结构化目标，后续 ASR 接入后再做命中检查。
- 保留原来的 `npcLines` 与 `userPrompts` 字段，避免影响已有本地复盘摘要规则；新增 `turns` 作为多轮流程和状态机的结构化来源。
- 旧录音没有 `dialogueTurn` 字段时仍按原方式展示、播放、筛选和删除。

## 执行记录

- 扩展 `src/domain/taskCatalog.ts`：
  - 新增 `ScriptedDialogueTurn`。
  - 为“咖啡店点单”和“酒店入住登记”补充 3 轮脚本流程。
  - `cloneTask` 深拷贝 `turns.expectedSlots`，避免外部修改题库常量。
- 扩展 `src/domain/practice.ts` 与 `src/data/recordingRepository.ts`：
  - 新增 `ScriptedDialogueTurnRecord`。
  - `RecordingRecord` 新增可选 `dialogueTurn`。
  - 创建录音时持久化 `dialogueTurn`。
- 改造 `src/pages/PracticePage.tsx`：
  - 情境对话详情改为聚焦当前轮次，显示“第 N/M 轮”、NPC 台词、用户回应目标和预期槽位。
  - 增加“上一轮 / 下一轮”手动轮次控制。
  - 保存一轮录音后自动推进到下一轮。
  - 录音生成时绑定当时的任务与轮次，避免用户切换素材后把录音保存到错误任务。
- 改造 `src/pages/ReviewPage.tsx`：
  - 带 `dialogueTurn` 的录音显示轮次、NPC 台词和用户回应提示。
- 更新 `src/styles.css`：
  - 增加当前轮次面板、轮次控制、复盘轮次信息的样式。

## TDD 记录

- RED 测试覆盖：
  - `taskCatalog` 返回脚本 turns 和 expectedSlots。
  - `recordingRepository` 持久化每轮录音元数据。
  - `PracticePage` 按第 1/3 轮保存并自动推进到第 2/3 轮。
  - `ReviewPage` 展示第几轮、NPC 台词和用户回应提示。
- RED 结果：4 个测试点按预期失败，分别缺少 turns、dialogueTurn 保存、练习页轮次 UI 和复盘页轮次展示。
- GREEN 结果：
  - `npm test -- src/domain/taskCatalog.test.ts src/data/recordingRepository.test.ts src/pages/PracticePage.test.tsx src/pages/ReviewPage.test.tsx`
  - 通过：4 个测试文件，31 个测试。

## 后续建议

- 下一步可把 `expectedSlots` 与本地 ASR 转写结果连接，做“是否覆盖本轮关键意图”的规则判断。
- 可为每个脚本任务增加“随机练习”入口，从同一模块中随机选择任务和起始轮次。
- 等 Web Audio/VAD 接入后，可以在每轮录音记录中补充有效说话时长、静音比例和长停顿次数。
