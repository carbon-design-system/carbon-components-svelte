import {
  keyboardShortcut,
  matchesShortcut,
  onShortcut,
} from "../../src/utils/keyboard-shortcut-binding.js";
import {
  applePlatform,
  ariaKeyShortcuts,
  formatShortcut,
  lazyKeyboardShortcut,
  loadShortcutBinding,
  parseShortcut,
  platformScript,
  shortcutKeys,
} from "../../src/utils/keyboard-shortcut.js";

function key(init: KeyboardEventInit) {
  return new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    ...init,
  });
}

describe("parseShortcut", () => {
  it.each([
    [
      "mod+k",
      {
        key: "k",
        mod: true,
        meta: false,
        ctrl: false,
        alt: false,
        shift: false,
      },
    ],
    [
      "Ctrl+Shift+P",
      {
        key: "p",
        mod: false,
        meta: false,
        ctrl: true,
        alt: false,
        shift: true,
      },
    ],
    [
      "cmd+esc",
      {
        key: "escape",
        mod: false,
        meta: true,
        ctrl: false,
        alt: false,
        shift: false,
      },
    ],
    [
      "mod++",
      {
        key: "+",
        mod: true,
        meta: false,
        ctrl: false,
        alt: false,
        shift: false,
      },
    ],
    [
      "/",
      {
        key: "/",
        mod: false,
        meta: false,
        ctrl: false,
        alt: false,
        shift: false,
      },
    ],
  ])("parses %s", (shortcut, expected) => {
    expect(parseShortcut(shortcut)).toEqual(expected);
  });

  it("parses a function key", () => {
    expect(parseShortcut("shift+F12")).toMatchObject({
      key: "f12",
      shift: true,
    });
  });

  it.each(["", "hyper+k", "⌘C", "ctrl+save", "f25", "mod+", "constructor"])(
    "returns null for %j",
    (shortcut) => {
      expect(parseShortcut(shortcut)).toBeNull();
    },
  );
});

describe("matchesShortcut", () => {
  it("reads mod as Command on Apple platforms and Control elsewhere", () => {
    const command = key({ key: "k", metaKey: true });
    const control = key({ key: "k", ctrlKey: true });

    expect(matchesShortcut(command, "mod+k", { apple: true })).toBe(true);
    expect(matchesShortcut(control, "mod+k", { apple: true })).toBe(false);
    expect(matchesShortcut(control, "mod+k", { apple: false })).toBe(true);
    expect(matchesShortcut(command, "mod+k", { apple: false })).toBe(false);
  });

  it("requires the exact modifiers", () => {
    expect(
      matchesShortcut(
        key({ key: "K", ctrlKey: true, shiftKey: true }),
        "ctrl+k",
      ),
    ).toBe(false);
    expect(
      matchesShortcut(
        key({ key: "P", ctrlKey: true, shiftKey: true }),
        "ctrl+shift+p",
      ),
    ).toBe(true);
  });

  it("lets a symbol key ignore the Shift it needs", () => {
    expect(matchesShortcut(key({ key: "?", shiftKey: true }), "?")).toBe(true);
  });

  it("falls back to the physical key when Option changes the character", () => {
    const event = key({ key: "˚", code: "KeyK", altKey: true });
    expect(matchesShortcut(event, "alt+k")).toBe(true);
  });

  it("falls back to the physical key on a non-Latin layout", () => {
    const event = key({ key: "ы", code: "KeyS", ctrlKey: true });
    expect(matchesShortcut(event, "ctrl+s")).toBe(true);
  });

  it("reads the letter a Latin layout gives, not the physical key", () => {
    // Dvorak's O and AZERTY's Q sit on QWERTY's S and A.
    const dvorak = key({ key: "o", code: "KeyS", ctrlKey: true });
    const azerty = key({ key: "q", code: "KeyA", ctrlKey: true });

    expect(matchesShortcut(dvorak, "ctrl+o")).toBe(true);
    expect(matchesShortcut(dvorak, "ctrl+s")).toBe(false);
    expect(matchesShortcut(azerty, "ctrl+q")).toBe(true);
    expect(matchesShortcut(azerty, "ctrl+a")).toBe(false);
  });

  it("matches any shortcut in a list", () => {
    expect(
      matchesShortcut(key({ key: "p", ctrlKey: true }), ["ctrl+k", "ctrl+p"]),
    ).toBe(true);
  });
});

describe("platformScript", () => {
  it("marks <html> with the platform", () => {
    const platform = vi.spyOn(navigator, "platform", "get");
    for (const [value, expected] of [
      ["MacIntel", "apple"],
      ["Win32", "other"],
    ] as const) {
      platform.mockReturnValue(value);
      new Function(platformScript())();
      expect(document.documentElement.dataset.ccsPlatform).toBe(expected);
    }
    platform.mockRestore();
    delete document.documentElement.dataset.ccsPlatform;
  });
});

describe("shortcutKeys", () => {
  it("orders the keys as each platform does", () => {
    expect(shortcutKeys("mod+shift+alt+p", { apple: true })).toEqual([
      "alt",
      "shift",
      "meta",
      "p",
    ]);
    expect(shortcutKeys("mod+shift+alt+p", { apple: false })).toEqual([
      "ctrl",
      "alt",
      "shift",
      "p",
    ]);
    expect(shortcutKeys("esc")).toEqual(["escape"]);
  });
});

describe("formatShortcut", () => {
  it.each([
    ["mod+shift+p", true, ["⇧", "⌘", "P"]],
    ["mod+shift+p", false, ["Ctrl", "Shift", "P"]],
    ["ctrl+alt+enter", true, ["⌃", "⌥", "↵"]],
    ["escape", false, ["Esc"]],
    ["f2", false, ["F2"]],
  ])("formats %s (apple: %s)", (shortcut, apple, expected) => {
    expect(formatShortcut(shortcut, { apple })).toEqual(expected);
  });

  it("returns no keys for an invalid shortcut", () => {
    expect(formatShortcut("")).toEqual([]);
  });
});

describe("ariaKeyShortcuts", () => {
  it("writes ARIA key names, space-separated", () => {
    expect(ariaKeyShortcuts(["mod+k", "shift+space"], { apple: true })).toBe(
      "Meta+K Shift+Space",
    );
    expect(ariaKeyShortcuts("mod+arrowdown", { apple: false })).toBe(
      "Control+ArrowDown",
    );
  });

  it("writes a function key and the plus key as ARIA names them", () => {
    expect(ariaKeyShortcuts(["ctrl+f12", "mod++"], { apple: false })).toBe(
      "Control+F12 Control+Plus",
    );
  });

  it("writes nothing for a shortcut that doesn't parse", () => {
    expect(ariaKeyShortcuts("⌘C", { apple: true })).toBe("");
    expect(ariaKeyShortcuts(["⌘C", "mod+c"], { apple: true })).toBe("Meta+C");
  });
});

describe("applePlatform", () => {
  it("reads the platform for its first subscriber, after a microtask", async () => {
    const platform = vi
      .spyOn(navigator, "platform", "get")
      .mockReturnValue("MacIntel");
    const values: boolean[] = [];
    const unsubscribe = applePlatform.subscribe((value) => values.push(value));

    expect(values).toEqual([false]);
    await Promise.resolve();
    expect(values).toEqual([false, true]);
    unsubscribe();

    platform.mockRestore();
    const again = applePlatform.subscribe((value) => values.push(value));
    await Promise.resolve();
    expect(values).toEqual([false, true, true, false]);
    again();
  });
});

describe("onShortcut", () => {
  it("calls back until removed and prevents the default", () => {
    const callback = vi.fn();
    const off = onShortcut("ctrl+k", callback);

    const event = key({ key: "k", ctrlKey: true });
    window.dispatchEvent(event);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);

    off();
    window.dispatchEvent(key({ key: "k", ctrlKey: true }));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("ignores repeats, IME compositions and handled events", () => {
    const callback = vi.fn();
    const off = onShortcut("ctrl+k", callback);

    window.dispatchEvent(key({ key: "k", ctrlKey: true, repeat: true }));
    window.dispatchEvent(key({ key: "k", ctrlKey: true, isComposing: true }));
    const handled = key({ key: "k", ctrlKey: true });
    handled.preventDefault();
    window.dispatchEvent(handled);

    expect(callback).not.toHaveBeenCalled();
    off();
  });

  it("skips a shortcut without a command modifier while typing in a field", () => {
    const callback = vi.fn();
    const off = onShortcut("/", callback);
    const input = document.createElement("input");
    document.body.append(input);

    input.dispatchEvent(key({ key: "/" }));
    expect(callback).not.toHaveBeenCalled();

    document.body.dispatchEvent(key({ key: "/" }));
    expect(callback).toHaveBeenCalledTimes(1);

    input.remove();
    off();
  });

  it("fires a command shortcut from a field", () => {
    const callback = vi.fn();
    const off = onShortcut("ctrl+k", callback);
    const input = document.createElement("input");
    document.body.append(input);

    input.dispatchEvent(key({ key: "k", ctrlKey: true }));
    expect(callback).toHaveBeenCalledTimes(1);

    input.remove();
    off();
  });
});

describe("keyboardShortcut", () => {
  function bind(shortcut: string, attrs: Record<string, string> = {}) {
    const button = document.createElement("button");
    for (const [name, value] of Object.entries(attrs)) {
      button.setAttribute(name, value);
    }
    document.body.append(button);
    const run = vi.fn();
    const action = keyboardShortcut(button, { shortcut, run });
    return {
      button,
      run,
      destroy() {
        action.destroy();
        button.remove();
      },
    };
  }

  it("runs while the element is connected, enabled, shown and not inert", () => {
    const shown = bind("ctrl+s");
    const disabled = bind("ctrl+d", { disabled: "" });
    const busy = bind("ctrl+b", { "aria-disabled": "true" });
    const hidden = bind("ctrl+h", { hidden: "" });

    const event = key({ key: "s", ctrlKey: true });
    window.dispatchEvent(event);
    expect(shown.run).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);

    for (const letter of ["d", "b", "h"]) {
      const skipped = key({ key: letter, ctrlKey: true });
      window.dispatchEvent(skipped);
      expect(skipped.defaultPrevented).toBe(false);
    }
    expect(disabled.run).not.toHaveBeenCalled();
    expect(busy.run).not.toHaveBeenCalled();
    expect(hidden.run).not.toHaveBeenCalled();

    const inert = document.createElement("div");
    inert.setAttribute("inert", "");
    document.body.append(inert);
    inert.append(shown.button);
    window.dispatchEvent(key({ key: "s", ctrlKey: true }));
    expect(shown.run).toHaveBeenCalledTimes(1);

    for (const binding of [shown, disabled, busy, hidden]) binding.destroy();
    inert.remove();
  });

  it("gives a shared shortcut to the element bound last", () => {
    const first = bind("ctrl+s");
    const second = bind("ctrl+s");

    window.dispatchEvent(key({ key: "s", ctrlKey: true }));
    expect(first.run).not.toHaveBeenCalled();
    expect(second.run).toHaveBeenCalledTimes(1);

    second.destroy();
    window.dispatchEvent(key({ key: "s", ctrlKey: true }));
    expect(first.run).toHaveBeenCalledTimes(1);
    first.destroy();
  });

  it("keeps an open modal's shortcuts to the modal", () => {
    const page = bind("ctrl+s");
    const modal = document.createElement("div");
    modal.setAttribute("aria-modal", "true");
    document.body.append(modal);

    window.dispatchEvent(key({ key: "s", ctrlKey: true }));
    expect(page.run).not.toHaveBeenCalled();

    const save = document.createElement("button");
    modal.append(save);
    const run = vi.fn();
    const action = keyboardShortcut(save, { shortcut: "ctrl+s", run });
    window.dispatchEvent(key({ key: "s", ctrlKey: true }));
    expect(run).toHaveBeenCalledTimes(1);

    modal.setAttribute("inert", "");
    window.dispatchEvent(key({ key: "s", ctrlKey: true }));
    expect(page.run).toHaveBeenCalledTimes(1);

    action.destroy();
    modal.remove();
    page.destroy();
  });

  it("keeps an open modal <dialog>'s shortcuts to the dialog", () => {
    const page = bind("ctrl+s");
    const dialog = document.createElement("dialog");
    document.body.append(dialog);
    // jsdom has no top layer, so `:modal` never matches there.
    const matches = dialog.matches.bind(dialog);
    let modal = false;
    vi.spyOn(dialog, "matches").mockImplementation(
      (selector) => (selector === ":modal" && modal) || matches(selector),
    );

    dialog.show();
    window.dispatchEvent(key({ key: "s", ctrlKey: true }));
    expect(page.run).toHaveBeenCalledTimes(1);

    dialog.close();
    modal = true;
    dialog.showModal();
    window.dispatchEvent(key({ key: "s", ctrlKey: true }));
    expect(page.run).toHaveBeenCalledTimes(1);

    const save = document.createElement("button");
    dialog.append(save);
    const run = vi.fn();
    const action = keyboardShortcut(save, { shortcut: "ctrl+s", run });
    window.dispatchEvent(key({ key: "s", ctrlKey: true }));
    expect(run).toHaveBeenCalledTimes(1);

    action.destroy();
    dialog.remove();
    page.destroy();
  });

  it("yields to the app's own onShortcut", () => {
    const button = bind("ctrl+k");
    const callback = vi.fn();
    const off = onShortcut("ctrl+k", callback);

    window.dispatchEvent(key({ key: "k", ctrlKey: true }));
    expect(callback).toHaveBeenCalledTimes(1);
    expect(button.run).not.toHaveBeenCalled();

    off();
    window.dispatchEvent(key({ key: "k", ctrlKey: true }));
    expect(button.run).toHaveBeenCalledTimes(1);
    button.destroy();
  });

  it("rebinds when the shortcut changes and unbinds when it's cleared", () => {
    const button = document.createElement("button");
    document.body.append(button);
    const run = vi.fn();
    const action = keyboardShortcut(button, { shortcut: "ctrl+s", run });

    action.update({ shortcut: "ctrl+e", run });
    window.dispatchEvent(key({ key: "s", ctrlKey: true }));
    window.dispatchEvent(key({ key: "e", ctrlKey: true }));
    expect(run).toHaveBeenCalledTimes(1);

    action.update({ shortcut: "", run });
    window.dispatchEvent(key({ key: "e", ctrlKey: true }));
    expect(run).toHaveBeenCalledTimes(1);

    action.destroy();
    button.remove();
  });
});

describe("lazyKeyboardShortcut", () => {
  it("binds once the code loads, and when a shortcut is set later", async () => {
    const node = document.createElement("button");
    document.body.append(node);
    const run = vi.fn();
    const action = lazyKeyboardShortcut(node, { shortcut: "", run });

    action.update({ shortcut: "ctrl+j", run });
    window.dispatchEvent(key({ key: "j", ctrlKey: true }));
    expect(run).not.toHaveBeenCalled();

    await loadShortcutBinding();
    window.dispatchEvent(key({ key: "j", ctrlKey: true }));
    expect(run).toHaveBeenCalledTimes(1);

    action.destroy();
    node.remove();
  });

  it("doesn't bind after it's destroyed before the code loads", async () => {
    const node = document.createElement("button");
    document.body.append(node);
    const run = vi.fn();
    lazyKeyboardShortcut(node, { shortcut: "ctrl+u", run }).destroy();

    await loadShortcutBinding();
    window.dispatchEvent(key({ key: "u", ctrlKey: true }));
    expect(run).not.toHaveBeenCalled();
    node.remove();
  });
});
