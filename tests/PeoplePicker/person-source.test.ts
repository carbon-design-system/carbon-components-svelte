// @vitest-environment node
import { createPersonSource } from "../../src/PeoplePicker/person-source.js";

const person = (name: string) => ({ id: name, name });

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function setup() {
  const states: { status: string; names: string[]; query: string }[] = [];
  const source = createPersonSource((state) =>
    states.push({
      status: state.status,
      names: state.items.map((p) => p.name),
      query: state.query,
    }),
  );
  return { source, states, last: () => states[states.length - 1] };
}

describe("createPersonSource", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("answers an array at once, ranked, limited and without the chosen", () => {
    const { source, last } = setup();
    source.request(
      {
        items: [person("Bob"), person("Alice"), person("Albert"), person("Al")],
        limit: 2,
        debounce: 150,
        exclude: (p) => p.name === "Al",
      },
      "al",
    );
    expect(last()).toEqual({
      status: "ready",
      names: ["Alice", "Albert"],
      query: "al",
    });
  });

  it("limits a function source after dropping the chosen", async () => {
    const { source, last } = setup();
    source.request(
      {
        items: async () => [person("a"), person("b"), person("c")],
        limit: 2,
        debounce: 0,
        exclude: (p) => p.name === "a",
      },
      "x",
    );
    await vi.advanceTimersByTimeAsync(0);
    expect(last().names).toEqual(["b", "c"]);
  });

  it("drops a slow answer that arrives after a newer one, signal or not", async () => {
    const { source, last } = setup();
    const slow = deferred<ReturnType<typeof person>[]>();
    const fast = deferred<ReturnType<typeof person>[]>();
    const fn = vi
      .fn()
      .mockReturnValueOnce(slow.promise)
      .mockReturnValueOnce(fast.promise);
    const request = { items: fn, limit: 10, debounce: 0 };

    source.request(request, "a");
    source.request(request, "ab");
    fast.resolve([person("ab-result")]);
    await vi.advanceTimersByTimeAsync(0);
    slow.resolve([person("a-result")]);
    await vi.advanceTimersByTimeAsync(0);

    expect(last()).toEqual({
      status: "ready",
      names: ["ab-result"],
      query: "ab",
    });
  });

  it("aborts the signal of the request a newer one replaces", () => {
    const { source } = setup();
    const signals: AbortSignal[] = [];
    const request = {
      items: (_q: string, { signal }: { signal: AbortSignal }) => {
        signals.push(signal);
        return new Promise<never>(() => {});
      },
      limit: 10,
      debounce: 0,
    };
    source.request(request, "a");
    source.request(request, "ab");
    expect(signals.map((s) => s.aborted)).toEqual([true, false]);
    source.reset();
    expect(signals[1].aborted).toBe(true);
  });

  it("waits out the debounce and calls the source once", async () => {
    const { source, last } = setup();
    const fn = vi.fn(async (q: string) => [person(q)]);
    const request = { items: fn, limit: 10, debounce: 150 };

    source.request(request, "a");
    vi.advanceTimersByTime(100);
    source.request(request, "ab");
    expect(fn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(150);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(last()).toEqual({ status: "ready", names: ["ab"], query: "ab" });
  });

  it("keeps the last results while a new query loads", async () => {
    const { source, last } = setup();
    const fn = vi
      .fn()
      .mockResolvedValueOnce([person("first")])
      .mockReturnValueOnce(new Promise(() => {}));
    const request = { items: fn, limit: 10, debounce: 0 };

    source.request(request, "a");
    await vi.advanceTimersByTimeAsync(0);
    source.request(request, "ab");
    expect(last()).toEqual({
      status: "loading",
      names: ["first"],
      query: "ab",
    });
  });

  it("reports a rejection with its reason, and retries the same query at once", async () => {
    const { source, states, last } = setup();
    const offline = new Error("offline");
    const fn = vi
      .fn()
      .mockRejectedValueOnce(offline)
      .mockResolvedValueOnce([person("Ada")]);
    source.request({ items: fn, limit: 10, debounce: 200 }, "ad");
    await vi.advanceTimersByTimeAsync(200);
    expect(states.at(-1)).toMatchObject({ status: "error", query: "ad" });

    source.retry();
    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn.mock.calls[1][0]).toBe("ad");
    expect(last()).toEqual({ status: "ready", names: ["Ada"], query: "ad" });
  });

  it("reports an abort as nothing", async () => {
    const { source, states } = setup();
    source.request(
      {
        items: (_q: string, { signal }: { signal: AbortSignal }) =>
          new Promise((_, reject) => {
            signal.addEventListener("abort", () =>
              reject(new DOMException("x", "AbortError")),
            );
          }),
        limit: 10,
        debounce: 0,
      },
      "c",
    );
    source.reset();
    await vi.advanceTimersByTimeAsync(0);
    expect(states.map((s) => s.status)).toEqual(["loading"]);
  });
});
