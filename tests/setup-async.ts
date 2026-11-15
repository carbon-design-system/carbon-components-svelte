// Loaded by `test:async`. Svelte's async-mode `tick()` resolves on whichever
// of `requestAnimationFrame` or `setTimeout` fires first, so it never settles
// under fake timers that fake both. Leave the frame timers real when a test
// doesn't name what to fake.
const useFakeTimers = vi.useFakeTimers.bind(vi);
vi.useFakeTimers = (config) =>
  useFakeTimers({
    ...config,
    toFake: config?.toFake ?? [
      "setTimeout",
      "clearTimeout",
      "setInterval",
      "clearInterval",
      "setImmediate",
      "clearImmediate",
      "Date",
      "hrtime",
      "performance",
      "requestIdleCallback",
      "cancelIdleCallback",
    ],
  });
