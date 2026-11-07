/// <reference types="node" />

export const testConfig = {
  globals: true,
  // dom-env (../dom-env) instead of jsdom: same results, about half the CPU.
  // Resolved from each harness root (tests/, tests-svelte3/, tests-svelte4/).
  environment: "../dom-env/vitest.js",
  // Fail a test that leaves the library's window and document listeners
  // behind; see `tests/utils/setup-globals.ts`.
  environmentOptions: { domEnv: { leaks: true } },
  clearMocks: true,
  // Suppress `console` output in CI.
  silent: !!process.env.CI,
  // Gives each file a fresh global context without a new process per file.
  // dom-env only runs in this pool.
  pool: "vmThreads" as const,
};
