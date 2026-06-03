import { get } from "svelte/store";
import { prefersContrast } from "../../src/stores/prefersContrast.js";

describe("prefersContrast", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("reflects the (prefers-contrast: more) query", () => {
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

    const unsubscribe = prefersContrast.subscribe(() => {});
    expect(observedQuery).toBe("(prefers-contrast: more)");
    expect(get(prefersContrast)).toBe(true);
    unsubscribe();
  });
});
