import {
  ariaShortcut,
  commandForKey,
  shortcutLabel,
} from "../../src/RichTextEditor/commands.js";

const key = (init: KeyboardEventInit) => new KeyboardEvent("keydown", init);

describe("commandForKey", () => {
  it("reads Command on a Mac and Control elsewhere, never both", () => {
    expect(commandForKey(key({ key: "b", metaKey: true }), true)).toBe("bold");
    expect(
      commandForKey(key({ key: "b", ctrlKey: true }), true),
    ).toBeUndefined();
    expect(commandForKey(key({ key: "b", ctrlKey: true }), false)).toBe("bold");
    expect(
      commandForKey(key({ key: "b", metaKey: true }), false),
    ).toBeUndefined();
    expect(
      commandForKey(key({ key: "b", ctrlKey: true, metaKey: true }), false),
    ).toBeUndefined();
  });

  it("tells Shift and Alt variants apart", () => {
    expect(commandForKey(key({ key: "z", ctrlKey: true }), false)).toBe("undo");
    expect(
      commandForKey(key({ key: "Z", ctrlKey: true, shiftKey: true }), false),
    ).toBe("redo");
    expect(commandForKey(key({ key: "y", ctrlKey: true }), false)).toBe("redo");
    // Ctrl+Y is Redo on Windows only; on a Mac it is not a shortcut.
    expect(
      commandForKey(key({ key: "y", metaKey: true }), true),
    ).toBeUndefined();
  });

  it("matches digits by code, since Option and Shift change the key", () => {
    expect(
      commandForKey(
        key({ key: "™", code: "Digit2", metaKey: true, altKey: true }),
        true,
      ),
    ).toBe("h2");
    expect(
      commandForKey(
        key({ key: "*", code: "Digit8", ctrlKey: true, shiftKey: true }),
        false,
      ),
    ).toBe("ul");
    expect(
      commandForKey(key({ key: "|", code: "Backslash", ctrlKey: true }), false),
    ).toBe("clear");
  });

  it("ignores keys without the modifier", () => {
    expect(commandForKey(key({ key: "b" }), false)).toBeUndefined();
  });
});

describe("shortcut text", () => {
  it("writes the shortcut for the platform", () => {
    expect(shortcutLabel("bold", false)).toBe("Ctrl+B");
    expect(shortcutLabel("bold", true)).toBe("⌘B");
    expect(shortcutLabel("strike", false)).toBe("Ctrl+Shift+X");
    expect(shortcutLabel("h2", true)).toBe("⌥⌘2");
    expect(shortcutLabel("indent", false)).toBeUndefined();
  });

  it("writes aria-keyshortcuts", () => {
    expect(ariaShortcut("bold", false)).toBe("Control+B");
    expect(ariaShortcut("redo", true)).toBe("Meta+Shift+Z");
  });
});
