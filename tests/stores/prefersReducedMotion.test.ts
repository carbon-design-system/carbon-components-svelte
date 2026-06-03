import { get } from "svelte/store";
import { prefersReducedMotion } from "../../src/stores/prefersReducedMotion.js";

describe("prefersReducedMotion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("reflects the (prefers-reduced-motion: reduce) query", () => {
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

    const unsubscribe = prefersReducedMotion.subscribe(() => {});
    expect(observedQuery).toBe("(prefers-reduced-motion: reduce)");
    expect(get(prefersReducedMotion)).toBe(true);
    unsubscribe();
  });
});
