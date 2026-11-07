// @vitest-environment node
import { createSuggestSource } from "../../src/InlineSuggest/suggest-source.js";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("createSuggestSource", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("answers a sync function at once and an async one when it settles", async () => {
    const onResult = vi.fn();
    const source = createSuggestSource(onResult);

    source.ask(() => " world", "hello");
    expect(onResult).toHaveBeenLastCalledWith(" world", "hello");

    const slow = deferred<string>();
    source.ask(() => slow.promise, "hi");
    expect(source.isPending()).toBe(true);
    slow.resolve(" there");
    await slow.promise;
    expect(onResult).toHaveBeenLastCalledWith(" there", "hi");
    expect(source.isPending()).toBe(false);
  });

  it("drops a slow older answer after a newer request, even when the signal is ignored", async () => {
    const onResult = vi.fn();
    const source = createSuggestSource(onResult);
    const first = deferred<string>();
    const second = deferred<string>();

    source.ask(() => first.promise, "a");
    source.ask(() => second.promise, "ab");
    second.resolve("c");
    await second.promise;
    first.resolve("STALE");
    await first.promise;

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith("c", "ab");
  });

  it("aborts the signal of the request it replaces", () => {
    const source = createSuggestSource(() => {});
    const signals: AbortSignal[] = [];
    const load = (_: string, { signal }: { signal: AbortSignal }) => {
      signals.push(signal);
      return new Promise<string>(() => {});
    };
    source.ask(load, "a");
    source.ask(load, "ab");
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
    source.cancel();
    expect(signals[1].aborted).toBe(true);
  });

  it("waits for quiet before calling, and only calls for the last value", () => {
    vi.useFakeTimers();
    const load = vi.fn(() => "x");
    const onResult = vi.fn();
    const source = createSuggestSource(onResult);

    source.ask(load, "a", 150);
    vi.advanceTimersByTime(100);
    source.ask(load, "ab", 150);
    vi.advanceTimersByTime(149);
    expect(load).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(load).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith("x", "ab");
  });

  it("reports nothing after cancel", () => {
    vi.useFakeTimers();
    const onResult = vi.fn();
    const source = createSuggestSource(onResult);
    source.ask(() => "late", "a", 100);
    source.cancel();
    vi.advanceTimersByTime(200);
    expect(onResult).not.toHaveBeenCalled();
  });

  it("turns a throw, a rejection or a non-string into no suggestion", async () => {
    const onResult = vi.fn();
    const source = createSuggestSource(onResult);

    source.ask(() => {
      throw new Error("down");
    }, "a");
    expect(onResult).toHaveBeenLastCalledWith("", "a");

    const failing = deferred<string>();
    source.ask(() => failing.promise, "b");
    failing.reject(new Error("down"));
    await failing.promise.catch(() => {});
    await Promise.resolve();
    expect(onResult).toHaveBeenLastCalledWith("", "b");

    source.ask(() => undefined, "c");
    expect(onResult).toHaveBeenLastCalledWith("", "c");
  });
});
