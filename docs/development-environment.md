# 开发环境记录

日期：2026-06-08

## Playwright WebKit 缓存位置

本项目为了不污染 Windows 用户目录，并方便项目自带开发环境，Playwright 浏览器缓存安装在项目内：

```powershell
D:\Eng_practice\.tools\ms-playwright
```

其中 WebKit 当前位于：

```powershell
D:\Eng_practice\.tools\ms-playwright\webkit-2287
```

Playwright 默认会去用户缓存目录查找浏览器，例如：

```powershell
C:\Users\Lee\AppData\Local\ms-playwright
```

如果没有指定项目内缓存路径，运行 `npm run e2e -- --project=webkit` 可能会误报缺少：

```powershell
C:\Users\Lee\AppData\Local\ms-playwright\webkit-2287\Playwright.exe
```

正确做法是在运行 E2E 前使用项目内缓存路径：

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH='D:\Eng_practice\.tools\ms-playwright'
npm run e2e -- --project=webkit
```

当前 `playwright.config.ts` 已默认设置：

```ts
process.env.PLAYWRIGHT_BROWSERS_PATH ??= `${process.cwd()}\\.tools\\ms-playwright`;
```

因此在 `D:\Eng_practice` 工作区执行 `npm run e2e -- --project=webkit` 时，应自动使用项目内 WebKit。若后续在其他目录运行，需确认当前工作目录仍是项目根目录，或手动设置 `PLAYWRIGHT_BROWSERS_PATH`。

## 验收记录

2026-06-08 已验证：

```powershell
npm run e2e -- --project=webkit
```

结果：2 个 WebKit E2E 测试通过。
