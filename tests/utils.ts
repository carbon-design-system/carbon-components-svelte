/// <reference types="node" />

export const testConfig = {
  globals: true,
  environment: "happy-dom",
  clearMocks: true,
  // Suppress `console` output in CI.
  silent: !!process.env.CI,
};
