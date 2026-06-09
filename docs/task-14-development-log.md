# Task 14 开发日志：阶段 3 本地流利度指标

日期：2026-06-09

## 目标

- 以主设计文档 `docs/superpowers/specs/2026-06-05-english-speaking-pwa-design.md` 为最高层依据，实现阶段 3 的本地流利度指标。
- 不接入 ASR、TTS 或 LLM，优先使用 Web Audio API 做后录音分析。
- 每次训练保存后，能够在复盘页看到基础指标，并在趋势页查看最近 7 天汇总。

## 指标定义

- `durationMs`：录音总时长。
- `voicedMs`：被本地 VAD 判定为有声的总时长。
- `startDelayMs`：从录音开始到第一段有声的时间。
- `pauseRatio`：静音时长占总时长的比例。
- `longPauseCount`：两段有声之间超过 700ms 的静音次数。
- `longPauseMs`：长停顿总时长。

长停顿阈值沿用主设计文档推荐值：700ms。

## 设计边界

- 当前 VAD 基于短窗口 RMS 能量阈值，不做语义判断，也不做发音评分。
- 指标只用于个人趋势比较，不代表口语能力总分。
- 音频分析失败时不阻断录音保存；旧录音没有 `fluencyMetrics` 时继续兼容。
- 趋势页初版使用表格和摘要，不引入图表库。

## 执行记录

- 新增 `src/audio/fluencyAnalysis.ts`：
  - `calculateFluencyMetricsFromFrames()` 负责纯指标计算。
  - `analyzeRecordingFluency()` 负责用 Web Audio API 解码录音 Blob 并生成能量帧。
- 扩展 `src/domain/practice.ts`：
  - 新增 `FluencyMetrics`。
  - `RecordingRecord` 新增可选 `fluencyMetrics`。
- 扩展 `src/data/recordingRepository.ts`：
  - 创建录音时持久化 `fluencyMetrics`。
- 改造 `src/pages/PracticePage.tsx`：
  - 保存录音前尝试本地流利度分析。
  - 分析成功则随录音保存指标；分析失败仍保存录音。
- 改造 `src/pages/ReviewPage.tsx`：
  - 带指标的录音展示“本地流利度”、起说延迟、长停顿、停顿占比和有声时长。
- 新增 `src/domain/trends.ts`：
  - `buildSevenDayTrend()` 汇总最近 7 天训练次数、总时长、平均停顿占比、平均起说延迟和长停顿次数。
- 新增 `src/pages/TrendPage.tsx`：
  - 提供 `/trends` 页面。
  - 展示最近 7 天摘要和每日趋势表。
- 更新 `src/App.tsx`：
  - 顶部导航新增“趋势”。
  - 路由新增 `/trends`。

## TDD 记录

- RED 测试覆盖：
  - VAD 指标公式。
  - 无有声片段时的指标计算。
  - 录音仓储持久化 `fluencyMetrics`。
  - 练习页保存时写入流利度指标。
  - 复盘页显示本地流利度指标。
  - 最近 7 天趋势聚合。
  - 趋势页和顶部导航。
- 局部 GREEN：
  - `npm test -- src/audio/fluencyAnalysis.test.ts src/domain/trends.test.ts src/data/recordingRepository.test.ts`
  - 通过：3 个测试文件，8 个测试。
  - `npm test -- src/pages/PracticePage.test.tsx src/pages/ReviewPage.test.tsx`
  - 通过：2 个测试文件，24 个测试。
  - `npm test -- src/pages/TrendPage.test.tsx src/App.test.tsx`
  - 通过：2 个测试文件，7 个测试。

## 验收记录

- `npm test`
  - 通过：11 个测试文件，57 个测试。
- `npm run build`
  - 通过：`tsc -b` 和 `vite build` 完成。
- `npm run e2e -- --project=webkit`
  - 通过：3 个 WebKit E2E 测试。
- E2E runner 修正：
  - Playwright `webServer` 插件在当前 Windows 环境中出现 teardown 超时。
  - 新增 `scripts/run-e2e.mjs`，由项目脚本启动和关闭 Vite，Playwright 只负责执行测试。
  - `PLAYWRIGHT_BROWSERS_PATH` 仍指向 `D:\Eng_practice\.tools\ms-playwright`。

## 后续建议

- 用真实录音做人工校准，调整 `voicedThreshold`，避免环境噪声导致有声时长偏高。
- 后续接 ASR 后，再补充 filler ratio、speech rate、mean length of run。
- 如果 Web Audio 对某些 iPhone 录音格式解码不稳定，再考虑录音阶段同步采样能量，或引入更稳的 VAD 库。
