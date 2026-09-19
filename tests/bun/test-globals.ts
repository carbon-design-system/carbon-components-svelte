import "./svelte-plugin.ts";
import assert from "node:assert";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, test } from "bun:test";
import * as jestDomMatchers from "@testing-library/jest-dom/matchers";
import { vi } from "./vi-shim.ts";

// The vitest suites (tests-svelte3/4) use "@testing-library/jest-dom/vitest",
// which extends vitest's own `expect` object directly (`require("vitest").expect`)
// rather than reading a global — that's the wrong `expect` under bun:test, so
// we extend bun's `expect` with the framework-agnostic matchers export instead.
expect.extend(jestDomMatchers as never);

expect.extend({
  toHaveBeenCalledExactlyOnceWith(received: { mock?: { calls: unknown[][] } }, ...expectedArgs: unknown[]) {
    const calls = received.mock?.calls ?? [];
    let pass = calls.length === 1;
    if (pass) {
      try {
        expect(calls[0]).toEqual(expectedArgs);
      } catch {
        pass = false;
      }
    }
    return {
      pass,
      message: () =>
        `expected mock to have been called exactly once with ${JSON.stringify(expectedArgs)}, ` +
        `but was called ${calls.length} time(s) with ${JSON.stringify(calls)}`,
    };
  },
});

// vitest's `expect.assert(condition)` is a type-narrowing runtime assertion —
// equivalent to Node's `assert()`, just namespaced under `expect`.
(expect as any).assert = (condition: unknown, message?: string) => {
  if (!condition) throw new Error(message ?? "Assertion failed");
};

// vitest's `expect.poll(callback, options).toBe(x)` retries `callback` (and
// the matcher) until it passes or times out. Bun's `expect` has no `.poll`,
// so proxy arbitrary matcher names onto a retry loop around a plain expect().
(expect as any).poll = (callback: () => unknown, options?: { timeout?: number; interval?: number }) => {
  const timeout = options?.timeout ?? 1000;
  const interval = options?.interval ?? 50;
  return new Proxy(
    {},
    {
      get(_target, matcherName: string) {
        return async (...args: unknown[]) => {
          const start = Date.now();
          let lastError: unknown;
          while (Date.now() - start < timeout) {
            try {
              const value = await callback();
              (expect(value) as any)[matcherName](...args);
              return;
            } catch (err) {
              lastError = err;
              await new Promise((r) => setTimeout(r, interval));
            }
          }
          throw lastError;
        };
      },
    },
  );
};

// NOTE: bun:test's `expectTypeOf` throws on chains vitest supports, e.g.
// `.parameter(0).toEqualTypeOf<T>()`. Bun re-injects its own ambient
// `expectTypeOf` right before each test body runs (even after a preload- or
// beforeEach-registered override), so it can't be patched from here — the
// individual `it()` blocks that use `.parameter()` are skipped instead (see
// the migration skip list). Real type coverage for this project runs
// separately via `svelte-check`/`tsgo`, so this is a redundant runtime
// no-op check, not a coverage gap.

// @ts-ignore
globalThis.describe = describe;
// @ts-ignore
globalThis.it = it;
// @ts-ignore
globalThis.test = test;
// @ts-ignore
globalThis.expect = expect;
// @ts-ignore
globalThis.vi = vi;
// @ts-ignore
globalThis.beforeEach = beforeEach;
// @ts-ignore
globalThis.afterEach = afterEach;
// @ts-ignore
globalThis.beforeAll = beforeAll;
// @ts-ignore
globalThis.afterAll = afterAll;
// vitest re-exports chai's `assert`, which has extra methods (e.g.
// `instanceOf`) beyond node:assert's core API — patch on what's used.
(assert as any).instanceOf = (obj: unknown, cls: new (...args: never[]) => unknown, message?: string) => {
  if (!(obj instanceof cls)) throw new Error(message ?? `expected instance of ${cls.name}`);
};
// @ts-ignore
globalThis.assert = assert;

await import("../utils/setup-globals.ts");

// @testing-library/svelte registers its own afterEach(cleanup) as a side
// effect the first time it's imported, but Bun shares one module cache and
// process across every test file in the run, so that registration only
// actually applies to whichever file happens to import it first. Register
// cleanup globally here instead so every file gets DOM teardown between
// tests.
const { cleanup } = await import("@testing-library/svelte");
afterEach(() => {
  cleanup();
});
