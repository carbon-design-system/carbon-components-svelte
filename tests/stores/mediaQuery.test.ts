import { get } from "svelte/store";
import { mediaQuery } from "../../src/stores/mediaQuery.js";

function stubMatchMedia(initialMatches: boolean) {
  const listeners = new Set<(event: { matches: boolean }) => void>();
  const removeEventListener = vi.fn(
    (_event: string, listener: (event: { matches: boolean }) => void) => {
      listeners.delete(listener);
    },
  );

  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: initialMatches,
    media: query,
    addEventListener: (
      _event: string,
      listener: (event: { matches: boolean }) => void,
    ) => {
      listeners.add(listener);
    },
    removeEventListener,
  }));

  return {
    removeEventListener,
    emit(matches: boolean) {
      for (const listener of listeners) listener({ matches });
    },
    get listenerCount() {
      return listeners.size;
    },
  };
}

describe("mediaQuery", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("reflects the initial match state once subscribed", () => {
    stubMatchMedia(true);
    const store = mediaQuery("(min-width: 672px)");
    const unsubscribe = store.subscribe(() => {});
    expect(get(store)).toBe(true);
    unsubscribe();
  });

  test("reacts to subsequent change events", () => {
    const mql = stubMatchMedia(false);
    const store = mediaQuery("(min-width: 672px)");

    let value: boolean | undefined;
    const unsubscribe = store.subscribe((v) => {
      value = v;
    });
    expect(value).toBe(false);

    mql.emit(true);
    expect(value).toBe(true);

    unsubscribe();
  });

  test("removes the listener when the last subscriber leaves", () => {
    const mql = stubMatchMedia(false);
    const store = mediaQuery("(min-width: 672px)");

    const unsubscribe = store.subscribe(() => {});
    expect(mql.listenerCount).toBe(1);

    unsubscribe();
    expect(mql.removeEventListener).toHaveBeenCalled();
  });

  test("returns the fallback when matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);
    const store = mediaQuery("(min-width: 672px)", true);
    const unsubscribe = store.subscribe(() => {});
    expect(get(store)).toBe(true);
    unsubscribe();
  });
});
