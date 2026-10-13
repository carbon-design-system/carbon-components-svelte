import { render } from "@testing-library/svelte";
import Theme from "carbon-components-svelte/Theme/Theme.svelte";
import { themeScript } from "carbon-components-svelte/Theme/theme-script.js";
import { tick } from "svelte";

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

function stubStorage(store: Record<string, string>) {
  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  });
}

function run(script: string) {
  new Function(script)();
  return document.documentElement.getAttribute("theme");
}

describe("themeScript", () => {
  beforeEach(() => {
    stubMatchMedia(false);
    stubStorage({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute("theme");
    document.documentElement.style.removeProperty("color-scheme");
    document.documentElement.style.removeProperty("--cds-button-primary");
  });

  it("applies the default theme and color scheme", () => {
    expect(run(themeScript())).toBe("white");
    expect(
      document.documentElement.style.getPropertyValue("color-scheme"),
    ).toBe("light");

    expect(run(themeScript({ theme: "g90" }))).toBe("g90");
    expect(
      document.documentElement.style.getPropertyValue("color-scheme"),
    ).toBe("dark");
  });

  it("restores a stored theme with persist", () => {
    stubStorage({ theme: "g100", custom: '"g10"' });
    expect(run(themeScript({ persist: true }))).toBe("g100");
    expect(run(themeScript({ persist: true, persistKey: "custom" }))).toBe(
      "g10",
    );
  });

  it("ignores storage without persist or with an unknown value", () => {
    stubStorage({ theme: "g100", bad: "purple" });
    expect(run(themeScript())).toBe("white");
    expect(run(themeScript({ persist: true, persistKey: "bad" }))).toBe(
      "white",
    );
  });

  it("falls back to the default when storage throws", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("denied");
      },
    });
    expect(run(themeScript({ theme: "g10", persist: true }))).toBe("g10");
  });

  it("follows the system color scheme, over a stored theme", () => {
    stubStorage({ theme: "g10" });
    stubMatchMedia(true);
    expect(run(themeScript({ system: true, persist: true }))).toBe("g100");
    expect(
      run(themeScript({ system: true, systemThemes: ["g10", "g90"] })),
    ).toBe("g90");

    stubMatchMedia(false);
    expect(
      run(themeScript({ system: true, systemThemes: ["g10", "g90"] })),
    ).toBe("g10");
  });

  it("sets tokens as custom properties, as Theme does", () => {
    run(themeScript({ tokens: { "button-primary": "#d02670" } }));
    expect(
      document.documentElement.style.getPropertyValue("--cds-button-primary"),
    ).toBe("#d02670");
  });

  it("escapes < so the script cannot close its tag", () => {
    const script = themeScript({ persist: true, persistKey: "</script>" });
    expect(script).not.toContain("</script>");
    stubStorage({ "</script>": "g80" });
    expect(run(script)).toBe("g80");

    const tokens = themeScript({ tokens: { "button-primary": "</script>" } });
    expect(tokens).not.toContain("</script>");
  });

  it.each([
    { theme: "g10" as const },
    { persist: true },
    { persist: true, system: true },
    { system: true, systemThemes: ["g10", "g90"] as ["g10", "g90"] },
  ])("resolves the same theme as Theme for %o", async (props) => {
    stubStorage({ theme: "g80" });
    stubMatchMedia(true);
    const applied = run(themeScript(props));

    render(Theme, { props });
    await tick();
    await tick();
    expect(document.documentElement.getAttribute("theme")).toBe(applied);
  });
});
