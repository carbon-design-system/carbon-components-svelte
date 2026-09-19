import { setSystemTime as bunSetSystemTime, vi as bunVi } from "bun:test";

const stubbedGlobals = new Map<string, { had: boolean; value: unknown }>();

const originalSpyOn = bunVi.spyOn.bind(bunVi);

/**
 * bun:test's spyOn(obj, prop) can't wrap accessor (get/set) properties yet,
 * but vitest's 3-arg form (`vi.spyOn(obj, prop, "get")`) is used to fake
 * layout metrics like clientWidth/offsetWidth in jsdom. Implement it by hand
 * with a minimal vitest-mock-compatible surface (mockReturnValue/mockRestore).
 */
function spyOnAccessor(obj: object, prop: PropertyKey, kind: "get" | "set") {
  // The property (e.g. clientWidth) is usually inherited from a prototype
  // higher up (Element.prototype), not owned directly by `obj`, so an own
  // descriptor lookup is frequently undefined — that's expected, not a bug.
  const ownDescriptor = Object.getOwnPropertyDescriptor(obj, prop);
  const original = ownDescriptor?.[kind];
  let impl: ((...args: unknown[]) => unknown) | undefined = original;

  const mock = {
    mockReturnValue(value: unknown) {
      impl = () => value;
      return mock;
    },
    mockImplementation(fn: (...args: unknown[]) => unknown) {
      impl = fn;
      return mock;
    },
    mockRestore() {
      // Own descriptor existed before spying: put it back. Otherwise the
      // property we defined below (always configurable: true) just needs
      // removing so lookups fall through to the prototype chain again.
      if (ownDescriptor) Object.defineProperty(obj, prop, ownDescriptor);
      else Reflect.deleteProperty(obj, prop);
      return mock;
    },
  };

  Object.defineProperty(obj, prop, {
    configurable: true,
    enumerable: ownDescriptor?.enumerable ?? true,
    get:
      kind === "get"
        ? function (this: unknown) {
            return impl?.call(this);
          }
        : ownDescriptor?.get,
    set:
      kind === "set"
        ? function (this: unknown, v: unknown) {
            return impl?.call(this, v);
          }
        : ownDescriptor?.set,
  });

  return mock;
}

/**
 * Bun injects its own `vi` as a non-overridable ambient global per test
 * file, so `globalThis.vi = ourShim` gets silently discarded. Instead we
 * patch the methods vitest has that bun:test's `vi` doesn't directly onto
 * the object Bun hands out.
 */
export const vi = Object.assign(bunVi, {
  spyOn(obj: object, prop: PropertyKey, kind?: "get" | "set") {
    if (kind === "get" || kind === "set") return spyOnAccessor(obj, prop, kind);
    return originalSpyOn(obj as never, prop as never);
  },
  async waitFor<T>(
    callback: () => T | Promise<T>,
    options?: { timeout?: number; interval?: number },
  ): Promise<T> {
    const timeout = options?.timeout ?? 1000;
    const interval = options?.interval ?? 50;
    const start = Date.now();
    let lastError: unknown;
    while (Date.now() - start < timeout) {
      try {
        // biome-ignore lint/performance/noAwaitInLoops: retries sequentially until callback stops throwing, can't be parallelized
        return await callback();
      } catch (err) {
        lastError = err;
        await new Promise((r) => setTimeout(r, interval));
      }
    }
    throw lastError;
  },
  stubGlobal(name: string, value: unknown) {
    if (!stubbedGlobals.has(name)) {
      stubbedGlobals.set(name, {
        had: Object.hasOwn(globalThis, name),
        value: Reflect.get(globalThis, name),
      });
    }
    Reflect.set(globalThis, name, value);
    // `window` is a separate jsdom object from globalThis in this setup, so
    // source code reading `window.sessionStorage` etc. needs the stub
    // mirrored there too. jsdom defines some of these as getter-only, so a
    // plain assignment throws — redefine the property instead. Some
    // properties (e.g. jsdom's self-referential `window.window`) are
    // non-configurable and can't be overridden at all — best-effort only.
    const win = Reflect.get(globalThis, "window") as object | undefined;
    if (win && win !== globalThis) {
      try {
        Object.defineProperty(win, name, {
          value,
          configurable: true,
          writable: true,
        });
      } catch {}
    }
    return bunVi;
  },
  unstubAllGlobals() {
    for (const [name, entry] of stubbedGlobals) {
      if (entry.had) Reflect.set(globalThis, name, entry.value);
      else Reflect.deleteProperty(globalThis, name);
      const win = Reflect.get(globalThis, "window") as object | undefined;
      if (win && win !== globalThis) {
        try {
          Object.defineProperty(win, name, {
            value: entry.value,
            configurable: true,
            writable: true,
          });
        } catch {}
      }
    }
    stubbedGlobals.clear();
  },
  mocked<T>(item: T) {
    return item;
  },
  async advanceTimersByTimeAsync(ms: number) {
    bunVi.advanceTimersByTime(ms);
    await Promise.resolve();
    await new Promise((r) => setImmediate(r));
  },
  async runOnlyPendingTimersAsync() {
    bunVi.runOnlyPendingTimers();
    await Promise.resolve();
    await new Promise((r) => setImmediate(r));
  },
  resetModules() {
    console.warn("vi.resetModules() is a no-op under the bun:test shim");
  },
  setSystemTime(t?: number | Date) {
    bunSetSystemTime(t);
  },
});
