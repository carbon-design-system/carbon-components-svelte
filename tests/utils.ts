/// <reference types="node" />

export const testConfig = {
  globals: true,
  // dom-env (../dom-env) instead of jsdom: same results, about half the CPU.
  // Resolved from each harness root (tests/, tests-svelte3/, tests-svelte4/).
  environment: "../dom-env/vitest.js",
  clearMocks: true,
  // Suppress `console` output in CI.
  silent: !!process.env.CI,
  fsModuleCache: true,
  // Gives each file a fresh global context without a new process per file.
  // dom-env only runs in this pool.
  pool: "vmThreads" as const,
  // Pre-bundle node_modules, so each test file evaluates a few bundled
  // modules instead of hundreds of separate ones from Svelte, testing-library,
  // and the icon set.
  deps: { optimizer: { client: { enabled: true } } },
};
