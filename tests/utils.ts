/// <reference types="node" />

export const testConfig = {
  globals: true,
  environment: "jsdom",
  clearMocks: true,
  // Suppress `console` output in CI.
  silent: !!process.env.CI,
  // pool: threads is typically faster than forks on macOS CI runners.
  pool: "threads",
  experimental: {
    fsModuleCache: true,
  },
};
