import { render } from "@testing-library/svelte";
import type { ComponentProps } from "svelte";
import { tick } from "svelte";
import { setupStorageEventMock } from "../utils/storage-mocks";
import Theme from "./Theme.test.svelte";

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

/** Renders the Theme harness with `system` on by default. */
function renderSystem(props: Partial<ComponentProps<Theme>> = {}) {
  return render(Theme, { props: { system: true, ...props } });
}

describe("Theme system", () => {
  let setAttribute: ReturnType<typeof vi.spyOn>;
  let setProperty: ReturnType<typeof vi.spyOn>;
  const { setMockItem, getMockItem } = setupStorageEventMock();

  beforeEach(() => {
    setAttribute = vi.spyOn(document.documentElement, "setAttribute");
    setProperty = vi.spyOn(document.documentElement.style, "setProperty");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("theme");
    document.documentElement.style.removeProperty("color-scheme");
  });

  it("applies the dark theme when the system prefers dark", async () => {
    stubMatchMedia(true);
    renderSystem();
    await tick();

    expect(setAttribute).toHaveBeenLastCalledWith("theme", "g100");
    expect(setProperty).toHaveBeenCalledWith("color-scheme", "dark");
  });

  it("applies the light theme when the system prefers light", async () => {
    stubMatchMedia(false);
    renderSystem({ theme: "g100" });
    await tick();

    expect(document.documentElement.getAttribute("theme")).toBe("white");
  });

  it("uses custom systemThemes", async () => {
    stubMatchMedia(true);
    renderSystem({ systemThemes: ["g10", "g90"] });
    await tick();

    expect(document.documentElement.getAttribute("theme")).toBe("g90");
  });

  it("follows system changes after mount and dispatches update once", async () => {
    const { fire } = stubMatchMedia(true);
    const onUpdate = vi.fn();
    renderSystem({ onUpdate });
    await tick();
    expect(document.documentElement.getAttribute("theme")).toBe("g100");

    fire(false);
    await tick();

    expect(document.documentElement.getAttribute("theme")).toBe("white");
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith({ theme: "white" });
  });

  it("re-resolves the theme when systemThemes changes at runtime", async () => {
    stubMatchMedia(true);
    const { component } = renderSystem({ systemThemes: ["white", "g100"] });
    await tick();
    expect(document.documentElement.getAttribute("theme")).toBe("g100");

    component.systemThemes = ["g10", "g90"];
    await tick();

    expect(document.documentElement.getAttribute("theme")).toBe("g90");
  });

  it("does not call matchMedia when system is false", async () => {
    const { matchMedia } = stubMatchMedia(true);
    renderSystem({ system: false, theme: "g100" });
    await tick();

    expect(matchMedia).not.toHaveBeenCalled();
    expect(document.documentElement.getAttribute("theme")).toBe("g100");
  });

  it("applies immediately when system is enabled at runtime", async () => {
    const { matchMedia } = stubMatchMedia(true);
    const { component } = renderSystem({ system: false });
    await tick();
    expect(matchMedia).not.toHaveBeenCalled();

    component.system = true;
    await tick();

    expect(document.documentElement.getAttribute("theme")).toBe("g100");
  });

  it("stops following when system is disabled at runtime", async () => {
    const { fire, mql } = stubMatchMedia(true);
    const { component } = renderSystem();
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
    const { unmount } = renderSystem();
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
    setMockItem("theme", "g10");
    stubMatchMedia(true);
    renderSystem({ persist: true });
    await tick();
    await tick();

    expect(document.documentElement.getAttribute("theme")).toBe("g100");
    expect(getMockItem("theme")).toBe("g100");
  });

  it("does not watch the system when unmounted before persist settles", async () => {
    const { matchMedia } = stubMatchMedia(true);
    const { unmount } = renderSystem({ persist: true });
    unmount();
    await tick();

    expect(matchMedia).not.toHaveBeenCalled();
  });
});
