import { get } from "svelte/store";
import { colorScheme } from "../../src/stores/colorScheme.js";

function stubPrefersDark(matches: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("dark") ? matches : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

describe("colorScheme", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  test("defaults to system and resolves via prefers-color-scheme", () => {
    stubPrefersDark(true);
    const scheme = colorScheme();
    const unsubscribe = scheme.subscribe(() => {});
    expect(get(scheme)).toEqual({ preference: "system", resolved: "dark" });
    unsubscribe();
  });

  test("set updates and persists the preference", () => {
    stubPrefersDark(true);
    const scheme = colorScheme();
    const unsubscribe = scheme.subscribe(() => {});

    scheme.set("light");
    expect(get(scheme)).toEqual({ preference: "light", resolved: "light" });
    expect(localStorage.getItem("color-scheme")).toBe("light");

    unsubscribe();
  });

  test("reads an existing stored preference under a custom key", () => {
    stubPrefersDark(false);
    localStorage.setItem("custom-key", "dark");

    const scheme = colorScheme({ key: "custom-key" });
    const unsubscribe = scheme.subscribe(() => {});
    expect(get(scheme)).toEqual({ preference: "dark", resolved: "dark" });
    unsubscribe();
  });
});
