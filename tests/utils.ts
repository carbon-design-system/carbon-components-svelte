/// <reference types="node" />

export const testConfig = {
  globals: true,
  environment: "jsdom",
  clearMocks: true,
  // Suppress `console` output in CI.
  silent: !!process.env.CI,
  // pool: forks — threads segfaults under `bun --bun` (CI).
  pool: "forks",
  experimental: {
    fsModuleCache: true,
  },
};
