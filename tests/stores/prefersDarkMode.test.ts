import { get } from "svelte/store";
import { prefersDarkMode } from "../../src/stores/prefersDarkMode.js";

describe("prefersDarkMode", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("reflects the (prefers-color-scheme: dark) query", () => {
    let observedQuery = "";
    vi.stubGlobal("matchMedia", (query: string) => {
      observedQuery = query;
      return {
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
    });

    const unsubscribe = prefersDarkMode.subscribe(() => {});
    expect(observedQuery).toBe("(prefers-color-scheme: dark)");
    expect(get(prefersDarkMode)).toBe(true);
    unsubscribe();
  });
});
