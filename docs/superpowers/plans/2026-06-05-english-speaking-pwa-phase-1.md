# English Speaking PWA Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable local PWA shell for the English speaking trainer: Chinese UI, routing, recording, playback, and local IndexedDB history persistence.

**Architecture:** This phase creates a client-only React/Vite application. It keeps audio and session metadata local through Dexie/IndexedDB, isolates browser recording behind a small service, and avoids ASR/TTS/LLM until later phases.

**Tech Stack:** React, TypeScript, Vite, React Router, vite-plugin-pwa, Dexie, Vitest, Testing Library, Playwright WebKit.

---

## Scope

This plan implements only Phase 1 from the design spec:

- PWA shell.
- Home, Practice, Review routes.
- Microphone recording.
- Playback after recording.
- IndexedDB persistence.
- History list.
- Basic tests and build verification.

It intentionally does not implement ASR, TTS, LLM, VAD, fluency metrics, picture description, or scripted dialogue. Those belong to later plans.

## File Structure

Create the project directly under `D:\Eng_practice`.

- `package.json`: project scripts and dependencies.
- `index.html`: Vite entry HTML.
- `vite.config.ts`: React, Vitest, and PWA configuration.
- `tsconfig.json`, `tsconfig.node.json`: TypeScript configuration.
- `playwright.config.ts`: WebKit smoke test configuration.
- `src/main.tsx`: React entrypoint.
- `src/App.tsx`: top-level routes and layout.
- `src/styles.css`: global app styles.
- `src/domain/practice.ts`: domain types and ID/date helpers.
- `src/data/db.ts`: Dexie database schema.
- `src/data/recordingRepository.ts`: persistence API for recordings.
- `src/audio/mediaRecorderService.ts`: browser recording service.
- `src/hooks/useRecorder.ts`: React state wrapper for recording.
- `src/pages/HomePage.tsx`: dashboard shell.
- `src/pages/PracticePage.tsx`: recorder UI.
- `src/pages/ReviewPage.tsx`: local history UI.
- `src/pages/NotFoundPage.tsx`: fallback route.
- `src/test/setup.ts`: test environment setup.
- `src/**/*.test.ts(x)`: unit/component tests.
- `tests/e2e/app.spec.ts`: Playwright smoke test.

## Commit Policy

The current workspace is not a Git repository. If a Git repository is initialized before execution, commit after each task with the suggested message. If not, skip commit steps and keep the working tree changes as files.

## Task 1: Scaffold Vite React TypeScript App

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/pages/HomePage.tsx`
- Create: `src/pages/PracticePage.tsx`
- Create: `src/pages/ReviewPage.tsx`
- Create: `src/pages/NotFoundPage.tsx`
- Create: `src/test/setup.ts`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "english-speaking-pwa",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.5.0",
    "dexie": "^4.0.11",
    "lucide-react": "^0.468.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.1",
    "vite-plugin-pwa": "^0.21.1"
  },
  "devDependencies": {
    "@playwright/test": "^1.52.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^15.0.7",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.23",
    "@types/react-dom": "^18.3.7",
    "fake-indexeddb": "^6.0.0",
    "jsdom": "^24.1.3",
    "typescript": "^5.8.3",
    "vite": "^6.3.5",
    "vitest": "^3.2.2"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run:

```powershell
npm install
```

Expected: `node_modules` and `package-lock.json` are created, with no dependency resolution errors.

- [ ] **Step 3: Create TypeScript configs**

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts", "playwright.config.ts"]
}
```

- [ ] **Step 4: Create Vite config**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "个人英语口语训练器",
        short_name: "口语训练",
        description: "面向个人自练的英语口语输出训练 PWA",
        theme_color: "#0f172a",
        background_color: "#f8fafc",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"]
      }
    })
  ],
  test: {
    environment: "jsdom",
    setupFiles: "src/test/setup.ts",
    globals: true
  }
});
```

- [ ] **Step 5: Create HTML entry**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0f172a" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="口语训练" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <title>个人英语口语训练器</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create test setup**

```ts
import "@testing-library/jest-dom/vitest";

if (!URL.createObjectURL) {
  URL.createObjectURL = () => "blob:mock-audio-url";
}

if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = () => undefined;
}
```

- [ ] **Step 7: Create placeholder pages**

`src/pages/HomePage.tsx`:

```tsx
import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <main className="page page--home">
      <section className="hero">
        <p className="eyebrow">今日训练</p>
        <h1>个人英语口语训练器</h1>
        <p className="hero__copy">
          先完成一轮本地录音训练，后续再接入 ASR、TTS 和更细的复盘。
        </p>
        <Link className="primary-action" to="/practice">
          开始练习
        </Link>
      </section>
      <section className="status-grid" aria-label="训练概览">
        <article>
          <span>本周目标</span>
          <strong>60 分钟</strong>
        </article>
        <article>
          <span>当前阶段</span>
          <strong>本地录音</strong>
        </article>
        <article>
          <span>云端服务</span>
          <strong>暂不接入</strong>
        </article>
      </section>
    </main>
  );
}
```

`src/pages/PracticePage.tsx`:

```tsx
export function PracticePage() {
  return (
    <main className="page">
      <p className="eyebrow">Practice</p>
      <h1>录音练习</h1>
      <p>第一阶段将在这里实现录音、停止、回放和保存。</p>
    </main>
  );
}
```

`src/pages/ReviewPage.tsx`:

```tsx
export function ReviewPage() {
  return (
    <main className="page">
      <p className="eyebrow">Review</p>
      <h1>历史记录</h1>
      <p>保存后的本地录音会显示在这里。</p>
    </main>
  );
}
```

`src/pages/NotFoundPage.tsx`:

```tsx
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="page">
      <p className="eyebrow">404</p>
      <h1>页面不存在</h1>
      <Link className="secondary-action" to="/">
        回到首页
      </Link>
    </main>
  );
}
```

- [ ] **Step 8: Create app routes**

`src/App.tsx`:

```tsx
import { NavLink, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PracticePage } from "./pages/PracticePage";
import { ReviewPage } from "./pages/ReviewPage";

export function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/">
          口语训练
        </NavLink>
        <nav aria-label="主导航">
          <NavLink to="/practice">练习</NavLink>
          <NavLink to="/review">复盘</NavLink>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}
```

`src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 9: Create global styles**

```css
:root {
  color: #18202f;
  background: #f8fafc;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

* {
  box-sizing: border-box;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input,
textarea {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid #dbe3ef;
  background: rgba(248, 250, 252, 0.96);
  backdrop-filter: blur(12px);
}

.brand {
  font-weight: 800;
}

.topbar nav {
  display: flex;
  gap: 8px;
}

.topbar nav a {
  min-height: 40px;
  padding: 10px 12px;
  border-radius: 6px;
  color: #4b5b73;
}

.topbar nav a.active {
  color: #0f172a;
  background: #e8eef7;
}

.page {
  width: min(960px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 32px 0 56px;
}

.page--home {
  display: grid;
  gap: 24px;
}

.hero {
  padding: 28px 0 12px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #65758b;
  font-size: 0.86rem;
  font-weight: 700;
  text-transform: uppercase;
}

h1 {
  max-width: 720px;
  margin: 0;
  color: #0f172a;
  font-size: clamp(2rem, 6vw, 3.6rem);
  line-height: 1.05;
}

.hero__copy,
.page p {
  max-width: 680px;
  color: #4b5b73;
  line-height: 1.7;
}

.primary-action,
.secondary-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  margin-top: 12px;
  padding: 0 18px;
  border: 1px solid transparent;
  border-radius: 6px;
  font-weight: 700;
}

.primary-action {
  color: #ffffff;
  background: #0f766e;
}

.secondary-action {
  border-color: #c6d2e1;
  color: #18202f;
  background: #ffffff;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.status-grid article {
  padding: 16px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
}

.status-grid span {
  display: block;
  color: #65758b;
  font-size: 0.9rem;
}

.status-grid strong {
  display: block;
  margin-top: 6px;
  color: #0f172a;
  font-size: 1.15rem;
}

@media (max-width: 680px) {
  .topbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 10: Write route smoke test**

`src/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { App } from "./App";

function renderApp(initialPath = "/") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>
  );
}

describe("App routes", () => {
  it("renders the home page", () => {
    renderApp();
    expect(screen.getByRole("heading", { name: "个人英语口语训练器" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "开始练习" })).toHaveAttribute("href", "/practice");
  });

  it("navigates to review", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("link", { name: "复盘" }));
    expect(screen.getByRole("heading", { name: "历史记录" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 11: Run tests**

Run:

```powershell
npm test
```

Expected: both `App routes` tests pass.

- [ ] **Step 12: Run build**

Run:

```powershell
npm run build
```

Expected: TypeScript compilation succeeds and Vite writes `dist`.

- [ ] **Step 13: Commit if Git is available**

```powershell
git add package.json package-lock.json index.html tsconfig.json tsconfig.node.json vite.config.ts src
git commit -m "chore: scaffold speaking trainer pwa"
```

## Task 2: Add Domain Types and Local Recording Repository

**Files:**
- Create: `src/domain/practice.ts`
- Create: `src/data/db.ts`
- Create: `src/data/recordingRepository.ts`
- Test: `src/data/recordingRepository.test.ts`

- [ ] **Step 1: Write repository test**

```ts
import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { appDb } from "./db";
import { createRecording, deleteRecording, listRecordings } from "./recordingRepository";

afterEach(async () => {
  await appDb.recordings.clear();
});

describe("recordingRepository", () => {
  it("creates and lists recordings newest first", async () => {
    const older = await createRecording({
      taskType: "free-recording",
      title: "第一轮",
      blob: new Blob(["older"], { type: "audio/webm" }),
      mimeType: "audio/webm",
      durationMs: 12000,
      createdAt: "2026-06-05T09:00:00.000Z"
    });
    const newer = await createRecording({
      taskType: "free-recording",
      title: "第二轮",
      blob: new Blob(["newer"], { type: "audio/webm" }),
      mimeType: "audio/webm",
      durationMs: 9000,
      createdAt: "2026-06-05T10:00:00.000Z"
    });

    const rows = await listRecordings();

    expect(rows).toHaveLength(2);
    expect(rows[0].id).toBe(newer.id);
    expect(rows[1].id).toBe(older.id);
  });

  it("deletes a recording by id", async () => {
    const saved = await createRecording({
      taskType: "free-recording",
      title: "待删除",
      blob: new Blob(["audio"], { type: "audio/webm" }),
      mimeType: "audio/webm",
      durationMs: 5000,
      createdAt: "2026-06-05T09:00:00.000Z"
    });

    await deleteRecording(saved.id);
    const rows = await listRecordings();

    expect(rows).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm test -- src/data/recordingRepository.test.ts
```

Expected: FAIL because `./db` and `./recordingRepository` do not exist.

- [ ] **Step 3: Create domain types**

`src/domain/practice.ts`:

```ts
export type PracticeTaskType = "free-recording" | "starter" | "picture-description";

export interface RecordingRecord {
  id: string;
  taskType: PracticeTaskType;
  title: string;
  blob: Blob;
  mimeType: string;
  durationMs: number;
  createdAt: string;
}

export interface NewRecordingInput {
  taskType: PracticeTaskType;
  title: string;
  blob: Blob;
  mimeType: string;
  durationMs: number;
  createdAt?: string;
}

export function createId(prefix: string) {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
```

- [ ] **Step 4: Create Dexie database**

`src/data/db.ts`:

```ts
import Dexie, { type Table } from "dexie";
import type { RecordingRecord } from "../domain/practice";

export class SpeakingTrainerDb extends Dexie {
  recordings!: Table<RecordingRecord, string>;

  constructor() {
    super("speaking-trainer-db");
    this.version(1).stores({
      recordings: "id, createdAt, taskType"
    });
  }
}

export const appDb = new SpeakingTrainerDb();
```

- [ ] **Step 5: Create repository**

`src/data/recordingRepository.ts`:

```ts
import { createId, nowIso, type NewRecordingInput, type RecordingRecord } from "../domain/practice";
import { appDb } from "./db";

export async function createRecording(input: NewRecordingInput): Promise<RecordingRecord> {
  const recording: RecordingRecord = {
    id: createId("rec"),
    taskType: input.taskType,
    title: input.title.trim() || "未命名练习",
    blob: input.blob,
    mimeType: input.mimeType,
    durationMs: input.durationMs,
    createdAt: input.createdAt ?? nowIso()
  };

  await appDb.recordings.put(recording);
  return recording;
}

export async function listRecordings(): Promise<RecordingRecord[]> {
  const rows = await appDb.recordings.orderBy("createdAt").reverse().toArray();
  return rows;
}

export async function deleteRecording(id: string): Promise<void> {
  await appDb.recordings.delete(id);
}
```

- [ ] **Step 6: Run repository test**

Run:

```powershell
npm test -- src/data/recordingRepository.test.ts
```

Expected: PASS.

- [ ] **Step 7: Run all tests**

Run:

```powershell
npm test
```

Expected: all tests pass.

- [ ] **Step 8: Commit if Git is available**

```powershell
git add src/domain src/data
git commit -m "feat: add local recording repository"
```

## Task 3: Add Browser Recording Service

**Files:**
- Create: `src/audio/mediaRecorderService.ts`
- Test: `src/audio/mediaRecorderService.test.ts`

- [ ] **Step 1: Write MIME selection test**

`src/audio/mediaRecorderService.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { chooseSupportedMimeType } from "./mediaRecorderService";

describe("chooseSupportedMimeType", () => {
  it("returns the first supported MIME type", () => {
    const isTypeSupported = vi.fn((type: string) => type === "audio/mp4");

    const result = chooseSupportedMimeType(isTypeSupported);

    expect(result).toBe("audio/mp4");
    expect(isTypeSupported).toHaveBeenCalledWith("audio/webm;codecs=opus");
    expect(isTypeSupported).toHaveBeenCalledWith("audio/mp4");
  });

  it("returns an empty string when no preferred type is supported", () => {
    const result = chooseSupportedMimeType(() => false);

    expect(result).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm test -- src/audio/mediaRecorderService.test.ts
```

Expected: FAIL because `mediaRecorderService.ts` does not exist.

- [ ] **Step 3: Create media recorder service**

`src/audio/mediaRecorderService.ts`:

```ts
export interface FinishedRecording {
  blob: Blob;
  durationMs: number;
  mimeType: string;
}

export interface ActiveRecording {
  stop: () => Promise<FinishedRecording>;
  startedAt: number;
}

const preferredMimeTypes = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"];

export function chooseSupportedMimeType(
  isTypeSupported: (mimeType: string) => boolean = MediaRecorder.isTypeSupported
) {
  return preferredMimeTypes.find((type) => isTypeSupported(type)) ?? "";
}

export async function startBrowserRecording(): Promise<ActiveRecording> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("当前浏览器不支持麦克风录音。");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = chooseSupportedMimeType();
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: BlobPart[] = [];
  const startedAt = Date.now();

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  const stop = () =>
    new Promise<FinishedRecording>((resolve, reject) => {
      recorder.onerror = () => {
        stream.getTracks().forEach((track) => track.stop());
        reject(new Error("录音失败，请重试。"));
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const finalMimeType = recorder.mimeType || mimeType || "audio/webm";
        resolve({
          blob: new Blob(chunks, { type: finalMimeType }),
          durationMs: Date.now() - startedAt,
          mimeType: finalMimeType
        });
      };

      if (recorder.state !== "inactive") {
        recorder.stop();
      }
    });

  recorder.start(250);

  return {
    stop,
    startedAt
  };
}
```

- [ ] **Step 4: Run MIME selection test**

Run:

```powershell
npm test -- src/audio/mediaRecorderService.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run build**

Run:

```powershell
npm run build
```

Expected: PASS, confirming DOM types for `MediaRecorder` compile.

- [ ] **Step 6: Commit if Git is available**

```powershell
git add src/audio
git commit -m "feat: add browser recording service"
```

## Task 4: Add Recorder Hook

**Files:**
- Create: `src/hooks/useRecorder.ts`
- Test: `src/hooks/useRecorder.test.tsx`

- [ ] **Step 1: Write hook test with injected recorder**

`src/hooks/useRecorder.test.tsx`:

```tsx
import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ActiveRecording } from "../audio/mediaRecorderService";
import { useRecorder } from "./useRecorder";

function createActiveRecording(): ActiveRecording {
  return {
    startedAt: 1000,
    stop: vi.fn(async () => ({
      blob: new Blob(["audio"], { type: "audio/webm" }),
      durationMs: 1234,
      mimeType: "audio/webm"
    }))
  };
}

describe("useRecorder", () => {
  it("starts and stops a recording", async () => {
    const active = createActiveRecording();
    const start = vi.fn(async () => active);
    const { result } = renderHook(() => useRecorder({ start }));

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.status).toBe("recording");

    await act(async () => {
      await result.current.stop();
    });

    expect(result.current.status).toBe("ready");
    expect(result.current.latestRecording?.durationMs).toBe(1234);
  });

  it("stores an error when start fails", async () => {
    const start = vi.fn(async () => {
      throw new Error("no microphone");
    });
    const { result } = renderHook(() => useRecorder({ start }));

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe("no microphone");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm test -- src/hooks/useRecorder.test.tsx
```

Expected: FAIL because `useRecorder.ts` does not exist.

- [ ] **Step 3: Create hook**

`src/hooks/useRecorder.ts`:

```ts
import { useCallback, useRef, useState } from "react";
import {
  startBrowserRecording,
  type ActiveRecording,
  type FinishedRecording
} from "../audio/mediaRecorderService";

export type RecorderStatus = "idle" | "starting" | "recording" | "stopping" | "ready" | "error";

export interface UseRecorderOptions {
  start?: () => Promise<ActiveRecording>;
}

export function useRecorder(options: UseRecorderOptions = {}) {
  const startRecording = options.start ?? startBrowserRecording;
  const activeRecording = useRef<ActiveRecording | null>(null);
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [latestRecording, setLatestRecording] = useState<FinishedRecording | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setError(null);
    setLatestRecording(null);
    setStatus("starting");

    try {
      activeRecording.current = await startRecording();
      setStatus("recording");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "无法开始录音。");
    }
  }, [startRecording]);

  const stop = useCallback(async () => {
    if (!activeRecording.current) {
      return null;
    }

    setStatus("stopping");

    try {
      const recording = await activeRecording.current.stop();
      activeRecording.current = null;
      setLatestRecording(recording);
      setStatus("ready");
      return recording;
    } catch (err) {
      activeRecording.current = null;
      setStatus("error");
      setError(err instanceof Error ? err.message : "无法停止录音。");
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setLatestRecording(null);
    setError(null);
    activeRecording.current = null;
  }, []);

  return {
    status,
    latestRecording,
    error,
    isRecording: status === "recording",
    start,
    stop,
    reset
  };
}
```

- [ ] **Step 4: Run hook test**

Run:

```powershell
npm test -- src/hooks/useRecorder.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Run all tests**

Run:

```powershell
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit if Git is available**

```powershell
git add src/hooks
git commit -m "feat: add recorder hook"
```

## Task 5: Build Practice Page Recording Flow

**Files:**
- Modify: `src/pages/PracticePage.tsx`
- Modify: `src/styles.css`
- Test: `src/pages/PracticePage.test.tsx`

- [ ] **Step 1: Write practice page test**

`src/pages/PracticePage.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PracticePage } from "./PracticePage";

vi.mock("../hooks/useRecorder", () => ({
  useRecorder: () => ({
    status: "ready",
    latestRecording: {
      blob: new Blob(["audio"], { type: "audio/webm" }),
      durationMs: 4200,
      mimeType: "audio/webm"
    },
    error: null,
    isRecording: false,
    start: vi.fn(),
    stop: vi.fn(),
    reset: vi.fn()
  })
}));

describe("PracticePage", () => {
  it("renders playback and save controls when a recording is ready", () => {
    render(<PracticePage />);

    expect(screen.getByRole("heading", { name: "录音练习" })).toBeInTheDocument();
    expect(screen.getByText("0:04")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存本轮录音" })).toBeInTheDocument();
  });

  it("allows editing the title", async () => {
    const user = userEvent.setup();
    render(<PracticePage />);

    const input = screen.getByLabelText("练习标题");
    await user.clear(input);
    await user.type(input, "starter warmup");

    expect(input).toHaveValue("starter warmup");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm test -- src/pages/PracticePage.test.tsx
```

Expected: FAIL because the placeholder page has no recording controls.

- [ ] **Step 3: Implement practice page**

`src/pages/PracticePage.tsx`:

```tsx
import { useEffect, useMemo, useState } from "react";
import { Mic, Square, Save, RotateCcw } from "lucide-react";
import { createRecording } from "../data/recordingRepository";
import { formatDuration } from "../domain/practice";
import { useRecorder } from "../hooks/useRecorder";

export function PracticePage() {
  const recorder = useRecorder();
  const [title, setTitle] = useState("自由录音练习");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!recorder.latestRecording) {
      setAudioUrl(null);
      return;
    }

    const url = URL.createObjectURL(recorder.latestRecording.blob);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [recorder.latestRecording]);

  const durationLabel = useMemo(() => {
    return recorder.latestRecording ? formatDuration(recorder.latestRecording.durationMs) : "0:00";
  }, [recorder.latestRecording]);

  async function saveLatestRecording() {
    if (!recorder.latestRecording) {
      return;
    }

    await createRecording({
      taskType: "free-recording",
      title,
      blob: recorder.latestRecording.blob,
      mimeType: recorder.latestRecording.mimeType,
      durationMs: recorder.latestRecording.durationMs
    });
    setSaveMessage("已保存到本地历史记录。");
  }

  function resetRecording() {
    setSaveMessage(null);
    recorder.reset();
  }

  return (
    <main className="page">
      <p className="eyebrow">Practice</p>
      <h1>录音练习</h1>
      <p>先做一轮自由录音，确认麦克风、回放和本地保存链路稳定。</p>

      <section className="practice-panel" aria-label="录音面板">
        <label className="field">
          <span>练习标题</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>

        <div className="timer" aria-label="录音时长">
          {durationLabel}
        </div>

        <div className="control-row">
          {!recorder.isRecording ? (
            <button className="primary-action" type="button" onClick={recorder.start}>
              <Mic size={18} aria-hidden="true" />
              开始录音
            </button>
          ) : (
            <button className="danger-action" type="button" onClick={recorder.stop}>
              <Square size={18} aria-hidden="true" />
              停止录音
            </button>
          )}

          <button className="secondary-action" type="button" onClick={resetRecording}>
            <RotateCcw size={18} aria-hidden="true" />
            重录
          </button>
        </div>

        {recorder.status === "starting" && <p className="notice">正在请求麦克风权限...</p>}
        {recorder.status === "stopping" && <p className="notice">正在整理录音...</p>}
        {recorder.error && <p className="error-text">{recorder.error}</p>}

        {audioUrl && (
          <div className="playback">
            <audio controls src={audioUrl}>
              当前浏览器不支持音频回放。
            </audio>
            <button className="primary-action" type="button" onClick={saveLatestRecording}>
              <Save size={18} aria-hidden="true" />
              保存本轮录音
            </button>
          </div>
        )}

        {saveMessage && <p className="success-text">{saveMessage}</p>}
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Add page styles**

Append to `src/styles.css`:

```css
.practice-panel {
  display: grid;
  gap: 18px;
  margin-top: 24px;
  padding: 20px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
}

.field {
  display: grid;
  gap: 8px;
}

.field span {
  color: #344256;
  font-weight: 700;
}

.field input {
  width: 100%;
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid #c6d2e1;
  border-radius: 6px;
}

.timer {
  color: #0f172a;
  font-size: 3rem;
  font-weight: 800;
  line-height: 1;
}

.control-row,
.playback {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.control-row button,
.playback button {
  gap: 8px;
}

.danger-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid transparent;
  border-radius: 6px;
  color: #ffffff;
  background: #b42318;
  font-weight: 700;
}

.playback audio {
  width: min(100%, 420px);
}

.notice,
.success-text,
.error-text {
  margin: 0;
  font-weight: 700;
}

.notice {
  color: #4b5b73;
}

.success-text {
  color: #0f766e;
}

.error-text {
  color: #b42318;
}
```

- [ ] **Step 5: Run practice page test**

Run:

```powershell
npm test -- src/pages/PracticePage.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Run all tests and build**

Run:

```powershell
npm test
npm run build
```

Expected: all tests and build pass.

- [ ] **Step 7: Commit if Git is available**

```powershell
git add src/pages/PracticePage.tsx src/pages/PracticePage.test.tsx src/styles.css
git commit -m "feat: build local recording practice flow"
```

## Task 6: Build Review Page History Flow

**Files:**
- Modify: `src/pages/ReviewPage.tsx`
- Modify: `src/styles.css`
- Test: `src/pages/ReviewPage.test.tsx`

- [ ] **Step 1: Write review page test**

`src/pages/ReviewPage.test.tsx`:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReviewPage } from "./ReviewPage";

const mockData = vi.hoisted(() => ({
  recordings: [
    {
      id: "rec-1",
      taskType: "free-recording" as const,
      title: "自由录音练习",
      blob: new Blob(["audio"], { type: "audio/webm" }),
      mimeType: "audio/webm",
      durationMs: 61000,
      createdAt: "2026-06-05T10:00:00.000Z"
    }
  ],
  deleteRecording: vi.fn(async () => undefined)
}));

vi.mock("../data/recordingRepository", () => ({
  listRecordings: vi.fn(async () => mockData.recordings),
  deleteRecording: (id: string) => mockData.deleteRecording(id)
}));

describe("ReviewPage", () => {
  it("renders saved recordings", async () => {
    render(<ReviewPage />);

    expect(await screen.findByText("自由录音练习")).toBeInTheDocument();
    expect(screen.getByText("1:01")).toBeInTheDocument();
  });

  it("deletes a saved recording", async () => {
    const user = userEvent.setup();
    render(<ReviewPage />);

    await screen.findByText("自由录音练习");
    await user.click(screen.getByRole("button", { name: "删除 自由录音练习" }));

    await waitFor(() => {
      expect(mockData.deleteRecording).toHaveBeenCalledWith("rec-1");
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm test -- src/pages/ReviewPage.test.tsx
```

Expected: FAIL because placeholder page does not list recordings.

- [ ] **Step 3: Implement review page**

`src/pages/ReviewPage.tsx`:

```tsx
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteRecording, listRecordings } from "../data/recordingRepository";
import { formatDuration, type RecordingRecord } from "../domain/practice";

export function ReviewPage() {
  const [recordings, setRecordings] = useState<RecordingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function refresh() {
    setIsLoading(true);
    const rows = await listRecordings();
    setRecordings(rows);
    setIsLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function removeRecording(recording: RecordingRecord) {
    await deleteRecording(recording.id);
    await refresh();
  }

  return (
    <main className="page">
      <p className="eyebrow">Review</p>
      <h1>历史记录</h1>
      <p>这里显示保存在本地 IndexedDB 的录音。第一阶段只保存音频和基础元数据。</p>

      {isLoading && <p className="notice">正在读取本地记录...</p>}

      {!isLoading && recordings.length === 0 && (
        <section className="empty-state">
          <h2>还没有录音</h2>
          <p>先去练习页完成一轮录音，再回来复盘。</p>
        </section>
      )}

      {!isLoading && recordings.length > 0 && (
        <ul className="recording-list" aria-label="录音历史">
          {recordings.map((recording) => (
            <li className="recording-item" key={recording.id}>
              <div>
                <h2>{recording.title}</h2>
                <p>
                  {formatDuration(recording.durationMs)} ·{" "}
                  {new Date(recording.createdAt).toLocaleString("zh-CN")}
                </p>
              </div>
              <audio controls src={URL.createObjectURL(recording.blob)}>
                当前浏览器不支持音频回放。
              </audio>
              <button
                className="icon-button"
                type="button"
                aria-label={`删除 ${recording.title}`}
                onClick={() => removeRecording(recording)}
              >
                <Trash2 size={18} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
```

- [ ] **Step 4: Add review styles**

Append to `src/styles.css`:

```css
.empty-state {
  margin-top: 24px;
  padding: 24px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
}

.empty-state h2 {
  margin: 0 0 8px;
  color: #0f172a;
}

.recording-list {
  display: grid;
  gap: 12px;
  padding: 0;
  margin: 24px 0 0;
  list-style: none;
}

.recording-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 340px) auto;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
}

.recording-item h2 {
  margin: 0 0 6px;
  color: #0f172a;
  font-size: 1.05rem;
}

.recording-item p {
  margin: 0;
  color: #65758b;
}

.recording-item audio {
  width: 100%;
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid #c6d2e1;
  border-radius: 6px;
  color: #b42318;
  background: #ffffff;
}

@media (max-width: 760px) {
  .recording-item {
    grid-template-columns: 1fr auto;
  }

  .recording-item audio {
    grid-column: 1 / -1;
  }
}
```

- [ ] **Step 5: Run review page test**

Run:

```powershell
npm test -- src/pages/ReviewPage.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Run all tests and build**

Run:

```powershell
npm test
npm run build
```

Expected: all tests and build pass.

- [ ] **Step 7: Commit if Git is available**

```powershell
git add src/pages/ReviewPage.tsx src/pages/ReviewPage.test.tsx src/styles.css
git commit -m "feat: show local recording history"
```

## Task 7: Add PWA Assets and WebKit Smoke Test

**Files:**
- Create: `public/favicon.svg`
- Create: `public/pwa-192x192.png`
- Create: `public/pwa-512x512.png`
- Create: `playwright.config.ts`
- Create: `tests/e2e/app.spec.ts`

- [ ] **Step 1: Create SVG favicon**

`public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#0f172a"/>
  <circle cx="32" cy="24" r="10" fill="#14b8a6"/>
  <path d="M18 42c4-7 9-10 14-10s10 3 14 10" fill="none" stroke="#f8fafc" stroke-width="5" stroke-linecap="round"/>
</svg>
```

- [ ] **Step 2: Generate PNG icons**

Run PowerShell with ImageMagick if available:

```powershell
magick public/favicon.svg -resize 192x192 public/pwa-192x192.png
magick public/favicon.svg -resize 512x512 public/pwa-512x512.png
```

If ImageMagick is not installed, use any local image editor to export the SVG into the two exact PNG paths above. Expected: both PNG files exist and are square.

- [ ] **Step 3: Create Playwright config**

`playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  webServer: {
    command: "npm run dev -- --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI
  },
  projects: [
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        baseURL: "http://127.0.0.1:5173"
      }
    }
  ]
});
```

- [ ] **Step 4: Create E2E smoke test**

`tests/e2e/app.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("home and review pages render in WebKit", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "个人英语口语训练器" })).toBeVisible();

  await page.getByRole("link", { name: "复盘" }).click();
  await expect(page.getByRole("heading", { name: "历史记录" })).toBeVisible();
});

test("practice page exposes recording controls", async ({ page }) => {
  await page.goto("/practice");
  await expect(page.getByRole("heading", { name: "录音练习" })).toBeVisible();
  await expect(page.getByRole("button", { name: "开始录音" })).toBeVisible();
});
```

- [ ] **Step 5: Install Playwright browser if needed**

Run:

```powershell
npx playwright install webkit
```

Expected: WebKit browser binaries are installed. If the command fails due to network restrictions, record the failure and run the unit tests/build only.

- [ ] **Step 6: Run E2E test**

Run:

```powershell
npm run e2e
```

Expected: both WebKit smoke tests pass.

- [ ] **Step 7: Run production build**

Run:

```powershell
npm run build
```

Expected: `dist/manifest.webmanifest`, service worker assets, JS, and CSS are generated.

- [ ] **Step 8: Commit if Git is available**

```powershell
git add public playwright.config.ts tests
git commit -m "test: add pwa assets and webkit smoke tests"
```

## Task 8: Manual Verification Checklist

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Create README with local run instructions**

`README.md`:

```md
# 个人英语口语训练器

这是一个本地优先的英语口语输出训练 PWA。第一阶段支持：

- 首页、练习页、历史页
- 浏览器麦克风录音
- 录音回放
- IndexedDB 本地保存
- PWA manifest 和 service worker 构建

## 本地运行

```powershell
npm install
npm run dev
```

打开 `http://127.0.0.1:5173`。

## 验证

```powershell
npm test
npm run build
npm run e2e
```

如果 Playwright WebKit 尚未安装，先运行：

```powershell
npx playwright install webkit
```

## 第一阶段人工验收

1. 打开首页，点击“开始练习”。
2. 在练习页点击“开始录音”，允许麦克风权限。
3. 说 5 到 10 秒英语，然后点击“停止录音”。
4. 确认页面出现音频播放器。
5. 点击“保存本轮录音”。
6. 进入“复盘”页，确认刚才的录音出现。
7. 刷新页面，确认记录仍然存在。
8. 点击删除按钮，确认记录可删除。
```

- [ ] **Step 2: Run final verification**

Run:

```powershell
npm test
npm run build
```

Expected: both commands pass.

- [ ] **Step 3: Start local dev server for user trial**

Run:

```powershell
npm run dev -- --host 127.0.0.1
```

Expected: Vite prints a local URL, usually `http://127.0.0.1:5173/`.

- [ ] **Step 4: Commit if Git is available**

```powershell
git add README.md
git commit -m "docs: add phase one verification guide"
```

## Self-Review

### Spec Coverage

- PWA shell: Task 1 and Task 7.
- Home, Practice, Review routes: Task 1.
- Recording: Task 3 and Task 5.
- Playback: Task 5 and Task 6.
- Local persistence: Task 2, Task 5, Task 6.
- No ASR/TTS/LLM in Phase 1: maintained by scope and no cloud API files.
- Chinese UI with English-speaking training purpose: Task 1 and Task 5.

### Known Follow-Up Plans

- Phase 2 plan: task packs, starter drill, picture description seed tasks.
- Phase 3 plan: local VAD and fluency metrics.
- Phase 4 plan: Tencent CloudBase deployment and Tencent ASR/TTS proxy.
