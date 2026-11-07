import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end checks of the built docs site: that lazily rendered content
 * never moves the page, in Chromium and in WebKit, which has no scroll
 * anchoring. Build the site first (`bun run build`); the tests serve
 * `dist` with `vite preview`.
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: { baseURL: "http://localhost:4175" },
  // After the device: its own viewport is shorter than the pages need.
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1400, height: 900 },
      },
    },
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1400, height: 900 },
      },
    },
  ],
  webServer: {
    command: "bunx vite preview --port 4175 --strictPort",
    port: 4175,
    reuseExistingServer: false,
  },
});
