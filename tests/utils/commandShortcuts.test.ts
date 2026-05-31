import {
  buildCommandShortcutMap,
  getCommandCombos,
  parseDisplayShortcut,
} from "../../src/utils/commandShortcuts.js";

describe("parseDisplayShortcut", () => {
  test("parses cmd symbol into meta and ctrl combos", () => {
    expect(parseDisplayShortcut(["⌘", "N"])).toEqual(["meta+n", "ctrl+n"]);
  });

  test("parses comma key", () => {
    expect(parseDisplayShortcut(["⌘", ","])).toEqual(["meta+,", "ctrl+,"]);
  });

  test("parses explicit ctrl+shift combo", () => {
    expect(parseDisplayShortcut(["Ctrl", "Shift", "P"])).toEqual([
      "ctrl+shift+p",
    ]);
  });

  test("returns empty for unparseable segments", () => {
    expect(parseDisplayShortcut(["⌘", "N", "extra"])).toEqual([]);
  });
});

describe("getCommandCombos", () => {
  test("prefers shortcutKeys over shortcut display", () => {
    expect(
      getCommandCombos({
        shortcut: ["⌘", "N"],
        shortcutKeys: "alt+s",
      }),
    ).toEqual(["alt+s"]);
  });

  test("falls back to parsed shortcut display", () => {
    expect(getCommandCombos({ shortcut: ["⌘", "N"] })).toEqual([
      "meta+n",
      "ctrl+n",
    ]);
  });
});

describe("buildCommandShortcutMap", () => {
  test("maps combos to commands in stable order", () => {
    const commands = [
      { id: "a", shortcutKeys: "meta+a" },
      { id: "b", shortcutKeys: "meta+b" },
    ];
    const map = buildCommandShortcutMap(commands);
    expect(map.get("meta+a")?.id).toBe("a");
    expect(map.get("meta+b")?.id).toBe("b");
  });

  test("first command wins on duplicate combos", () => {
    const commands = [
      { id: "first", shortcutKeys: "meta+n" },
      { id: "second", shortcutKeys: "meta+n" },
    ];
    const map = buildCommandShortcutMap(commands);
    expect(map.get("meta+n")?.id).toBe("first");
  });
});
