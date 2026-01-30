export const testConfig = {
  globals: true,
  environment: "jsdom",
  clearMocks: true,
  // Suppress `console` output in CI.
  silent: !!process.env.CI,
};
