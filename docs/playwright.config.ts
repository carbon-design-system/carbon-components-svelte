import { defineConfig, devices } from "@playwright/test";

/** Serves `dist`, so run `bun run build` first. */
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
