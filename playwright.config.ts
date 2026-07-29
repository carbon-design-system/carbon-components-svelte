import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  workers: process.env.CI ? 4 : undefined,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: {
    baseURL: "http://localhost:4173",
  },
  projects: process.env.CI
    ? [
        {
          // Reuse the Chrome preinstalled on GitHub-hosted runners instead of
          // downloading Playwright's bundled Chromium.
          name: "chromium",
          use: { ...devices["Desktop Chrome"], channel: "chrome" },
        },
      ]
    : [
        { name: "chromium", use: { ...devices["Desktop Chrome"] } },
        { name: "firefox", use: { ...devices["Desktop Firefox"] } },
        { name: "webkit", use: { ...devices["Desktop Safari"] } },
      ],
  webServer: {
    // In CI, serve a production build via `vite preview`: bundled static assets
    // load far faster and with less variance than the dev server, which
    // transforms modules on demand through a single process. Locally, keep the
    // dev server for fast iteration (HMR, no build step).
    command: process.env.CI
      ? "bunx vite build --config e2e/vite.config.ts && bunx vite preview --config e2e/vite.config.ts --port 4173 --strictPort"
      : "bunx vite --config e2e/vite.config.ts --port 4173",
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
});
