import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appUrl = 'http://127.0.0.1:5173';
const startupTimeoutMs = 30_000;
const cliArgs = process.argv.slice(2);

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function isServerReady() {
  try {
    const response = await fetch(appUrl, { signal: AbortSignal.timeout(1_000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer() {
  const startedAt = Date.now();

  while (Date.now() - startedAt < startupTimeoutMs) {
    if (await isServerReady()) {
      return;
    }

    await delay(250);
  }

  throw new Error(`Timed out waiting for ${appUrl}`);
}

function runProcess(command, args, options = {}) {
  return spawn(command, args, {
    cwd: rootDir,
    env: process.env,
    shell: false,
    stdio: 'inherit',
    ...options
  });
}

function waitForExit(child) {
  return new Promise((resolve) => {
    child.once('exit', (code, signal) => {
      resolve({ code, signal });
    });
  });
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) {
    return;
  }

  child.kill();
  const result = await Promise.race([waitForExit(child), delay(5_000).then(() => null)]);
  if (!result && child.exitCode === null) {
    child.kill('SIGKILL');
    await Promise.race([waitForExit(child), delay(2_000)]);
  }
}

const hadExistingServer = await isServerReady();
const serverProcess = hadExistingServer
  ? null
  : runProcess(process.execPath, [
      path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js'),
      '--host',
      '127.0.0.1',
      '--port',
      '5173',
      '--strictPort'
    ]);

try {
  if (!hadExistingServer) {
    await waitForServer();
  }

  const playwrightEnv = {
    ...process.env,
    PLAYWRIGHT_EXTERNAL_SERVER: '1'
  };
  const playwrightProcess = spawn(
    process.execPath,
    [path.join(rootDir, 'node_modules', '@playwright', 'test', 'cli.js'), 'test', ...cliArgs],
    {
      cwd: rootDir,
      env: playwrightEnv,
      shell: false,
      stdio: 'inherit'
    }
  );
  const result = await waitForExit(playwrightProcess);
  process.exitCode = result.code ?? 1;
} finally {
  await stopServer(serverProcess);
}
