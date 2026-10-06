/// <reference types="node" />

export const testConfig = {
  globals: true,
  environment: "jsdom",
  clearMocks: true,
  // Suppress `console` output in CI.
  silent: !!process.env.CI,
  fsModuleCache: true,
  // Builds jsdom once per worker instead of once per file, while still giving
  // each file a fresh global context. Roughly halves total CPU time vs `forks`.
  pool: "vmThreads" as const,
};
