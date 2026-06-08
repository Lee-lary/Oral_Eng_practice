import { defineConfig, devices } from '@playwright/test';

declare const process: {
  env: {
    CI?: string;
  };
};

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
