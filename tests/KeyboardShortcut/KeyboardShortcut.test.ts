import { render } from "@testing-library/svelte";
import KeyboardShortcut from "carbon-components-svelte/KeyboardShortcut/KeyboardShortcut.svelte";
import { tick } from "svelte";
import { syncPlatform } from "../../src/utils/shortcut-keys.js";

/** What the keys draw: the visible label of each cap. */
function drawn(container: HTMLElement) {
  return [...container.querySelectorAll(".bx--kbd")].map((kbd) => {
    const visible = kbd.querySelector('[aria-hidden="true"]') ?? kbd;
    return visible.textContent;
  });
}

/** What a screen reader says: everything not hidden, one entry per cap. */
function spoken(container: HTMLElement) {
  return [...container.querySelectorAll(".bx--kbd")].map((kbd) => {
    const hidden = kbd.querySelector(".bx--visually-hidden");
    return hidden ? hidden.textContent : kbd.textContent;
  });
}

describe("KeyboardShortcut", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    syncPlatform();
  });

  it("renders the Apple glyphs on an Apple platform", () => {
    const { container } = render(KeyboardShortcut, {
      shortcut: "mod+shift+p",
      apple: true,
    });

    expect(drawn(container)).toEqual(["⇧", "⌘", "P"]);
  });

  it("renders Ctrl and Shift elsewhere", () => {
    const { container } = render(KeyboardShortcut, {
      shortcut: "mod+shift+p",
      apple: false,
    });

    expect(drawn(container)).toEqual(["Ctrl", "Shift", "P"]);
  });

  it("renders nothing for an unparseable shortcut", () => {
    const { container } = render(KeyboardShortcut, { shortcut: "hyper+k" });

    expect(container.querySelector(".bx--keyboard-shortcut")).toBeNull();
  });

  it("shows `keys` instead of `shortcut`", () => {
    const { container } = render(KeyboardShortcut, {
      shortcut: "mod+k",
      keys: ["G", "I"],
      apple: false,
    });

    expect(drawn(container)).toEqual(["G", "I"]);
  });

  it("spells out each glyph for assistive technology", () => {
    const { container } = render(KeyboardShortcut, {
      shortcut: "mod+shift+p",
      apple: true,
    });

    expect(spoken(container)).toEqual(["Shift", "Command", "P"]);
    const glyphs = container.querySelectorAll('.bx--kbd [aria-hidden="true"]');
    expect(glyphs).toHaveLength(2);
  });

  it("hides the keys from assistive technology when decorative", () => {
    const { container } = render(KeyboardShortcut, {
      shortcut: "mod+shift+p",
      apple: true,
      decorative: true,
    });

    const root = container.querySelector(".bx--keyboard-shortcut");
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".bx--visually-hidden")).toBeNull();
  });

  it("isolates the keys from the page direction but not the outer element", () => {
    const { container } = render(KeyboardShortcut, { shortcut: "mod+k" });

    expect(
      container.querySelector(".bx--keyboard-shortcut__keys"),
    ).toHaveAttribute("dir", "ltr");
    // A `dir` on the outer element would flip its own logical margins.
    expect(
      container.querySelector(".bx--keyboard-shortcut"),
    ).not.toHaveAttribute("dir");
  });

  it("scales the glyph keys of a keycap only", () => {
    const keycap = render(KeyboardShortcut, {
      shortcut: "mod+shift+p",
      apple: true,
    });
    expect(
      keycap.container.querySelectorAll(".bx--keyboard-shortcut__glyph"),
    ).toHaveLength(2);

    const muted = render(KeyboardShortcut, {
      shortcut: "mod+shift+p",
      apple: true,
      variant: "muted",
    });
    expect(
      muted.container.querySelector(".bx--keyboard-shortcut__glyph"),
    ).toBeNull();
  });

  it("joins muted keys with a plus off Apple platforms only", () => {
    const off = render(KeyboardShortcut, {
      shortcut: "mod+shift+p",
      variant: "muted",
      apple: false,
    });
    expect(off.container.textContent).toContain("+");

    const on = render(KeyboardShortcut, {
      shortcut: "mod+shift+p",
      variant: "muted",
      apple: true,
    });
    expect(on.container.textContent).not.toContain("+");
  });

  it("forwards size, variant and rest props", () => {
    const { container } = render(KeyboardShortcut, {
      shortcut: "mod+k",
      size: "sm",
      variant: "muted",
      "data-testid": "hint",
    });

    expect(
      container.querySelector(".bx--kbd--sm.bx--kbd--muted"),
    ).not.toBeNull();
    expect(container.querySelector('[data-testid="hint"]')).toHaveClass(
      "bx--keyboard-shortcut--muted",
    );
  });

  it("flips an instance that is already mounted once the platform syncs", async () => {
    const { container } = render(KeyboardShortcut, { shortcut: "mod+k" });
    expect(drawn(container)).toEqual(["Ctrl", "K"]);

    vi.spyOn(window.navigator, "platform", "get").mockReturnValue("MacIntel");
    syncPlatform();
    await tick();

    expect(drawn(container)).toEqual(["⌘", "K"]);
  });

  it("reads the synced platform in an instance created later", () => {
    vi.spyOn(window.navigator, "platform", "get").mockReturnValue("MacIntel");
    syncPlatform();

    const { container } = render(KeyboardShortcut, { shortcut: "mod+k" });

    expect(drawn(container)).toEqual(["⌘", "K"]);
  });

  it("ignores the shared platform when `apple` is set", () => {
    vi.spyOn(window.navigator, "platform", "get").mockReturnValue("MacIntel");
    syncPlatform();

    const { container } = render(KeyboardShortcut, {
      shortcut: "mod+k",
      apple: false,
    });

    expect(drawn(container)).toEqual(["Ctrl", "K"]);
  });

  it("detects the platform on mount", async () => {
    vi.spyOn(window.navigator, "platform", "get").mockReturnValue("MacIntel");

    const { container } = render(KeyboardShortcut, { shortcut: "mod+k" });
    await tick();

    expect(drawn(container)).toEqual(["⌘", "K"]);
  });
});
