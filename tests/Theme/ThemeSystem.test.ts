import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import ThemeSystem from "./ThemeSystem.test.svelte";

type Listener = (e: { matches: boolean }) => void;

function stubMatchMedia(matches: boolean) {
  const listeners = new Set<Listener>();
  const mql = {
    matches,
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addEventListener: vi.fn((_: string, cb: Listener) => listeners.add(cb)),
    removeEventListener: vi.fn((_: string, cb: Listener) =>
      listeners.delete(cb),
    ),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  const matchMedia = vi.fn(() => mql);
  vi.stubGlobal("matchMedia", matchMedia);
  return {
    mql,
    matchMedia,
    fire: (m: boolean) => {
      for (const cb of listeners) cb({ matches: m });
    },
  };
}

describe("Theme system", () => {
  let setAttribute: ReturnType<typeof vi.spyOn>;
  let setProperty: ReturnType<typeof vi.spyOn>;
  let consoleLog: ReturnType<typeof vi.spyOn>;
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    setAttribute = vi.spyOn(document.documentElement, "setAttribute");
    setProperty = vi.spyOn(document.documentElement.style, "setProperty");
    consoleLog = vi.spyOn(console, "log");
    localStorageMock = {};
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute("theme");
    document.documentElement.style.removeProperty("color-scheme");
  });

  it("applies the dark theme when the system prefers dark", async () => {
    stubMatchMedia(true);
    render(ThemeSystem);
    await tick();

    expect(setAttribute).toHaveBeenLastCalledWith("theme", "g100");
    expect(setProperty).toHaveBeenCalledWith("color-scheme", "dark");
  });

  it("applies the light theme when the system prefers light", async () => {
    stubMatchMedia(false);
    render(ThemeSystem);
    await tick();

    expect(document.documentElement.getAttribute("theme")).toBe("white");
  });

  it("uses custom systemThemes", async () => {
    stubMatchMedia(true);
    render(ThemeSystem, { props: { systemThemes: ["g10", "g90"] } });
    await tick();

    expect(document.documentElement.getAttribute("theme")).toBe("g90");
  });

  it("follows system changes after mount and dispatches update once", async () => {
    const { fire } = stubMatchMedia(true);
    render(ThemeSystem);
    await tick();
    expect(document.documentElement.getAttribute("theme")).toBe("g100");

    fire(false);
    await tick();

    expect(document.documentElement.getAttribute("theme")).toBe("white");
    const updates = consoleLog.mock.calls.filter(
      (c: unknown[]) => c[0] === "update",
    );
    expect(updates).toHaveLength(1);
    expect(updates[0][1]).toEqual({ theme: "white" });
  });

  it("does not call matchMedia when system is false", async () => {
    const { matchMedia } = stubMatchMedia(true);
    render(ThemeSystem, { props: { system: false } });
    await tick();

    expect(matchMedia).not.toHaveBeenCalled();
    expect(document.documentElement.getAttribute("theme")).toBe("white");
  });

  it("applies immediately when system is enabled at runtime", async () => {
    const { matchMedia } = stubMatchMedia(true);
    const { component } = render(ThemeSystem, { props: { system: false } });
    await tick();
    expect(matchMedia).not.toHaveBeenCalled();

    component.system = true;
    await tick();

    expect(document.documentElement.getAttribute("theme")).toBe("g100");
  });

  it("stops following when system is disabled at runtime", async () => {
    const { fire, mql } = stubMatchMedia(true);
    const { component } = render(ThemeSystem);
    await tick();

    component.system = false;
    await tick();
    expect(mql.removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );

    fire(false);
    await tick();
    expect(document.documentElement.getAttribute("theme")).toBe("g100");
  });

  it("removes the change listener on unmount", async () => {
    const { mql } = stubMatchMedia(true);
    const { unmount } = render(ThemeSystem);
    await tick();
    expect(mql.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );

    unmount();

    expect(mql.removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });

  it("lets system win over the stored value with persist", async () => {
    localStorageMock.theme = "g10";
    stubMatchMedia(true);
    render(ThemeSystem, { props: { persist: true } });
    await tick();
    await tick();

    expect(document.documentElement.getAttribute("theme")).toBe("g100");
    expect(localStorageMock.theme).toBe("g100");
  });

  it("does not watch the system when unmounted before persist settles", async () => {
    const { matchMedia } = stubMatchMedia(true);
    const { unmount } = render(ThemeSystem, { props: { persist: true } });
    unmount();
    await tick();

    expect(matchMedia).not.toHaveBeenCalled();
  });
});
