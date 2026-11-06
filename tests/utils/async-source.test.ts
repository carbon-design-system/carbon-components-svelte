// @vitest-environment node
import {
  type AsyncStatusEdge,
  createAsyncSource,
  createPagedSource,
} from "../../src/utils/async-source.js";

// The tests answer with arrays, numbers and objects.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Answer = any;

type Call = {
  query: string;
  signal: AbortSignal;
  cursor?: unknown;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
};

/** A fetcher whose calls are answered by hand. */
function manual() {
  const calls: Call[] = [];
  const fetcher = vi.fn(
    (query: string, context: { signal: AbortSignal; cursor?: unknown }) =>
      new Promise<Answer>((resolve, reject) => {
        calls.push({
          query,
          signal: context.signal,
          cursor: context.cursor,
          resolve,
          reject,
        });
      }),
  );
  return { calls, fetcher };
}

function abortError() {
  const error = new Error("Aborted");
  error.name = "AbortError";
  return error;
}

/** A fetcher that answers `query` after `latency` ms, and honors `signal`. */
function delayed(latency: number, { honorSignal = true } = {}) {
  const calls: { query: string; signal: AbortSignal }[] = [];
  const fetcher = (query: string, { signal }: { signal: AbortSignal }) => {
    calls.push({ query, signal });
    return new Promise<string[]>((resolve, reject) => {
      const timer = setTimeout(() => resolve([`${query}-result`]), latency);
      if (honorSignal) {
        signal.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(abortError());
        });
      }
    });
  };
  return { calls, fetcher };
}

const open: (() => void)[] = [];

function watch<S>(source: {
  subscribe: (run: (state: S) => void) => () => void;
}) {
  const states: S[] = [];
  const unsubscribe = source.subscribe((state) => states.push(state));
  open.push(unsubscribe);
  return {
    states,
    unsubscribe,
    get last() {
      return states[states.length - 1];
    },
  };
}

/** Let promise callbacks run without moving the clock. */
async function settle() {
  await vi.advanceTimersByTimeAsync(0);
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  // A leftover subscriber keeps the shared `online` listener on a stale window.
  for (const unsubscribe of open.splice(0)) unsubscribe();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("createAsyncSource", () => {
  describe("creation", () => {
    it("starts no timer, no request and no listener", () => {
      const fetcher = vi.fn(() => [1]);
      const addEventListener = vi.fn();
      vi.stubGlobal("window", { addEventListener });
      createAsyncSource(fetcher, { debounce: 100, cache: { max: 5 } });
      expect(vi.getTimerCount()).toBe(0);
      expect(fetcher).not.toHaveBeenCalled();
      expect(addEventListener).not.toHaveBeenCalled();
    });

    it("is idle with no data", () => {
      const source = createAsyncSource(() => [1]);
      expect(source.get()).toEqual({
        status: "idle",
        data: undefined,
        error: undefined,
        query: undefined,
        stale: false,
      });
    });

    it("subscribing on the server starts nothing", () => {
      expect(typeof window).toBe("undefined");
      const source = createAsyncSource(() => [1]);
      const { unsubscribe } = watch(source);
      expect(vi.getTimerCount()).toBe(0);
      unsubscribe();
      expect(vi.getTimerCount()).toBe(0);
    });

    it("starts from initial data and caches it for its query", async () => {
      const fetcher = vi.fn((q: string) => [q]);
      const source = createAsyncSource(fetcher, {
        initialData: ["seed"],
        initialQuery: "ab",
        cache: { ttl: 1000 },
      });
      expect(source.get()).toMatchObject({
        status: "success",
        data: ["seed"],
        query: "ab",
        stale: false,
      });
      await source.set("ab");
      await source.set("zz");
      await settle();
      await source.set("ab");
      expect(source.get().data).toEqual(["seed"]);
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(fetcher).toHaveBeenCalledWith("zz", expect.anything());
    });
  });

  describe("set", () => {
    it("is loading at once and calls the fetcher after the debounce", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher, { debounce: 150 });
      const view = watch(source);
      source.set("a");
      expect(view.last).toMatchObject({
        status: "loading",
        query: "a",
        data: undefined,
      });
      vi.advanceTimersByTime(149);
      expect(fetcher).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(calls).toHaveLength(1);
      calls[0].resolve(["A"]);
      await settle();
      expect(view.last).toMatchObject({
        status: "success",
        query: "a",
        data: ["A"],
        stale: false,
      });
    });

    it("restarts the debounce on each query and fetches only the last", () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher, { debounce: 100 });
      watch(source);
      source.set("a");
      vi.advanceTimersByTime(60);
      source.set("ab");
      vi.advanceTimersByTime(60);
      source.set("abc");
      vi.advanceTimersByTime(99);
      expect(fetcher).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(calls.map((call) => call.query)).toEqual(["abc"]);
    });

    it("calls the fetcher at once with no debounce", () => {
      const { fetcher } = manual();
      const source = createAsyncSource(fetcher);
      watch(source);
      source.set("a");
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it("resolves when the answer is shown, and when it is replaced", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher);
      watch(source);
      const first = source.set("a");
      const second = source.set("b");
      await first;
      expect(source.get().status).toBe("loading");
      calls[1].resolve(["B"]);
      await second;
      expect(source.get().data).toEqual(["B"]);
    });

    it("does nothing for the query that is already current", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher, { debounce: 50 });
      const view = watch(source);
      source.set("a");
      source.set("a");
      vi.advanceTimersByTime(50);
      source.set("a");
      expect(calls).toHaveLength(1);
      calls[0].resolve(["A"]);
      await settle();
      const count = view.states.length;
      source.set("a");
      expect(view.states).toHaveLength(count);
      expect(calls).toHaveLength(1);
    });

    it("keys an object query with JSON, or with `key`", () => {
      const fetcher = vi.fn((q: { page: number }) => q.page);
      const source = createAsyncSource(fetcher);
      watch(source);
      source.set({ page: 1 } as never);
      source.set({ page: 1 } as never);
      expect(fetcher).toHaveBeenCalledTimes(1);

      const byId = vi.fn((q: { id: number; at: number }) => q.id);
      const keyed = createAsyncSource(byId, { key: (q) => String(q.id) });
      watch(keyed);
      keyed.set({ id: 1, at: 1 });
      keyed.set({ id: 1, at: 2 });
      expect(byId).toHaveBeenCalledTimes(1);
    });
  });

  describe("races", () => {
    it("shows only the newest answer when an older one arrives last", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher);
      const view = watch(source);
      source.set("a");
      source.set("ab");
      calls[1].resolve(["AB"]);
      await settle();
      calls[0].resolve(["A"]);
      await settle();
      expect(view.last).toMatchObject({ status: "success", data: ["AB"] });
      expect(view.states.some((state) => state.data?.[0] === "A")).toBe(false);
    });

    it("drops an older answer from a source that ignores the signal", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher);
      const view = watch(source);
      source.set("a");
      source.set("ab");
      expect(calls[0].signal.aborted).toBe(true);
      // The source never looks at the signal and answers anyway.
      calls[0].resolve(["A"]);
      await settle();
      expect(view.last).toMatchObject({ status: "loading", query: "ab" });
      calls[1].resolve(["AB"]);
      await settle();
      expect(view.last.data).toEqual(["AB"]);
    });

    it("drops an older failure from a source that ignores the signal", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher);
      const view = watch(source);
      source.set("a");
      source.set("ab");
      calls[0].reject(new Error("late"));
      await settle();
      expect(view.last.status).toBe("loading");
      calls[1].resolve(["AB"]);
      await settle();
      expect(view.last).toMatchObject({ status: "success", error: undefined });
    });

    it("aborts the signal of the request a newer query replaces", () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher);
      watch(source);
      source.set("a");
      expect(calls[0].signal.aborted).toBe(false);
      source.set("b");
      expect(calls[0].signal.aborted).toBe(true);
      expect(calls[1].signal.aborted).toBe(false);
    });

    it("reads an AbortError from a source that honors the signal as nothing", async () => {
      const { calls, fetcher } = delayed(300);
      const source = createAsyncSource(fetcher);
      const view = watch(source);
      source.set("a");
      source.set("b");
      await vi.advanceTimersByTimeAsync(300);
      expect(view.states.map((state) => state.status)).toEqual([
        "idle",
        "loading",
        "loading",
        "success",
      ]);
      expect(view.last).toMatchObject({ query: "b", data: ["b-result"] });
      expect(calls[0].signal.aborted).toBe(true);
    });

    it("caches an older answer that arrives late", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher, { cache: { ttl: 10_000 } });
      watch(source);
      source.set("a");
      source.set("b");
      calls[0].resolve(["A"]);
      await settle();
      calls[1].resolve(["B"]);
      await settle();
      await source.set("a");
      expect(source.get()).toMatchObject({ status: "success", data: ["A"] });
      expect(calls).toHaveLength(2);
    });
  });

  describe("keepPrevious", () => {
    it("keeps the last answer, as stale, while the next query loads", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher);
      const view = watch(source);
      source.set("a");
      calls[0].resolve(["A"]);
      await settle();
      source.set("ab");
      expect(view.last).toMatchObject({
        status: "loading",
        query: "ab",
        data: ["A"],
        stale: true,
      });
      calls[1].resolve(["AB"]);
      await settle();
      expect(view.last).toMatchObject({ data: ["AB"], stale: false });
    });

    it("drops the last answer with keepPrevious: false", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher, { keepPrevious: false });
      const view = watch(source);
      source.set("a");
      calls[0].resolve(["A"]);
      await settle();
      source.set("ab");
      expect(view.last).toMatchObject({ data: undefined, stale: false });
    });

    it("never shows an answer to an older query while a newer one loads", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher);
      const view = watch(source);
      source.set("a");
      calls[0].resolve(["A"]);
      await settle();
      source.set("ab");
      source.set("abc");
      calls[1].resolve(["AB"]);
      await settle();
      expect(view.last).toMatchObject({
        status: "loading",
        query: "abc",
        data: ["A"],
        stale: true,
      });
    });
  });

  describe("minLength", () => {
    it("leaves a short query idle and fetches nothing", () => {
      const { fetcher } = manual();
      const source = createAsyncSource(fetcher, { minLength: 2 });
      const view = watch(source);
      source.set("a");
      expect(view.last).toMatchObject({ status: "idle", query: "a" });
      expect(fetcher).not.toHaveBeenCalled();
    });

    it("counts the trimmed query", () => {
      const { fetcher } = manual();
      const source = createAsyncSource(fetcher, { minLength: 2 });
      watch(source);
      source.set("a   ");
      expect(fetcher).not.toHaveBeenCalled();
      source.set("ab");
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it("clears the answer and aborts the request when the query gets short", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher, { minLength: 2 });
      const view = watch(source);
      source.set("ab");
      calls[0].resolve(["AB"]);
      await settle();
      source.set("abc");
      source.set("a");
      expect(calls[1].signal.aborted).toBe(true);
      expect(view.last).toMatchObject({
        status: "idle",
        data: undefined,
        query: "a",
      });
    });

    it("does not apply to a query that is not a string", () => {
      const fetcher = vi.fn(() => 1);
      const source = createAsyncSource<number, { id: number }>(fetcher, {
        minLength: 5,
      });
      watch(source);
      source.set({ id: 1 });
      expect(fetcher).toHaveBeenCalledTimes(1);
    });
  });

  describe("cache", () => {
    it("shows a fresh answer at once, with no request and no debounce", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher, {
        debounce: 200,
        cache: { ttl: 5000 },
      });
      const view = watch(source);
      source.set("a");
      vi.advanceTimersByTime(200);
      calls[0].resolve(["A"]);
      await settle();
      source.set("b");
      source.set("a");
      expect(view.last).toMatchObject({
        status: "success",
        query: "a",
        data: ["A"],
        stale: false,
      });
      expect(vi.getTimerCount()).toBe(0);
      expect(calls[1]).toBeUndefined();
    });

    it("aborts the request of the query it replaces when it hits", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher, { cache: { ttl: 5000 } });
      watch(source);
      source.set("a");
      calls[0].resolve(["A"]);
      await settle();
      source.set("b");
      source.set("a");
      expect(calls[1].signal.aborted).toBe(true);
    });

    it("fetches again once the ttl has passed, showing the old answer as stale", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher, { cache: { ttl: 1000 } });
      const view = watch(source);
      source.set("a");
      calls[0].resolve(["old"]);
      await settle();
      source.set("b");
      calls[1].resolve(["B"]);
      await settle();
      vi.advanceTimersByTime(999);
      source.set("a");
      expect(view.last).toMatchObject({ status: "success", data: ["old"] });
      source.set("b");
      vi.advanceTimersByTime(1);
      source.set("a");
      expect(view.last).toMatchObject({
        status: "loading",
        data: ["old"],
        stale: true,
      });
      calls[2].resolve(["new"]);
      await settle();
      expect(view.last).toMatchObject({
        status: "success",
        data: ["new"],
        stale: false,
      });
    });

    it("with the default ttl of 0 always fetches, behind the cached answer", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher);
      const view = watch(source);
      source.set("a");
      calls[0].resolve(["A1"]);
      await settle();
      source.set("b");
      calls[1].resolve(["B"]);
      await settle();
      source.set("a");
      expect(view.last).toMatchObject({
        status: "loading",
        data: ["A1"],
        stale: true,
      });
      expect(calls).toHaveLength(3);
    });

    it("evicts the least recently used query past max", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher, {
        cache: { max: 2, ttl: 60_000 },
      });
      watch(source);
      for (const query of ["a", "b"]) {
        source.set(query);
        calls[calls.length - 1].resolve([query]);
        // eslint-disable-next-line no-await-in-loop -- each step needs the previous one's timers.
        await settle();
      }
      // Use "a", so "b" is the oldest.
      source.set("b");
      source.set("a");
      source.set("c");
      calls[2].resolve(["c"]);
      await settle();
      const before = calls.length;
      source.set("a");
      expect(calls).toHaveLength(before);
      source.set("b");
      expect(calls).toHaveLength(before + 1);
    });

    it("keeps nothing with cache: false", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher, { cache: false });
      const view = watch(source);
      source.set("a");
      calls[0].resolve(["A"]);
      await settle();
      source.set("b");
      calls[1].resolve(["B"]);
      await settle();
      source.set("a");
      expect(calls).toHaveLength(3);
      expect(view.last).toMatchObject({ status: "loading", stale: true });
      // The previous answer (b's) is what shows, not a cached one.
      expect(view.last.data).toEqual(["B"]);
    });

    it("invalidate drops one query or all", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher, { cache: { ttl: 60_000 } });
      watch(source);
      for (const query of ["a", "b", "c"]) {
        source.set(query);
        calls[calls.length - 1].resolve([query]);
        // eslint-disable-next-line no-await-in-loop -- each step needs the previous one's timers.
        await settle();
      }
      source.invalidate("a");
      source.set("a");
      expect(calls).toHaveLength(4);
      calls[3].resolve(["a2"]);
      await settle();
      source.set("b");
      expect(calls).toHaveLength(4);
      source.invalidate();
      source.set("c");
      expect(calls).toHaveLength(5);
    });

    it("does not cache an answer that was asked for before an invalidate", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher, { cache: { ttl: 60_000 } });
      const view = watch(source);
      source.set("a");
      source.invalidate();
      calls[0].resolve(["before"]);
      await settle();
      // The answer still shows, once.
      expect(view.last.data).toEqual(["before"]);
      source.set("b");
      calls[1].resolve(["B"]);
      await settle();
      source.set("a");
      expect(calls).toHaveLength(3);
    });
  });

  describe("dedupe", () => {
    it("a set joins a prefetch of the same query in flight", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher);
      const view = watch(source);
      const prefetched = source.prefetch("a");
      source.set("a");
      expect(calls).toHaveLength(1);
      expect(view.last.status).toBe("loading");
      calls[0].resolve(["A"]);
      await prefetched;
      expect(view.last).toMatchObject({ status: "success", data: ["A"] });
    });

    it("a prefetch fills the cache without changing the state", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher, { cache: { ttl: 60_000 } });
      const view = watch(source);
      source.prefetch("a");
      source.prefetch("a");
      expect(calls).toHaveLength(1);
      calls[0].resolve(["A"]);
      await settle();
      expect(view.states).toHaveLength(1);
      expect(view.last.status).toBe("idle");
      source.set("a");
      expect(view.last).toMatchObject({ status: "success", data: ["A"] });
      expect(calls).toHaveLength(1);
    });

    it("peek reads the cache without a request or a use", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher, { cache: { max: 2 } });
      watch(source);
      expect(source.peek("a")).toBeUndefined();
      source.prefetch("a");
      calls[0].resolve(["A"]);
      await settle();
      source.prefetch("b");
      calls[1].resolve(["B"]);
      await settle();
      expect(source.peek("a")).toEqual(["A"]);
      // Peeking at "a" did not save it from being the oldest.
      source.prefetch("c");
      calls[2].resolve(["C"]);
      await settle();
      expect(source.peek("a")).toBeUndefined();
      expect(source.peek("b")).toEqual(["B"]);
      expect(calls).toHaveLength(3);
    });

    it("a prefetch is not aborted by a newer query", () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher);
      watch(source);
      source.prefetch("a");
      source.set("b");
      expect(calls[0].signal.aborted).toBe(false);
    });

    it("a prefetch fails quietly", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher);
      const view = watch(source);
      const done = source.prefetch("a");
      calls[0].reject(new Error("no"));
      await done;
      expect(view.last.status).toBe("idle");
    });

    it("a prefetch below minLength does nothing", () => {
      const { fetcher } = manual();
      const source = createAsyncSource(fetcher, { minLength: 3 });
      source.prefetch("ab");
      expect(fetcher).not.toHaveBeenCalled();
    });

    it("refresh aborts the request in flight and asks again", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher);
      const view = watch(source);
      source.set("a");
      calls[0].resolve(["old"]);
      await settle();
      source.refresh();
      expect(view.last).toMatchObject({
        status: "loading",
        data: ["old"],
        stale: true,
      });
      source.refresh();
      expect(calls[1].signal.aborted).toBe(true);
      calls[2].resolve(["new"]);
      await settle();
      expect(view.last).toMatchObject({ status: "success", data: ["new"] });
    });

    it("refresh skips the debounce and keeps its own answer even without keepPrevious", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher, {
        debounce: 500,
        keepPrevious: false,
      });
      const view = watch(source);
      source.set("a");
      vi.advanceTimersByTime(500);
      calls[0].resolve(["A"]);
      await settle();
      source.refresh();
      expect(calls).toHaveLength(2);
      expect(view.last.data).toEqual(["A"]);
    });

    it("refresh with no query does nothing", async () => {
      const { fetcher } = manual();
      const source = createAsyncSource(fetcher);
      await source.refresh();
      expect(fetcher).not.toHaveBeenCalled();
    });
  });

  describe("sync fetcher", () => {
    it("answers without ever showing loading", () => {
      const source = createAsyncSource((q: string) => [q.toUpperCase()]);
      const view = watch(source);
      source.set("a");
      expect(view.states.map((state) => state.status)).toEqual([
        "idle",
        "success",
      ]);
      expect(view.last.data).toEqual(["A"]);
    });

    it("turns a throw into an error", () => {
      const error = new Error("boom");
      const source = createAsyncSource((): string[] => {
        throw error;
      });
      const view = watch(source);
      source.set("a");
      expect(view.last).toMatchObject({ status: "error", error });
    });
  });

  describe("errors", () => {
    it("reports a rejection with the error and no data", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher);
      const view = watch(source);
      source.set("a");
      calls[0].resolve(["A"]);
      await settle();
      const error = new Error("down");
      source.set("ab");
      calls[1].reject(error);
      await settle();
      expect(view.last).toEqual({
        status: "error",
        data: undefined,
        error,
        query: "ab",
        stale: false,
      });
    });

    it("recovers on the next input", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher);
      const view = watch(source);
      source.set("a");
      calls[0].reject(new Error("down"));
      await settle();
      source.set("ab");
      expect(view.last).toMatchObject({ status: "loading", error: undefined });
      calls[1].resolve(["AB"]);
      await settle();
      expect(view.last).toMatchObject({ status: "success", data: ["AB"] });
    });

    it("tries the same query again when it is set after a failure", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher);
      const view = watch(source);
      source.set("a");
      calls[0].reject(new Error("down"));
      await settle();
      source.set("a");
      expect(calls).toHaveLength(2);
      calls[1].resolve(["A"]);
      await settle();
      expect(view.last.status).toBe("success");
    });

    it("keeps the same query's answer when a refresh fails", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher);
      const view = watch(source);
      source.set("a");
      calls[0].resolve(["A"]);
      await settle();
      source.refresh();
      calls[1].reject(new Error("down"));
      await settle();
      expect(view.last).toMatchObject({
        status: "error",
        data: ["A"],
        stale: true,
      });
    });

    it("a failed older request does not disturb a newer one", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher);
      const view = watch(source);
      source.set("a");
      source.set("b");
      calls[0].reject(new Error("a failed"));
      await settle();
      calls[1].resolve(["B"]);
      await settle();
      expect(view.states.some((state) => state.status === "error")).toBe(false);
    });

    it("never rejects the promise from set", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher);
      watch(source);
      const done = source.set("a");
      calls[0].reject(new Error("down"));
      await expect(done).resolves.toBeUndefined();
    });
  });

  describe("retry", () => {
    it("backs off 500, 1000, 2000 ms and then gives up", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher, { retry: 3 });
      const view = watch(source);
      source.set("a");
      for (const wait of [500, 1000, 2000]) {
        calls[calls.length - 1].reject(new Error("down"));
        // eslint-disable-next-line no-await-in-loop -- each step needs the previous one's timers.
        await settle();
        expect(view.last.status).toBe("loading");
        const seen = calls.length;
        // eslint-disable-next-line no-await-in-loop -- each step needs the previous one's timers.
        await vi.advanceTimersByTimeAsync(wait - 1);
        expect(calls).toHaveLength(seen);
        // eslint-disable-next-line no-await-in-loop -- each step needs the previous one's timers.
        await vi.advanceTimersByTimeAsync(1);
        expect(calls).toHaveLength(seen + 1);
      }
      calls[calls.length - 1].reject(new Error("still down"));
      await settle();
      expect(calls).toHaveLength(4);
      expect(view.last).toMatchObject({ status: "error" });
      expect(vi.getTimerCount()).toBe(0);
    });

    it("succeeds on a later attempt without ever showing an error", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher, { retry: { delay: 10 } });
      const view = watch(source);
      source.set("a");
      calls[0].reject(new Error("down"));
      await vi.advanceTimersByTimeAsync(10);
      calls[1].resolve(["A"]);
      await settle();
      expect(view.states.map((state) => state.status)).toEqual([
        "idle",
        "loading",
        "success",
      ]);
    });

    it("takes a delay function and a `when` filter", async () => {
      const { calls, fetcher } = manual();
      const delay = vi.fn((attempt: number) => 100 * (attempt + 1));
      const source = createAsyncSource(fetcher, {
        retry: {
          count: 5,
          delay,
          when: (error) => (error as { status?: number }).status !== 404,
        },
      });
      const view = watch(source);
      source.set("a");
      calls[0].reject({ status: 503 });
      await vi.advanceTimersByTimeAsync(100);
      expect(calls).toHaveLength(2);
      calls[1].reject({ status: 404 });
      await settle();
      expect(calls).toHaveLength(2);
      expect(view.last.status).toBe("error");
      expect(delay).toHaveBeenCalledTimes(1);
    });

    it("stops retrying when a newer query replaces it", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher, { retry: { delay: 1000 } });
      watch(source);
      source.set("a");
      calls[0].reject(new Error("down"));
      await settle();
      expect(vi.getTimerCount()).toBe(1);
      source.set("b");
      expect(vi.getTimerCount()).toBe(0);
      await vi.advanceTimersByTimeAsync(5000);
      expect(calls.map((call) => call.query)).toEqual(["a", "b"]);
    });

    it("does not retry an aborted request", async () => {
      const { calls, fetcher } = delayed(100);
      const source = createAsyncSource(fetcher, { retry: 3 });
      watch(source);
      source.set("a");
      source.set("b");
      await vi.advanceTimersByTimeAsync(10_000);
      expect(calls.map((call) => call.query)).toEqual(["a", "b"]);
    });

    it("retries a sync throw", async () => {
      let attempts = 0;
      const source = createAsyncSource(
        () => {
          attempts++;
          if (attempts < 2) throw new Error("not yet");
          return ["ok"];
        },
        { retry: { delay: 5 } },
      );
      const view = watch(source);
      source.set("a");
      expect(view.last.status).toBe("loading");
      await vi.advanceTimersByTimeAsync(5);
      expect(view.last).toMatchObject({ status: "success", data: ["ok"] });
    });
  });

  describe("cancel, reset and subscribers", () => {
    it("cancel aborts and goes back to the last answer", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher, { debounce: 50 });
      const view = watch(source);
      source.set("a");
      vi.advanceTimersByTime(50);
      calls[0].resolve(["A"]);
      await settle();
      source.set("ab");
      vi.advanceTimersByTime(50);
      source.cancel();
      expect(calls[1].signal.aborted).toBe(true);
      expect(view.last).toMatchObject({
        status: "success",
        query: "a",
        data: ["A"],
      });
      // The cancelled query can be set again.
      source.set("ab");
      vi.advanceTimersByTime(50);
      expect(calls).toHaveLength(3);
    });

    it("cancel during the debounce calls nothing", () => {
      const { fetcher } = manual();
      const source = createAsyncSource(fetcher, { debounce: 100 });
      const view = watch(source);
      source.set("a");
      source.cancel();
      vi.advanceTimersByTime(500);
      expect(fetcher).not.toHaveBeenCalled();
      expect(view.last.status).toBe("idle");
      expect(vi.getTimerCount()).toBe(0);
    });

    it("cancel with nothing in progress does nothing", () => {
      const { fetcher } = manual();
      const source = createAsyncSource(fetcher);
      const view = watch(source);
      source.cancel();
      expect(view.states).toHaveLength(1);
    });

    it("reset forgets the answer but keeps the cache", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher, { cache: { ttl: 60_000 } });
      const view = watch(source);
      source.set("a");
      calls[0].resolve(["A"]);
      await settle();
      source.set("b");
      source.reset();
      expect(calls[1].signal.aborted).toBe(true);
      expect(view.last).toMatchObject({ status: "idle", data: undefined });
      source.set("a");
      expect(view.last).toMatchObject({ status: "success", data: ["A"] });
    });

    it("aborts the request when the last subscriber leaves", () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher, { debounce: 100 });
      const one = watch(source);
      const two = watch(source);
      source.set("a");
      vi.advanceTimersByTime(100);
      one.unsubscribe();
      expect(calls[0].signal.aborted).toBe(false);
      two.unsubscribe();
      expect(calls[0].signal.aborted).toBe(true);
    });

    it("clears a pending debounce when the last subscriber leaves", () => {
      const { fetcher } = manual();
      const source = createAsyncSource(fetcher, { debounce: 100 });
      const view = watch(source);
      source.set("a");
      view.unsubscribe();
      expect(vi.getTimerCount()).toBe(0);
      vi.advanceTimersByTime(1000);
      expect(fetcher).not.toHaveBeenCalled();
    });

    it("leaves a prefetch running when the last subscriber leaves", () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher);
      const view = watch(source);
      source.prefetch("a");
      view.unsubscribe();
      expect(calls[0].signal.aborted).toBe(false);
    });

    it("a subscriber that leaves while it is notified does not skip the others", () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher);
      const seen: string[] = [];
      let first = () => {};
      first = source.subscribe((state) => {
        if (state.status === "loading") first();
      });
      source.subscribe((state) => seen.push(state.status));
      source.set("a");
      expect(seen).toEqual(["idle", "loading"]);
      calls[0].resolve([1]);
    });
  });

  describe("onStatus", () => {
    it("reports loading once, then the arrival, with the count", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource<string[]>(fetcher);
      const edges: AsyncStatusEdge<string[]>[] = [];
      source.onStatus((edge) => edges.push(edge));
      watch(source);
      source.set("a");
      source.set("ab");
      source.set("abc");
      calls[2].resolve(["x", "y", "z"]);
      await settle();
      expect(
        edges.map(({ type, previous, count, reason }) => [
          type,
          previous,
          count,
          reason,
        ]),
      ).toEqual([
        ["loading", "idle", undefined, "fetch"],
        ["success", "loading", 3, "fetch"],
      ]);
    });

    it("tells a cached answer from a fetched one", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher, { cache: { ttl: 60_000 } });
      const edges: AsyncStatusEdge<unknown>[] = [];
      watch(source);
      source.set("a");
      calls[0].resolve([1]);
      await settle();
      source.set("b");
      calls[1].resolve([1, 2]);
      await settle();
      source.onStatus((edge) => edges.push(edge));
      source.set("a");
      expect(edges.map((edge) => [edge.type, edge.reason, edge.count])).toEqual(
        [["success", "cache", 1]],
      );
    });

    it("reports an error and a cancel", async () => {
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher);
      const types: string[] = [];
      source.onStatus((edge) => types.push(`${edge.type}:${edge.reason}`));
      watch(source);
      source.set("a");
      calls[0].reject(new Error("x"));
      await settle();
      source.set("b");
      source.cancel();
      expect(types).toEqual([
        "loading:fetch",
        "error:fetch",
        "loading:fetch",
        "error:cancel",
      ]);
    });

    it("reports idle below minLength", () => {
      const { fetcher } = manual();
      const source = createAsyncSource(fetcher, { minLength: 3 });
      const edges: AsyncStatusEdge<unknown>[] = [];
      watch(source);
      source.set("ab");
      source.onStatus((edge) => edges.push(edge));
      source.set("abc");
      source.set("a");
      expect(edges.map((edge) => [edge.type, edge.reason])).toEqual([
        ["loading", "fetch"],
        ["idle", "length"],
      ]);
    });

    it("stops after the returned function is called", () => {
      const { fetcher } = manual();
      const source = createAsyncSource(fetcher);
      const listener = vi.fn();
      const stop = source.onStatus(listener);
      watch(source);
      stop();
      source.set("a");
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("offline and online", () => {
    function stubBrowser(online: boolean) {
      const target = new EventTarget();
      const navigatorStub = { onLine: online };
      vi.stubGlobal("window", target);
      vi.stubGlobal("navigator", navigatorStub);
      return {
        target,
        go(next: boolean) {
          navigatorStub.onLine = next;
          if (next) target.dispatchEvent(new Event("online"));
        },
      };
    }

    it("listens for online only while someone is subscribed", () => {
      const { target } = stubBrowser(true);
      const add = vi.spyOn(target, "addEventListener");
      const remove = vi.spyOn(target, "removeEventListener");
      const source = createAsyncSource(vi.fn());
      const one = watch(source);
      const two = watch(source);
      expect(add).toHaveBeenCalledTimes(1);
      one.unsubscribe();
      expect(remove).not.toHaveBeenCalled();
      two.unsubscribe();
      expect(remove).toHaveBeenCalledTimes(1);
    });

    it("waits for the network between retries instead of burning attempts", async () => {
      const browser = stubBrowser(true);
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher, {
        retry: { count: 2, delay: 100 },
      });
      const view = watch(source);
      source.set("a");
      browser.go(false);
      calls[0].reject(new TypeError("Failed to fetch"));
      await vi.advanceTimersByTimeAsync(60_000);
      expect(calls).toHaveLength(1);
      expect(view.last.status).toBe("loading");
      expect(vi.getTimerCount()).toBe(0);
      browser.go(true);
      expect(calls).toHaveLength(2);
      calls[1].resolve(["A"]);
      await settle();
      expect(view.last).toMatchObject({ status: "success", data: ["A"] });
    });

    it("fetches a failed query again when the browser comes back", async () => {
      const browser = stubBrowser(true);
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher);
      const view = watch(source);
      browser.go(false);
      source.set("a");
      calls[0].reject(new TypeError("Failed to fetch"));
      await settle();
      expect(view.last.status).toBe("error");
      browser.go(true);
      expect(view.last.status).toBe("loading");
      expect(calls).toHaveLength(2);
      calls[1].resolve(["A"]);
      await settle();
      expect(view.last).toMatchObject({ status: "success", data: ["A"] });
    });

    it("leaves an answer alone when the browser comes back", async () => {
      const browser = stubBrowser(true);
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher);
      watch(source);
      source.set("a");
      calls[0].resolve(["A"]);
      await settle();
      browser.go(false);
      browser.go(true);
      expect(calls).toHaveLength(1);
    });

    it("refetchOnReconnect: false leaves the error", async () => {
      const browser = stubBrowser(true);
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher, { refetchOnReconnect: false });
      const view = watch(source);
      source.set("a");
      calls[0].reject(new Error("x"));
      await settle();
      browser.go(true);
      expect(calls).toHaveLength(1);
      expect(view.last.status).toBe("error");
    });

    it("stops waiting for the network when a newer query replaces it", async () => {
      const browser = stubBrowser(true);
      const { calls, fetcher } = manual();
      const source = createAsyncSource(fetcher, { retry: 2 });
      watch(source);
      source.set("a");
      browser.go(false);
      calls[0].reject(new TypeError("Failed to fetch"));
      await settle();
      source.set("b");
      browser.go(true);
      expect(calls.map((call) => call.query)).toEqual(["a", "b"]);
    });
  });

  describe("stress", () => {
    it("shows only the last answer at 50 keystrokes a second over 300 ms latency", async () => {
      const { calls, fetcher } = delayed(300);
      const source = createAsyncSource(fetcher, { debounce: 0 });
      const view = watch(source);
      const typed = "the quick brown fox jumps over the lazy dog".slice(0, 50);
      for (let i = 1; i <= typed.length; i++) {
        source.set(typed.slice(0, i));
        // eslint-disable-next-line no-await-in-loop -- each step needs the previous one's timers.
        await vi.advanceTimersByTimeAsync(20);
      }
      await vi.advanceTimersByTimeAsync(300);
      const final = typed;
      expect(calls).toHaveLength(typed.length);
      expect(calls.slice(0, -1).every((call) => call.signal.aborted)).toBe(
        true,
      );
      const arrivals = view.states.filter(
        (state) => state.status === "success",
      );
      expect(arrivals).toHaveLength(1);
      expect(arrivals[0]).toMatchObject({
        query: final,
        data: [`${final}-result`],
      });
      // No flash: nothing was ever shown in between.
      expect(
        view.states.every(
          (state) => state.data === undefined || state.query === final,
        ),
      ).toBe(true);
    });

    it("sends one request when the debounce outlasts the keystrokes", async () => {
      const { calls, fetcher } = delayed(300);
      const source = createAsyncSource(fetcher, { debounce: 150 });
      const view = watch(source);
      for (let i = 1; i <= 50; i++) {
        source.set("x".repeat(i));
        // eslint-disable-next-line no-await-in-loop -- each step needs the previous one's timers.
        await vi.advanceTimersByTimeAsync(20);
      }
      await vi.advanceTimersByTimeAsync(150 + 300);
      expect(calls).toHaveLength(1);
      expect(view.last).toMatchObject({
        status: "success",
        query: "x".repeat(50),
      });
    });

    it("keeps the earlier answer on screen, dimmed, while 50 keystrokes load", async () => {
      const { fetcher } = delayed(300);
      const source = createAsyncSource(fetcher, { debounce: 0 });
      const view = watch(source);
      source.set("a");
      await vi.advanceTimersByTimeAsync(300);
      const shown: unknown[] = [];
      for (let i = 2; i <= 51; i++) {
        source.set("a".repeat(i));
        shown.push(view.last.data);
        // eslint-disable-next-line no-await-in-loop -- each step needs the previous one's timers.
        await vi.advanceTimersByTimeAsync(20);
      }
      expect(shown.every((data) => (data as string[])[0] === "a-result")).toBe(
        true,
      );
      expect(view.last.stale).toBe(true);
      await vi.advanceTimersByTimeAsync(300);
      expect(view.last).toMatchObject({
        status: "success",
        stale: false,
        data: [`${"a".repeat(51)}-result`],
      });
    });

    it("lets 50 sources that ignore the signal answer out of order", async () => {
      const calls: Call[] = [];
      const source = createAsyncSource(
        (query: string) =>
          new Promise<string[]>((resolve, reject) => {
            calls.push({
              query,
              signal: undefined as never,
              resolve: resolve as never,
              reject,
            });
          }),
      );
      const view = watch(source);
      for (let i = 1; i <= 50; i++) source.set("q".repeat(i));
      // Answer in reverse: newest first, then everything older.
      for (let i = calls.length - 1; i >= 0; i--) {
        calls[i].resolve([calls[i].query]);
        // eslint-disable-next-line no-await-in-loop -- each step needs the previous one's timers.
        await settle();
      }
      expect(view.last.data).toEqual(["q".repeat(50)]);
      const arrivals = view.states.filter(
        (state) => state.status === "success",
      );
      expect(arrivals).toHaveLength(1);
    });

    it("recovers from a failing source on the next keystroke", async () => {
      let fail = true;
      const fetcher = vi.fn((query: string) => {
        if (fail) throw new Error("503");
        return [query];
      });
      const source = createAsyncSource(fetcher, { debounce: 100 });
      const view = watch(source);
      source.set("a");
      await vi.advanceTimersByTimeAsync(100);
      expect(view.last.status).toBe("error");
      fail = false;
      source.set("ab");
      expect(view.last).toMatchObject({ status: "loading", error: undefined });
      await vi.advanceTimersByTimeAsync(100);
      expect(view.last).toMatchObject({ status: "success", data: ["ab"] });
    });
  });
});

describe("createPagedSource", () => {
  type Page = { items: number[]; nextCursor?: string | null; total?: number };

  function pages() {
    const calls: Call[] = [];
    const fetcher = vi.fn(
      (query: string, context: { signal: AbortSignal; cursor?: string }) =>
        new Promise<Page>((resolve, reject) => {
          calls.push({
            query,
            signal: context.signal,
            cursor: context.cursor,
            resolve: resolve as never,
            reject,
          });
        }),
    );
    return { calls, fetcher };
  }

  it("holds the first page and asks for the next with the cursor", async () => {
    const { calls, fetcher } = pages();
    const source = createPagedSource<number, string, string, Page>(fetcher);
    const view = watch(source);
    source.set("q");
    expect(calls[0].cursor).toBeUndefined();
    calls[0].resolve({ items: [1, 2], nextCursor: "c1", total: 5 });
    await settle();
    expect(view.last).toMatchObject({
      status: "success",
      data: [1, 2],
      hasMore: true,
      loadingMore: false,
      firstPage: { total: 5 },
    });
    source.loadMore();
    expect(view.last).toMatchObject({
      status: "success",
      loadingMore: true,
      data: [1, 2],
    });
    expect(calls[1].cursor).toBe("c1");
    calls[1].resolve({ items: [3], nextCursor: null });
    await settle();
    expect(view.last).toMatchObject({
      data: [1, 2, 3],
      hasMore: false,
      loadingMore: false,
      firstPage: { total: 5 },
    });
  });

  it("asks once for a page when loadMore is called twice", async () => {
    const { calls, fetcher } = pages();
    const source = createPagedSource<number, string, string, Page>(fetcher);
    watch(source);
    source.set("q");
    calls[0].resolve({ items: [1], nextCursor: "c1" });
    await settle();
    const one = source.loadMore();
    const two = source.loadMore();
    expect(calls).toHaveLength(2);
    expect(one).toBe(two);
  });

  it("does nothing at the end, while loading, or before a query", async () => {
    const { calls, fetcher } = pages();
    const source = createPagedSource<number, string, string, Page>(fetcher);
    watch(source);
    await source.loadMore();
    source.set("q");
    await source.loadMore();
    expect(calls).toHaveLength(1);
    calls[0].resolve({ items: [1], nextCursor: null });
    await settle();
    await source.loadMore();
    expect(calls).toHaveLength(1);
  });

  it("drops a page that arrives after the query changed", async () => {
    const { calls, fetcher } = pages();
    const source = createPagedSource<number, string, string, Page>(fetcher);
    const view = watch(source);
    source.set("a");
    calls[0].resolve({ items: [1], nextCursor: "c1" });
    await settle();
    source.loadMore();
    source.set("b");
    expect(calls[1].signal.aborted).toBe(true);
    expect(view.last).toMatchObject({
      status: "loading",
      loadingMore: false,
      query: "b",
    });
    calls[1].resolve({ items: [99], nextCursor: null });
    await settle();
    calls[2].resolve({ items: [2], nextCursor: null });
    await settle();
    expect(view.last.data).toEqual([2]);
  });

  it("keeps the items when a page fails, and tries the page again", async () => {
    const { calls, fetcher } = pages();
    const source = createPagedSource<number, string, string, Page>(fetcher);
    const view = watch(source);
    source.set("q");
    calls[0].resolve({ items: [1], nextCursor: "c1" });
    await settle();
    source.loadMore();
    const error = new Error("page failed");
    calls[1].reject(error);
    await settle();
    expect(view.last).toMatchObject({
      status: "success",
      data: [1],
      hasMore: true,
      loadingMore: false,
      moreError: error,
    });
    source.loadMore();
    expect(view.last.moreError).toBeUndefined();
    expect(calls[2].cursor).toBe("c1");
  });

  it("drops an item an earlier page already holds", async () => {
    const { calls, fetcher } = pages();
    const source = createPagedSource<number, string, string, Page>(fetcher, {
      itemKey: (item) => item,
    });
    const view = watch(source);
    source.set("q");
    calls[0].resolve({ items: [1, 2], nextCursor: "c1" });
    await settle();
    source.loadMore();
    calls[1].resolve({ items: [2, 3], nextCursor: null });
    await settle();
    expect(view.last.data).toEqual([1, 2, 3]);
  });

  it("returns to a query with every page it had loaded", async () => {
    const { calls, fetcher } = pages();
    const source = createPagedSource<number, string, string, Page>(fetcher, {
      cache: { ttl: 60_000 },
    });
    const view = watch(source);
    source.set("a");
    calls[0].resolve({ items: [1], nextCursor: "c1" });
    await settle();
    source.loadMore();
    calls[1].resolve({ items: [2], nextCursor: "c2" });
    await settle();
    source.set("b");
    calls[2].resolve({ items: [9], nextCursor: null });
    await settle();
    source.set("a");
    expect(view.last).toMatchObject({
      status: "success",
      data: [1, 2],
      hasMore: true,
    });
    source.loadMore();
    expect(calls[3].cursor).toBe("c2");
  });

  it("starts from a first page given up front", () => {
    const { calls, fetcher } = pages();
    const source = createPagedSource<number, string, string, Page>(fetcher, {
      initialData: { items: [1, 2], nextCursor: "c1", total: 9 },
      initialQuery: "q",
    });
    expect(source.get()).toMatchObject({
      status: "success",
      data: [1, 2],
      hasMore: true,
      firstPage: { total: 9 },
    });
    watch(source);
    source.loadMore();
    expect(calls[0].cursor).toBe("c1");
  });

  it("reports a loadMore arrival as new data", async () => {
    const { calls, fetcher } = pages();
    const source = createPagedSource<number, string, string, Page>(fetcher);
    const reasons: string[] = [];
    watch(source);
    source.set("q");
    calls[0].resolve({ items: [1], nextCursor: "c1" });
    await settle();
    source.onStatus((edge) =>
      reasons.push(`${edge.type}:${edge.reason}:${edge.count}`),
    );
    source.loadMore();
    calls[1].resolve({ items: [2, 3], nextCursor: null });
    await settle();
    expect(reasons).toEqual(["success:more:3"]);
  });

  it("cancel stops a loadMore", async () => {
    const { calls, fetcher } = pages();
    const source = createPagedSource<number, string, string, Page>(fetcher);
    const view = watch(source);
    source.set("q");
    calls[0].resolve({ items: [1], nextCursor: "c1" });
    await settle();
    source.loadMore();
    source.cancel();
    expect(calls[1].signal.aborted).toBe(true);
    expect(view.last).toMatchObject({ loadingMore: false, data: [1] });
  });
});
