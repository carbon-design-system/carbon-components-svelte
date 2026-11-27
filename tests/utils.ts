/// <reference types="node" />

export const testConfig = {
  globals: true,
  environment: "jsdom",
  clearMocks: true,
  // Suppress `console` output in CI.
  silent: !!process.env.CI,
  // Builds jsdom once per worker instead of once per file, while still giving
  // each file a fresh global context. Roughly halves total CPU time vs `forks`.
  pool: "vmThreads" as const,
  // The first hook of a file waits for Vite to transform the component's
  // whole graph. RecurrencePicker pulls in the DatePicker, NumberInput, Select
  // and ToggleButtonGroup, which took over 10 s on a cold Svelte 3 shard.
  hookTimeout: 30_000,
};
