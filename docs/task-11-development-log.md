# Task 11 开发日志：练习页模块化导航

日期：2026-06-08

## 目标

- 将练习页从“直接展示全部素材”改为“先展示核心功能模块，再进入模块素材列表”。
- 保留当前录音、保存、复盘筛选和旧历史记录兼容能力。
- 为模块化导航补充测试，确认不影响其他功能。

## 计划

- 在 `taskCatalog` 中增加模块定义和按模块取素材的 API。
- 改造 `PracticePage`：
  - 默认展示模块卡片。
  - 进入模块后展示该模块素材。
  - 选择素材后展示任务详情和录音区。
  - 返回模块时清除当前素材选择。
- 更新测试：
  - 默认不展示具体素材。
  - 进入模块后只展示对应素材。
  - 保存仍写入正确 `taskType` 和 `taskId`。
- 运行 `npm test` 和 `npm run build` 验收。

## 执行记录

- 已新增 `listPracticeModules` 和 `listPracticeTasksByModule`，练习页可按“情境对话”“看图描述”两个核心模块读取素材。
- 已将练习页默认视图改为模块卡片；进入模块后才显示对应素材，选择素材后才显示任务详情、计时器、录音和保存控件。
- 已保留录音保存绑定逻辑：录音生成后即使切换到其他素材，保存时仍按录音生成时的任务元数据入库。
- 已同步更新 WebKit E2E 用例的交互路径：不再假设进入练习页即显示录音控件，而是先进入模块并选择素材。
- 代码审查发现一个竞态：录音停止生成音频期间切换素材，可能把录音保存到切换后的任务。已改为在点击“开始录音”时绑定任务 ID，并新增回归测试覆盖该场景。

## 验收记录

- `npm test -- src/pages/PracticePage.test.tsx -t "keeps a recording bound when the user switches tasks before it is ready"`：先失败后通过，验证录音任务绑定竞态已修复。
- `npm test -- src/domain/taskCatalog.test.ts src/pages/PracticePage.test.tsx`：通过，2 个测试文件、15 个测试。
- `npm test`：通过，7 个测试文件、42 个测试。
- `npm run build`：通过，`tsc -b` 和 `vite build` 均完成。
- `Invoke-WebRequest http://127.0.0.1:5173/practice`：返回 HTTP 200，开发服务器练习页可访问。
- `npm run e2e -- --project=webkit`：未通过，原因是本机缺少 `C:\Users\Lee\AppData\Local\ms-playwright\webkit-2287\Playwright.exe`，不是页面断言失败。
- 已尝试两次执行 `npx playwright install webkit`，分别在约 3 分钟和约 10 分钟后超时，未完成 WebKit 浏览器下载。本轮将其记录为环境安装阻塞，后续可在网络稳定时重试。

## 当前结论

- 本轮模块化导航已完成并通过可用的单元、集成和构建验收。
- 已确认首页、复盘页、录音仓库、录音 Hook、练习页保存流程没有在自动化测试层面回归。
- 待后续环境事项：完成 Playwright WebKit 浏览器安装后，重跑 `npm run e2e -- --project=webkit`。
