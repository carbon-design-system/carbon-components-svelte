import {
  mediaShortcutAction,
  shortcutScope,
} from "../../src/MediaPlayer/media-shortcuts.js";

function press(key: string, init: KeyboardEventInit = {}) {
  return new KeyboardEvent("keydown", { key, bubbles: true, ...init });
}

function element<T extends HTMLElement>(html: string): T {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.append(host);
  return host.firstElementChild as T;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("shortcutScope", () => {
  it("gives the player and its video every key", () => {
    const root = element("<div></div>");
    expect(shortcutScope(root, root)).toBe("surface");
    expect(shortcutScope(document.createElement("video"), root)).toBe(
      "surface",
    );
  });

  it("leaves Space to a button, a link and a slider", () => {
    const root = element("<div><button>Play</button></div>");
    expect(shortcutScope(root.firstElementChild, root)).toBe("keys");
    const range = element('<input type="range">');
    expect(shortcutScope(range, root)).toBe("keys");
  });

  it.each([
    "<input>",
    '<input type="search">',
    "<textarea></textarea>",
    "<select></select>",
    '<div contenteditable="true"></div>',
    '<ul role="menu"><li id="item" tabindex="-1">Item</li></ul>',
    '<div role="dialog"><button>Close</button></div>',
  ])("takes no key inside %s", (html) => {
    const root = element("<div></div>");
    const node = element(html);
    const target = node.querySelector("button, li") ?? node;
    // jsdom has no `isContentEditable`.
    if (node.getAttribute("contenteditable")) {
      Object.defineProperty(node, "isContentEditable", { value: true });
    }
    expect(shortcutScope(target, root)).toBe("none");
  });
});

describe("mediaShortcutAction", () => {
  it.each([
    ["k", "playPause"],
    [" ", "playPause"],
    ["m", "mute"],
    ["f", "fullscreen"],
    ["c", "captions"],
    ["j", "back"],
    ["l", "forward"],
    ["<", "slower"],
    [">", "faster"],
    ["?", "help"],
  ])("maps %j to %s on the player", (key, action) => {
    expect(mediaShortcutAction(press(key), "surface")).toBe(action);
  });

  it("takes the symbol keys with Shift, as typed", () => {
    expect(mediaShortcutAction(press("<", { shiftKey: true }), "keys")).toBe(
      "slower",
    );
  });

  it("does not take Space on a button, or a letter in a field", () => {
    expect(mediaShortcutAction(press(" "), "keys")).toBeNull();
    expect(mediaShortcutAction(press("k"), "keys")).toBe("playPause");
    expect(mediaShortcutAction(press("k"), "none")).toBeNull();
  });

  it("takes the arrow keys only on the player itself", () => {
    expect(mediaShortcutAction(press("ArrowRight"), "surface")).toBe(
      "seekForward",
    );
    expect(mediaShortcutAction(press("ArrowRight"), "keys")).toBeNull();
    expect(mediaShortcutAction(press("ArrowUp"), "surface")).toBe("volumeUp");
  });

  it("leaves browser combinations and handled keys alone", () => {
    expect(mediaShortcutAction(press("f", { ctrlKey: true }), "surface")).toBe(
      null,
    );
    expect(mediaShortcutAction(press("m", { metaKey: true }), "surface")).toBe(
      null,
    );
    const handled = press("k", { cancelable: true });
    handled.preventDefault();
    expect(mediaShortcutAction(handled, "surface")).toBeNull();
  });

  it("repeats seeks while a key is held but not toggles", () => {
    expect(mediaShortcutAction(press("l", { repeat: true }), "surface")).toBe(
      "forward",
    );
    expect(
      mediaShortcutAction(press("k", { repeat: true }), "surface"),
    ).toBeNull();
  });
});
