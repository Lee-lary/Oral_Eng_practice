# 个人英语口语训练器

个人英语口语训练器第一阶段已经实现 PWA 基础应用能力，支持首页、练习页、历史页；支持浏览器麦克风录音、录音回放、IndexedDB 本地保存；并包含 PWA manifest 与 service worker 构建配置。

当前范围明确不包含 ASR、TTS、LLM 能力，也不包含云端部署。

## 本地运行

```powershell
npm install
npm run dev
```

启动后打开 <http://127.0.0.1:5173>。

本工作区当前使用便携 Node。如果普通 shell 中 `npm` 不在 `PATH` 上，可以使用 `.node-runtime\node-v24.16.0-win-x64\npm.cmd`，并先将该目录加入 `PATH`：

```powershell
$env:PATH="D:\Eng_practice\.node-runtime\node-v24.16.0-win-x64;$env:PATH"
& "D:\Eng_practice\.node-runtime\node-v24.16.0-win-x64\npm.cmd" run dev
```

## 验证命令

```powershell
npm test
npm run build
npm run e2e
```

如果 Playwright WebKit 尚未安装，请先运行：

```powershell
npx playwright install webkit
```

当前环境可能需要先安装 WebKit，E2E 才能通过。

## 第一阶段手动验收清单

- 打开首页，点击“开始练习”。
- 在练习页点击“开始录音”，并允许浏览器访问麦克风。
- 说话 5-10 秒，点击“停止录音”。
- 确认页面出现音频播放器。
- 点击“保存本轮录音”。
- 进入“复盘”，确认刚才的录音出现在历史记录中。
- 刷新页面，确认记录仍然存在。
- 删除该记录，确认记录被移除。
