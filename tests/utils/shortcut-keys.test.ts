import {
  isApplePlatform,
  parseShortcut,
  shortcutKeys,
} from "../../src/utils/shortcut-keys.js";

const labels = (shortcut: string, apple: boolean) =>
  shortcutKeys(shortcut, apple).map((key) => key.label);
const names = (shortcut: string, apple: boolean) =>
  shortcutKeys(shortcut, apple).map((key) => key.name);

describe("parseShortcut", () => {
  it("splits modifiers from the key and resolves aliases", () => {
    expect(parseShortcut("Mod+Shift+P")).toEqual({
      key: "p",
      mod: true,
      meta: false,
      ctrl: false,
      alt: false,
      shift: true,
    });
    expect(parseShortcut("cmd+option+esc")).toMatchObject({
      key: "escape",
      meta: true,
      alt: true,
    });
  });

  it("reads a trailing plus as the plus key", () => {
    expect(parseShortcut("mod++")).toMatchObject({ key: "+", mod: true });
    expect(parseShortcut("+")).toMatchObject({ key: "+", mod: false });
  });

  it("returns null for an empty shortcut or an unknown modifier", () => {
    expect(parseShortcut("")).toBeNull();
    expect(parseShortcut("hyper+k")).toBeNull();
  });
});

describe("shortcutKeys", () => {
  it("orders Apple modifiers control, option, shift, command", () => {
    expect(labels("mod+shift+alt+ctrl+p", true)).toEqual([
      "⌃",
      "⌥",
      "⇧",
      "⌘",
      "P",
    ]);
  });

  it("maps mod to Ctrl elsewhere", () => {
    expect(labels("mod+shift+p", false)).toEqual(["Ctrl", "Shift", "P"]);
  });

  it("spells out glyphs for a screen reader", () => {
    expect(names("mod+shift+alt+ctrl+p", true)).toEqual([
      "Control",
      "Option",
      "Shift",
      "Command",
      "P",
    ]);
    expect(names("ctrl+alt+k", false)).toEqual(["Control", "Alt", "K"]);
  });

  it("names Return and Delete the way each platform does", () => {
    expect(labels("mod+enter", true)).toEqual(["⌘", "↵"]);
    expect(names("mod+enter", true)).toEqual(["Command", "Return"]);
    expect(labels("mod+enter", false)).toEqual(["Ctrl", "Enter"]);
    expect(names("backspace", true)).toEqual(["Delete"]);
    expect(names("backspace", false)).toEqual(["Backspace"]);
    expect(names("up", true)).toEqual(["Up Arrow"]);
  });

  it("says punctuation by name", () => {
    expect(labels("mod+/", false)).toEqual(["Ctrl", "/"]);
    expect(names("mod+/", false)).toEqual(["Control", "Slash"]);
  });

  it("capitalizes a named key it has no table entry for", () => {
    expect(labels("f5", false)).toEqual(["F5"]);
  });

  it("returns no keys for an unparseable shortcut", () => {
    expect(shortcutKeys("hyper+k", true)).toEqual([]);
  });
});

describe("isApplePlatform", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ["MacIntel", true],
    ["iPhone", true],
    ["Win32", false],
    ["Linux x86_64", false],
  ])("reads %s as %s", (platform, expected) => {
    vi.stubGlobal("navigator", { platform });

    expect(isApplePlatform()).toBe(expected);
  });
});
