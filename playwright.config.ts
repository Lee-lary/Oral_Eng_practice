import { defineConfig, devices } from '@playwright/test';

declare const process: {
  cwd: () => string;
  env: {
    CI?: string;
    PLAYWRIGHT_BROWSERS_PATH?: string;
    PLAYWRIGHT_EXTERNAL_SERVER?: string;
  };
};

process.env.PLAYWRIGHT_BROWSERS_PATH ??= `${process.cwd()}\\.tools\\ms-playwright`;
const useExternalServer = process.env.PLAYWRIGHT_EXTERNAL_SERVER === '1';

export default defineConfig({
  testDir: 'tests/e2e',
  webServer: useExternalServer
    ? undefined
    : {
        command: 'node ./node_modules/vite/bin/vite.js --host 127.0.0.1',
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
