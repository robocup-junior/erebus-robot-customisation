import { defineConfig, devices } from '@playwright/test';

const PORT = 5174;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
    launchOptions: { args: ['--enable-unsafe-swiftshader'] },
  },
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
  },
});
