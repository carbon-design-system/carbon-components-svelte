import { historyKeys } from "../../src/utils/history-keys.js";
import { createHistory } from "../../src/utils/history.js";
import { flushMacrotask } from "./flush-macrotask";

type Keys = { key: string; meta?: boolean; ctrl?: boolean; shift?: boolean };

function press(target: Element, { key, meta, ctrl, shift }: Keys) {
  const event = new KeyboardEvent("keydown", {
    key,
    metaKey: !!meta,
    ctrlKey: !!ctrl,
    shiftKey: !!shift,
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
}

function platform(name: "Win32" | "MacIntel") {
  return vi.spyOn(navigator, "platform", "get").mockReturnValue(name);
}

describe("historyKeys", () => {
  let host: HTMLDivElement;
  let button: HTMLButtonElement;
  let input: HTMLInputElement;
  let area: HTMLTextAreaElement;
  let history: ReturnType<typeof createHistory>;
  let log: string[];
  let action: ReturnType<typeof historyKeys>;

  beforeEach(() => {
    document.body.innerHTML = `<div id="host">
      <button id="button">b</button>
      <input id="input">
      <input id="readonly" readonly>
      <input id="check" type="checkbox">
      <textarea id="area"></textarea>
      <div id="editable" contenteditable="true"></div>
      <select id="select"><option>a</option></select>
    </div>`;
    host = document.querySelector("#host") as HTMLDivElement;
    button = document.querySelector("#button") as HTMLButtonElement;
    input = document.querySelector("#input") as HTMLInputElement;
    area = document.querySelector("#area") as HTMLTextAreaElement;
    log = [];
    history = createHistory();
    history.push({
      label: "a",
      do: () => log.push("do"),
      undo: () => log.push("undo"),
    });
  });

  afterEach(() => {
    action?.destroy();
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("undoes on Control+Z and redoes on Control+Shift+Z and Control+Y outside a field", () => {
    platform("Win32");
    action = historyKeys(host, history);

    const undo = press(button, { key: "z", ctrl: true });
    expect(undo.defaultPrevented).toBe(true);
    press(button, { key: "Z", ctrl: true, shift: true });
    press(button, { key: "z", ctrl: true });
    press(button, { key: "y", ctrl: true });
    expect(log).toEqual(["undo", "do", "undo", "do"]);
  });

  it("uses Command on macOS, and leaves Control+Y to the platform", () => {
    platform("MacIntel");
    action = historyKeys(host, history);

    press(button, { key: "z", ctrl: true });
    expect(log).toEqual([]);
    press(button, { key: "z", meta: true });
    expect(log).toEqual(["undo"]);
    press(button, { key: "z", meta: true, shift: true });
    expect(log).toEqual(["undo", "do"]);

    const yank = press(button, { key: "y", ctrl: true });
    expect(yank.defaultPrevented).toBe(false);
    expect(log).toEqual(["undo", "do"]);
  });

  it("ignores Command+Z on Windows", () => {
    platform("Win32");
    action = historyKeys(host, history);
    const event = press(button, { key: "z", meta: true });
    expect(event.defaultPrevented).toBe(false);
    expect(log).toEqual([]);
  });

  it("ignores other keys, extra modifiers and handled events", () => {
    platform("Win32");
    action = historyKeys(host, history);
    press(button, { key: "x", ctrl: true });
    press(button, { key: "z" });
    const alt = new KeyboardEvent("keydown", {
      key: "z",
      ctrlKey: true,
      altKey: true,
      bubbles: true,
    });
    button.dispatchEvent(alt);
    button.addEventListener("keydown", (event) => event.preventDefault());
    press(button, { key: "z", ctrl: true });
    expect(log).toEqual([]);
  });

  it("ignores a key pressed during an IME composition", () => {
    platform("Win32");
    action = historyKeys(host, history);
    button.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "z",
        ctrlKey: true,
        isComposing: true,
        bubbles: true,
      }),
    );
    expect(log).toEqual([]);
  });

  it("leaves a text field to the browser by default", () => {
    platform("Win32");
    action = historyKeys(host, history);
    for (const element of [
      input,
      area,
      document.querySelector("#editable") as HTMLElement,
    ]) {
      jsdomEditable(element);
      const event = press(element, { key: "z", ctrl: true });
      expect(event.defaultPrevented).toBe(false);
    }
    expect(log).toEqual([]);
  });

  it("takes the key from a field with no native undo", () => {
    platform("Win32");
    action = historyKeys(host, history);
    for (const id of ["readonly", "check", "select"]) {
      const element = document.querySelector(`#${id}`) as HTMLElement;
      history.push({ do: () => {}, undo: () => log.push(`undo ${id}`) });
      const event = press(element, { key: "z", ctrl: true });
      expect(event.defaultPrevented).toBe(true);
    }
    expect(log).toEqual(["undo readonly", "undo check", "undo select"]);
  });

  it('runs the history in a field with fields: "app"', () => {
    platform("Win32");
    action = historyKeys(host, { history, fields: "app" });
    const event = press(input, { key: "z", ctrl: true });
    expect(event.defaultPrevented).toBe(true);
    expect(log).toEqual(["undo"]);
  });

  it('with fields: "fallthrough", runs the history when the browser did nothing', async () => {
    platform("Win32");
    action = historyKeys(host, { history, fields: "fallthrough" });
    const event = press(input, { key: "z", ctrl: true });
    expect(event.defaultPrevented).toBe(false);
    expect(log).toEqual([]);
    await flushMacrotask();
    expect(log).toEqual(["undo"]);
  });

  it('with fields: "fallthrough", leaves the history alone when the browser undid', async () => {
    platform("Win32");
    action = historyKeys(host, { history, fields: "fallthrough" });
    press(input, { key: "z", ctrl: true });
    // A native undo fires beforeinput, on any field of the page.
    area.dispatchEvent(
      new InputEvent("beforeinput", {
        inputType: "historyUndo",
        bubbles: true,
        cancelable: true,
      }),
    );
    await flushMacrotask();
    expect(log).toEqual([]);

    // The next press, with nothing native, falls through again.
    press(input, { key: "z", ctrl: true });
    await flushMacrotask();
    expect(log).toEqual(["undo"]);
  });

  it("stops a pending fallthrough on destroy", async () => {
    platform("Win32");
    action = historyKeys(host, { history, fields: "fallthrough" });
    press(input, { key: "z", ctrl: true });
    action.destroy();
    await flushMacrotask();
    expect(log).toEqual([]);
  });

  it("takes custom keys and follows an update to another history", () => {
    platform("Win32");
    action = historyKeys(host, { history, undoKeys: "mod+u" });
    press(button, { key: "z", ctrl: true });
    expect(log).toEqual([]);
    press(button, { key: "u", ctrl: true });
    expect(log).toEqual(["undo"]);

    const other = createHistory();
    other.push({
      do: () => log.push("other do"),
      undo: () => log.push("other"),
    });
    action.update(other);
    press(button, { key: "z", ctrl: true });
    expect(log).toEqual(["undo", "other"]);
  });

  it('with scope: "document", handles keys when nothing has focus and follows an update', () => {
    platform("Win32");
    action = historyKeys(host, { history, scope: "document" });
    press(document.body, { key: "z", ctrl: true });
    expect(log).toEqual(["undo"]);

    history.redo();
    action.update({ history });
    press(document.body, { key: "z", ctrl: true });
    expect(log).toEqual(["undo", "do"]);
    press(button, { key: "z", ctrl: true });
    expect(log).toEqual(["undo", "do", "undo"]);

    action.destroy();
    history.redo();
    press(button, { key: "z", ctrl: true });
    expect(log).toEqual(["undo", "do", "undo", "do"]);
  });

  it("stops listening on destroy", () => {
    platform("Win32");
    action = historyKeys(host, history);
    action.destroy();
    press(button, { key: "z", ctrl: true });
    expect(log).toEqual([]);
  });

  it("keeps the key when there is nothing to undo, so the browser stays out", () => {
    platform("Win32");
    history.clear();
    action = historyKeys(host, history);
    const event = press(button, { key: "z", ctrl: true });
    expect(event.defaultPrevented).toBe(true);
  });
});

/** jsdom has no `isContentEditable`; define it for the editable region. */
function jsdomEditable(element: HTMLElement) {
  if (element.getAttribute("contenteditable") === "true") {
    Object.defineProperty(element, "isContentEditable", { value: true });
  }
}
