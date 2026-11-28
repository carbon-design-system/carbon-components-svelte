import { defineConfig, devices } from "@playwright/test";

/** Serves `dist`, so run `bun run build` first. */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: { baseURL: "http://localhost:4175" },
  // WebKit only: it has no scroll anchoring, so it's where the page moves.
  // After the device: its own viewport is shorter than the pages need.
  projects: [
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1400, height: 900 },
      },
    },
  ],
  webServer: {
    command: "bun run preview -p 4175 --quiet",
    port: 4175,
    reuseExistingServer: false,
  },
});
