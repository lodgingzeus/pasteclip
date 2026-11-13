import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: 'browser.spec.ts',
  use: { baseURL: 'http://127.0.0.1:4173', launchOptions: process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {} },
  webServer: { command: 'npm run dev -- --port 4173', url: 'http://127.0.0.1:4173', env: { VITE_SUPABASE_URL: 'https://clipboard-test.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key' } },
});
