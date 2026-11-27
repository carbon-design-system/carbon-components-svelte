// @vitest-environment node
import { createSuggestSource } from "../../src/TokenSearch/suggest-source.js";
import type { TokenSuggestion } from "../../src/TokenSearch/token-suggest.js";

const row = (value: string): TokenSuggestion => ({
  kind: "value",
  text: value,
  value,
});

function setup() {
  const states: Array<{ status: string; values: string[]; query: string }> = [];
  const source = createSuggestSource((state) =>
    states.push({
      status: state.status,
      values: state.items.map((i) => i.value),
      query: state.query,
    }),
  );
  return { source, states, last: () => states[states.length - 1] };
}

describe("createSuggestSource", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("answers at once from what is known", () => {
    const { source, last } = setup();
    source.ask(
      { id: "k", known: (q) => [row(`known-${q}`)], limit: 8, debounce: 0 },
      "a",
    );
    expect(last()).toEqual({
      status: "ready",
      values: ["known-a"],
      query: "a",
    });
  });

  it("shows what is known while a source loads, then puts the answer after it", async () => {
    const { source, last } = setup();
    let resolve: (rows: TokenSuggestion[]) => void = () => {};
    source.ask(
      {
        id: "k",
        known: () => [row("@me")],
        load: () => new Promise((r) => (resolve = r)),
        limit: 8,
        debounce: 0,
      },
      "al",
    );
    expect(last()).toEqual({ status: "loading", values: ["@me"], query: "al" });
    resolve([row("alice"), row("@me")]);
    await Promise.resolve();
    expect(last()).toEqual({
      status: "ready",
      values: ["@me", "alice"],
      query: "al",
    });
  });

  it("drops an older answer that arrives late, honoring the abort or not", async () => {
    const { source, last } = setup();
    const resolvers: Array<(rows: TokenSuggestion[]) => void> = [];
    const signals: AbortSignal[] = [];
    const request = {
      id: "k",
      known: () => [],
      load: (_q: string, signal: AbortSignal) => {
        signals.push(signal);
        return new Promise<TokenSuggestion[]>((r) => resolvers.push(r));
      },
      limit: 8,
      debounce: 0,
    };
    source.ask(request, "a");
    source.ask(request, "al");
    expect(signals[0].aborted).toBe(true);
    resolvers[1]([row("alice")]);
    await Promise.resolve();
    resolvers[0]([row("stale")]);
    await Promise.resolve();
    expect(last()).toMatchObject({
      status: "ready",
      values: ["alice"],
      query: "al",
    });
  });

  it("waits out the debounce and calls once for a burst", () => {
    const { source, last } = setup();
    const load = vi.fn(() => [row("x")]);
    const request = { id: "k", known: () => [], load, limit: 8, debounce: 150 };
    source.ask(request, "a");
    source.ask(request, "al");
    source.ask(request, "ali");
    expect(load).not.toHaveBeenCalled();
    expect(last().status).toBe("loading");
    vi.advanceTimersByTime(150);
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith("ali", expect.anything());
    expect(last()).toMatchObject({ status: "ready", values: ["x"] });
  });

  it("reports a failing source and keeps what is known", async () => {
    const { source, last } = setup();
    source.ask(
      {
        id: "k",
        known: () => [row("@me")],
        load: () => Promise.reject(new Error("no")),
        limit: 8,
        debounce: 0,
      },
      "a",
    );
    await Promise.resolve();
    await Promise.resolve();
    expect(last()).toEqual({ status: "error", values: ["@me"], query: "a" });
  });

  it("forgets the results of another key", () => {
    const { source, last } = setup();
    source.ask(
      {
        id: "a",
        known: () => [row("one")],
        load: () => new Promise(() => {}),
        limit: 8,
        debounce: 0,
      },
      "",
    );
    source.ask(
      {
        id: "b",
        known: () => [],
        load: () => new Promise(() => {}),
        limit: 8,
        debounce: 0,
      },
      "",
    );
    expect(last().values).toEqual([]);
  });
});
