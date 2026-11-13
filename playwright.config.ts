import { defineConfig } from '@playwright/test';
export default defineConfig({
  timeout: 120000, expect: { timeout: 60000 }, testDir: './tests', testMatch: 'browser.spec.ts',
  use: { baseURL: 'http://127.0.0.1:4173', launchOptions: process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {} },
  webServer: { command: 'npm run dev -- --port 4173', url: 'http://127.0.0.1:4173' },
});
