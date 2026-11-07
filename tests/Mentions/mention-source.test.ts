// @vitest-environment node
import { createMentionSource } from "../../src/Mentions/mention-source.js";

const item = (text: string) => ({ id: text, text });

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup() {
  const states: { status: string; texts: string[]; query: string }[] = [];
  const source = createMentionSource((state) =>
    states.push({
      status: state.status,
      texts: state.items.map((i) => i.text),
      query: state.query,
    }),
  );
  return { source, states, last: () => states[states.length - 1] };
}

describe("createMentionSource", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("answers an array at once, ranked and limited", () => {
    const { source, last } = setup();
    source.request(
      {
        char: "@",
        items: [item("Bob"), item("Alice"), item("Albert")],
        limit: 1,
        debounce: 150,
      },
      "al",
    );
    expect(last()).toEqual({ status: "ready", texts: ["Alice"], query: "al" });
  });

  it("drops a slow answer that arrives after a newer one", async () => {
    const { source, last } = setup();
    const slow = deferred<ReturnType<typeof item>[]>();
    const fast = deferred<ReturnType<typeof item>[]>();
    const fn = vi
      .fn()
      .mockReturnValueOnce(slow.promise)
      .mockReturnValueOnce(fast.promise);
    const request = { char: "#", items: fn, limit: 10, debounce: 0 };

    source.request(request, "a");
    source.request(request, "ab");
    fast.resolve([item("ab-result")]);
    await vi.advanceTimersByTimeAsync(0);
    slow.resolve([item("a-result")]);
    await vi.advanceTimersByTimeAsync(0);

    expect(last()).toEqual({
      status: "ready",
      texts: ["ab-result"],
      query: "ab",
    });
  });

  it("aborts the signal of the request a newer one replaces", () => {
    const { source } = setup();
    const signals: AbortSignal[] = [];
    const request = {
      char: "#",
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
    const { source, states, last } = setup();
    const fn = vi.fn(async (q: string) => [item(q)]);
    const request = { char: "#", items: fn, limit: 10, debounce: 150 };

    source.request(request, "a");
    vi.advanceTimersByTime(100);
    source.request(request, "ab");
    expect(states.map((s) => s.status)).toEqual(["loading", "loading"]);
    expect(fn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(150);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn.mock.calls[0][0]).toBe("ab");
    expect(last()).toEqual({ status: "ready", texts: ["ab"], query: "ab" });
  });

  it("keeps the last results while a new query loads", async () => {
    const { source, last } = setup();
    const next = deferred<ReturnType<typeof item>[]>();
    const fn = vi
      .fn()
      .mockResolvedValueOnce([item("first")])
      .mockReturnValueOnce(next.promise);
    const request = { char: "#", items: fn, limit: 10, debounce: 0 };

    source.request(request, "a");
    await vi.advanceTimersByTimeAsync(0);
    source.request(request, "ab");
    expect(last()).toEqual({
      status: "loading",
      texts: ["first"],
      query: "ab",
    });
  });

  it("reports a rejection and a throw as an error, and an abort as nothing", async () => {
    const { source, last, states } = setup();

    source.request(
      {
        char: "#",
        items: () => Promise.reject(new Error("offline")),
        limit: 10,
        debounce: 0,
      },
      "a",
    );
    await vi.advanceTimersByTimeAsync(0);
    expect(last().status).toBe("error");

    source.request(
      {
        char: "#",
        items: () => {
          throw new Error("bug");
        },
        limit: 10,
        debounce: 0,
      },
      "b",
    );
    expect(last().status).toBe("error");

    const count = states.length;
    source.request(
      {
        char: "#",
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
    expect(states.slice(count).map((s) => s.status)).toEqual(["loading"]);
  });

  it("does not carry results from one trigger to another", () => {
    const { source, last } = setup();
    source.request(
      { char: "@", items: [item("Alice")], limit: 10, debounce: 0 },
      "",
    );
    source.request(
      {
        char: "#",
        items: () => new Promise<never>(() => {}),
        limit: 10,
        debounce: 0,
      },
      "",
    );
    expect(last()).toEqual({ status: "loading", texts: [], query: "" });
  });
});
