import { get } from "svelte/store";
import { breakpoint } from "../../src/stores/breakpoint.js";

describe("breakpoint", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // First, before any subscription has set a value on the singleton store.
  test("stays undefined when matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);
    const unsubscribe = breakpoint.subscribe(() => {});
    expect(get(breakpoint)).toBeUndefined();
    unsubscribe();
  });

  test("resolves the current breakpoint size", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("(min-width: 1056px) and (max-width: 1312px)"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const unsubscribe = breakpoint.subscribe(() => {});
    expect(get(breakpoint)).toBe("lg");
    unsubscribe();
  });

  test("updates when a matching change event fires", () => {
    const listeners = new Set<
      (event: { matches: boolean; media: string }) => void
    >();
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("(min-width: 1056px) and (max-width: 1312px)"),
      media: query,
      addEventListener: (
        _event: string,
        listener: (event: { matches: boolean; media: string }) => void,
      ) => {
        listeners.add(listener);
      },
      removeEventListener: vi.fn(),
    }));

    let value: string | undefined;
    const unsubscribe = breakpoint.subscribe((v) => {
      value = v;
    });
    expect(value).toBe("lg");

    const xlgMedia = "(min-width: 1312px) and (max-width: 1584px)";
    for (const listener of listeners) {
      listener({ matches: true, media: xlgMedia });
    }
    expect(value).toBe("xlg");

    unsubscribe();
  });
});
