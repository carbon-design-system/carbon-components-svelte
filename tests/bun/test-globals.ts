import "./svelte-plugin.ts";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  test,
} from "bun:test";
import assert from "node:assert";
// biome-ignore lint/performance/noNamespaceImport: expect.extend() needs the whole matcher set; this subpath has no default export
import * as jestDomMatchers from "@testing-library/jest-dom/matchers";
import { vi } from "./vi-shim.ts";

// The vitest suites (tests-svelte3/4) use "@testing-library/jest-dom/vitest",
// which extends vitest's own `expect` object directly (`require("vitest").expect`)
// rather than reading a global — that's the wrong `expect` under bun:test, so
// we extend bun's `expect` with the framework-agnostic matchers export instead.
expect.extend(jestDomMatchers as never);

expect.extend({
  toHaveBeenCalledExactlyOnceWith(
    received: { mock?: { calls: unknown[][] } },
    ...expectedArgs: unknown[]
  ) {
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
Reflect.set(expect, "assert", (condition: unknown, message?: string) => {
  if (!condition) throw new Error(message ?? "Assertion failed");
});

// vitest's `expect.poll(callback, options).toBe(x)` retries `callback` (and
// the matcher) until it passes or times out. Bun's `expect` has no `.poll`,
// so proxy arbitrary matcher names onto a retry loop around a plain expect().
Reflect.set(
  expect,
  "poll",
  (
    callback: () => unknown,
    options?: { timeout?: number; interval?: number },
  ) => {
    // See tests/bun/vi-shim.ts's waitFor for why this is higher than
    // vitest's own 1000ms default: it was flaking on CI's slower hardware.
    const timeout = options?.timeout ?? 4000;
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
                // biome-ignore lint/performance/noAwaitInLoops: retries sequentially until the matcher stops throwing, can't be parallelized
                const value = await callback();
                // Call as `assertion[matcherName](...)`, not a detached
                // Reflect.get() reference — bun's matchers check `this
                // instanceof Expect` internally, so pulling the function out
                // and invoking it separately drops that binding and throws.
                const assertion = expect(value) as Record<
                  string,
                  (...args: unknown[]) => unknown
                >;
                assertion[matcherName](...args);
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
  },
);

// NOTE: bun:test's `expectTypeOf` throws on chains vitest supports, e.g.
// `.parameter(0).toEqualTypeOf<T>()`. Bun re-injects its own ambient
// `expectTypeOf` right before each test body runs (even after a preload- or
// beforeEach-registered override), so it can't be patched from here — the
// individual `it()` blocks that use `.parameter()` are skipped instead (see
// the migration skip list). Real type coverage for this project runs
// separately via `svelte-check`/`tsgo`, so this is a redundant runtime
// no-op check, not a coverage gap.

// @ts-expect-error
globalThis.describe = describe;
// @ts-expect-error
globalThis.it = it;
// @ts-expect-error
globalThis.test = test;
// @ts-expect-error
globalThis.expect = expect;
// @ts-expect-error
globalThis.vi = vi;
// @ts-expect-error
globalThis.beforeEach = beforeEach;
// @ts-expect-error
globalThis.afterEach = afterEach;
// @ts-expect-error
globalThis.beforeAll = beforeAll;
// @ts-expect-error
globalThis.afterAll = afterAll;
// vitest re-exports chai's `assert`, which has extra methods (e.g.
// `instanceOf`) beyond node:assert's core API — patch on what's used.
Reflect.set(
  assert,
  "instanceOf",
  (obj: unknown, cls: new (...args: never[]) => unknown, message?: string) => {
    if (!(obj instanceof cls))
      throw new Error(message ?? `expected instance of ${cls.name}`);
  },
);
// @ts-expect-error
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
