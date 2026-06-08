import { defineConfig, devices } from '@playwright/test';

declare const process: {
  cwd: () => string;
  env: {
    CI?: string;
    PLAYWRIGHT_BROWSERS_PATH?: string;
  };
};

process.env.PLAYWRIGHT_BROWSERS_PATH ??= `${process.cwd()}\\.tools\\ms-playwright`;

export default defineConfig({
  testDir: 'tests/e2e',
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI
  },
  projects: [
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        baseURL: 'http://127.0.0.1:5173'
      }
    }
  ]
});
