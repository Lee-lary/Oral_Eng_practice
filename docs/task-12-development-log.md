# Task 12 开发日志：阶段 2 后半段本地复盘摘要

日期：2026-06-08

## 目标

- 在不接入 ASR、TTS、LLM 的前提下，为阶段 2 录音记录增加基础复盘信息。
- 复盘摘要先基于本地任务结构和录音时长生成，作为后续 VAD、转写、趋势指标的接口基础。
- 保持旧历史记录兼容：没有 `reviewSummary` 的记录仍正常展示、播放、筛选和删除。

## 设计边界

- 当前摘要不是语音识别结果，也不判断用户真实说了什么。
- 当前摘要只回答三个问题：
  - 本轮录音时长相对任务建议时长是否偏短、合适或偏长。
  - 本轮任务应该关注哪些结构要点。
  - 下一轮重练时优先修正什么。
- 情境对话摘要关注 NPC 轮次、回应点和用户目标。
- 看图描述摘要关注“总述画面、至少 3 个细节、合理推测”。

## 执行记录

- 新增 `src/domain/recordingReview.ts`：
  - `buildLocalReviewSummary(task, durationMs)` 根据任务和录音时长生成本地规则摘要。
  - 时长判断规则：短于目标 70% 为“时长偏短”，长于目标 140% 为“时长偏长”，其余为“节奏合适”。
- 扩展 `RecordingRecord`：
  - 新增可选 `reviewSummary` 字段。
  - `NewRecordingInput` 自动继承该字段。
- 更新保存链路：
  - 练习页保存录音时生成并写入 `reviewSummary`。
  - 仓库保存时保留该字段。
- 更新复盘页：
  - 有摘要的记录显示“本地复盘”、时长标签、建议目标、检查项和重练建议。
  - 没有摘要的旧记录不显示该块，仍按原逻辑工作。
- 根据代码审查修复：
  - 旧记录没有摘要时渲染隐藏占位，避免复盘列表的播放控件和删除按钮在 grid 中错位。
  - 录音绑定原任务的测试增加 `reviewSummary` 断言，确保摘要来源和保存元数据来自同一个任务。

## 验收记录

- 已按 TDD 写入 RED 测试：
  - `recordingReview` 摘要生成测试。
  - `recordingRepository` 摘要持久化测试。
  - `PracticePage` 保存参数包含摘要测试。
  - `ReviewPage` 摘要展示测试。
- RED 结果：测试因缺少摘要生成器、保存字段和页面展示失败。
- GREEN 结果：
  - `npm test -- src/domain/recordingReview.test.ts src/data/recordingRepository.test.ts src/pages/PracticePage.test.tsx src/pages/ReviewPage.test.tsx`
  - 通过，4 个测试文件、26 个测试。
- 完整验收：
  - `npm test`：通过，8 个测试文件、46 个测试。
  - `npm run build`：通过，`tsc -b` 和 `vite build` 完成。
  - `npm run e2e -- --project=webkit`：通过，2 个 WebKit E2E 测试。
- 审查修复后局部回归：
  - `npm test -- src/pages/ReviewPage.test.tsx src/pages/PracticePage.test.tsx`
  - 通过，2 个测试文件、21 个测试。

## 后续建议

- 下一步可以接入本地 VAD 或 Web Audio 分段，补充静音比例、长停顿次数和有效说话时长。
- 等有 ASR 后，再把摘要从“任务结构提示”升级为“实际表达命中检查”。
