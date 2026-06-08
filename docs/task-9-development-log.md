# Task 9 开发日志：Windows Node、WebKit 与 GitHub 同步

日期：2026-06-08

## 目标

- 安装 Node.js LTS，并让 `node`、`npm` 在 Windows PATH 中可直接使用。
- 安装并验收 Playwright WebKit。
- 在工作区执行并记录 `npm test`、`npm run build`、`npm run dev` 验收结果。
- 清理验收产生的临时文件和构建产物。
- 初始化 Git 仓库，并推送到 `git@github.com:Lee-lary/Oral_Eng_practice.git`。

## 执行记录

- 使用项目本地运行时目录 `D:\Eng_practice\.tools\nodejs\node-v24.16.0-win-x64` 保存 Node.js，不把运行时文件纳入 Git。
- 将上述 Node 目录写入 Windows 用户 PATH 最前面，并移除此前失效的用户级 Node 路径。
- 使用 `D:\Eng_practice\.tools\ms-playwright` 保存 Playwright 浏览器缓存，不把浏览器缓存纳入 Git。
- 发现当前 Codex App 进程会优先解析到应用自带 `node.exe`，因此用新 PowerShell 环境和注册表 PATH 进行 PATH 验收。
- 清理了 `dist`、dev server 日志、TypeScript build info、生成的配置 JS/d.ts 等临时产物。

## 验收结果

- 新 PowerShell 环境：
  - `node -v`：`v24.16.0`
  - `npm -v`：`11.13.0`
- Playwright WebKit：
  - `webkit.launch()` 成功，版本输出：`webkit 26.4`
- 项目命令：
  - `npm test`：通过，6 个测试文件、31 个测试通过；存在 React Router v7 future flag 警告。
  - `npm run build`：通过，Vite 构建与 PWA service worker 生成成功。
  - `npm run dev`：通过，Vite 在 `http://127.0.0.1:5173/` 启动，HTTP 请求返回 `200`；验收后已停止进程。

## 当前状态

- Git 仓库已初始化在 `main` 分支。
- Git remote 已设置为 `git@github.com:Lee-lary/Oral_Eng_practice.git`。
- 初始提交已完成并推送到 GitHub。
- 提交号：`cc8e4d8`
- 分支状态：`main` 跟踪 `origin/main`。
