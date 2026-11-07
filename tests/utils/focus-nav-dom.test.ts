import { get } from "svelte/store";
import {
  createFocusNav,
  focusNav,
  type FocusNavOptions,
} from "../../src/utils/focus-nav.js";

function list(labels: string[], tag = "button") {
  const host = document.createElement("div");
  host.setAttribute("role", "toolbar");
  const items = labels.map((label, i) => {
    const el = document.createElement(tag);
    el.setAttribute("role", "option");
    el.id = `item-${i}`;
    el.textContent = label;
    host.appendChild(el);
    return el;
  });
  document.body.appendChild(host);
  return { host, items };
}

function press(target: Element, key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  document.body.innerHTML = "";
});

describe("focusNav (roving)", () => {
  function setup(options: FocusNavOptions = {}, labels = ["A", "B", "C", "D"]) {
    const { host, items } = list(labels);
    const nav = createFocusNav({ selector: "[role=option]", ...options });
    const binding = focusNav(host, nav);
    return { host, items, nav, binding };
  }

  it("moves DOM focus to the next item and makes it the tab stop", () => {
    const { items, nav } = setup();
    items[0].focus();
    press(items[0], "ArrowRight");
    expect(document.activeElement).toBe(items[1]);
    expect(nav.index).toBe(1);
    expect(nav.tabIndex(1)).toBe(0);
    expect(nav.tabIndex(0)).toBe(-1);
  });

  it("calls preventDefault on a handled key only", () => {
    const { items } = setup();
    expect(press(items[0], "ArrowRight").defaultPrevented).toBe(true);
    expect(press(items[0], "ArrowDown").defaultPrevented).toBe(false);
    expect(press(items[0], "Tab").defaultPrevented).toBe(false);
  });

  it("starts from the focused item when the active index is stale", () => {
    const { items, nav } = setup();
    // Focus lands on item 2 by a click that never reached `set`.
    nav.set(0);
    items[2].focus();
    press(items[2], "ArrowRight");
    expect(document.activeElement).toBe(items[3]);
  });

  it("follows focus that arrives from a click or Tab", () => {
    const { items, nav } = setup();
    items[2].focus();
    expect(nav.index).toBe(2);
    expect(get(nav).index).toBe(2);
  });

  it("makes a clicked item the tab stop even when the browser does not focus it", () => {
    // Safari does not focus a button on click, so no `focusin` follows.
    const { items, nav } = setup();
    items[2].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(nav.index).toBe(2);
    expect(get(nav).tabStop).toBe(2);
  });

  it("skips disabled items, including a cluster", () => {
    const { items } = setup({ skipDisabled: true });
    items[1].setAttribute("disabled", "");
    items[2].setAttribute("aria-disabled", "true");
    items[0].focus();
    press(items[0], "ArrowRight");
    expect(document.activeElement).toBe(items[3]);
    press(items[3], "ArrowLeft");
    expect(document.activeElement).toBe(items[0]);
  });

  it("reads `rtl` on each key", () => {
    let rtl = true;
    const { items } = setup({ rtl: () => rtl });
    items[1].focus();
    press(items[1], "ArrowRight");
    expect(document.activeElement).toBe(items[0]);
    rtl = false;
    press(items[0], "ArrowRight");
    expect(document.activeElement).toBe(items[1]);
  });

  it("ignores keys with Ctrl, Alt or Meta, and keys from outside the items", () => {
    const { host, items } = setup();
    items[0].focus();
    for (const init of [
      { ctrlKey: true },
      { altKey: true },
      { metaKey: true },
    ]) {
      expect(press(items[0], "ArrowRight", init).defaultPrevented).toBe(false);
    }
    expect(document.activeElement).toBe(items[0]);
    const outside = document.createElement("input");
    host.appendChild(outside);
    outside.focus();
    expect(press(outside, "ArrowRight").defaultPrevented).toBe(false);
  });

  it("leaves a key to a control that owns it", () => {
    const { host, items } = setup({
      ownsKey: (event) => (event.target as HTMLElement).tagName === "INPUT",
    });
    const field = document.createElement("input");
    field.setAttribute("role", "option");
    host.appendChild(field);
    field.focus();
    expect(press(field, "ArrowLeft").defaultPrevented).toBe(false);
    expect(press(items[0], "ArrowLeft").defaultPrevented).toBe(true);
  });

  it("does not handle a key composed with an IME", () => {
    const { items } = setup();
    expect(
      press(items[0], "ArrowRight", { isComposing: true }).defaultPrevented,
    ).toBe(false);
    expect(
      press(items[0], "ArrowRight", { keyCode: 229 }).defaultPrevented,
    ).toBe(false);
  });

  it("reports Shift as `extend` and lets onMove take over", () => {
    const moves: Array<[number, boolean, number]> = [];
    const { items, nav } = setup({
      onMove: (index, { extend, from }) => {
        moves.push([index, extend, from]);
        return extend ? false : undefined;
      },
    });
    items[0].focus();
    press(items[0], "ArrowRight", { shiftKey: true });
    // onMove returned false: focus did not follow.
    expect(document.activeElement).toBe(items[0]);
    press(items[0], "ArrowRight");
    expect(document.activeElement).toBe(items[1]);
    expect(moves).toEqual([
      [1, true, 0],
      [1, false, 0],
    ]);
    expect(nav.index).toBe(1);
  });

  it("leaves Shift+key to the element with shift: 'ignore'", () => {
    const { items } = setup({ shift: "ignore" });
    expect(
      press(items[0], "ArrowRight", { shiftKey: true }).defaultPrevented,
    ).toBe(false);
    expect(press(items[0], "ArrowRight").defaultPrevented).toBe(true);
  });

  it("jumps by typeahead and cycles on a repeated letter", () => {
    const labels = ["Apple", "Banana", "Bacon", "Cherry"];
    const { items } = setup({ typeahead: { label: (i) => labels[i] } }, labels);
    items[0].focus();
    press(items[0], "b");
    expect(document.activeElement).toBe(items[1]);
    // "ba" completes Banana: it must not jump on to Bacon.
    press(items[1], "a");
    expect(document.activeElement).toBe(items[1]);
    press(items[1], "c");
    expect(document.activeElement).toBe(items[2]);
  });

  it("does not eat Space or modified letters for typeahead", () => {
    const { items } = setup({ typeahead: { label: () => "x" } });
    expect(press(items[0], " ").defaultPrevented).toBe(false);
    expect(press(items[0], "x", { ctrlKey: true }).defaultPrevented).toBe(
      false,
    );
  });

  it("stops listening after destroy", () => {
    const { items, binding } = setup();
    binding.destroy();
    expect(press(items[0], "ArrowRight").defaultPrevented).toBe(false);
  });

  it("takes plain options and applies updates", () => {
    const { host, items } = list(["A", "B", "C"]);
    const action = focusNav(host, { selector: "[role=option]", wrap: false });
    items[2].focus();
    press(items[2], "ArrowRight");
    expect(document.activeElement).toBe(items[2]);
    action.update({ selector: "[role=option]", wrap: true });
    press(items[2], "ArrowRight");
    expect(document.activeElement).toBe(items[0]);
    action.destroy();
  });

  it("keeps the goal column across a vertical run in a grid", () => {
    const { host, items } = list(Array.from({ length: 10 }, (_, i) => `${i}`));
    const nav = createFocusNav({
      selector: "[role=option]",
      orientation: "grid",
      columns: 4,
    });
    focusNav(host, nav);
    items[3].focus();
    press(items[3], "ArrowDown");
    press(items[7], "ArrowDown");
    expect(document.activeElement).toBe(items[9]);
    press(items[9], "ArrowUp");
    expect(document.activeElement).toBe(items[7]);
    // A horizontal move forgets the column.
    press(items[7], "ArrowLeft");
    press(items[6], "ArrowDown");
    expect(document.activeElement).toBe(items[9]);
    press(items[9], "ArrowUp");
    expect(document.activeElement).toBe(items[6]);
  });
});

describe("focusNav (activedescendant)", () => {
  function setup(options: FocusNavOptions = {}) {
    const { host, items } = list(["A", "B", "C", "D"], "div");
    host.tabIndex = 0;
    const nav = createFocusNav({
      mode: "activedescendant",
      orientation: "vertical",
      selector: "[role=option]",
      ...options,
    });
    focusNav(host, nav);
    return { host, items, nav };
  }

  it("keeps focus on the host and points aria-activedescendant at the item", () => {
    const { host, items } = setup();
    host.focus();
    press(host, "ArrowDown");
    expect(document.activeElement).toBe(host);
    expect(host.getAttribute("aria-activedescendant")).toBe("item-0");
    press(host, "ArrowDown");
    expect(host.getAttribute("aria-activedescendant")).toBe(items[1].id);
  });

  it("removes the attribute when there is no active item", () => {
    const { host, nav } = setup();
    press(host, "ArrowDown");
    expect(host.hasAttribute("aria-activedescendant")).toBe(true);
    nav.set(-1);
    expect(host.hasAttribute("aria-activedescendant")).toBe(false);
  });

  it("never points at an item that is not in the DOM", async () => {
    // A window of 3 of 100 items: only mounted items have an element.
    const mounted = new Set([0, 1, 2]);
    const host = document.createElement("div");
    host.tabIndex = 0;
    document.body.appendChild(host);
    const els = new Map<number, HTMLElement>();
    const render = () => {
      host.innerHTML = "";
      els.clear();
      for (const i of mounted) {
        const el = document.createElement("div");
        el.id = `row-${i}`;
        host.appendChild(el);
        els.set(i, el);
      }
    };
    render();
    const revealed: number[] = [];
    const nav = createFocusNav({
      mode: "activedescendant",
      orientation: "vertical",
      count: 100,
      getItem: (i) => els.get(i),
      getId: (i) => `row-${i}`,
      reveal: (i) => {
        if (els.has(i)) return undefined;
        revealed.push(i);
        mounted.clear();
        for (let n = i; n < i + 3; n++) mounted.add(n);
        // A later render, as a framework's would be.
        return Promise.resolve().then(render);
      },
    });
    focusNav(host, nav);

    press(host, "Home");
    expect(host.getAttribute("aria-activedescendant")).toBe("row-0");
    expect(revealed).toEqual([]);

    press(host, "End");
    // The target is not mounted yet: the old id is cleared, not left dangling.
    expect(host.hasAttribute("aria-activedescendant")).toBe(false);
    expect(nav.index).toBe(99);
    await flush();
    expect(revealed).toEqual([99]);
    expect(host.getAttribute("aria-activedescendant")).toBe("row-99");
    expect(document.getElementById("row-99")).not.toBeNull();
  });

  it("moves from the newest target when keys arrive while a mount is pending", async () => {
    const els = new Map<number, HTMLElement>();
    const host = document.createElement("div");
    document.body.appendChild(host);
    const resolvers: Array<() => void> = [];
    const mount = (i: number) => {
      const el = document.createElement("div");
      el.id = `row-${i}`;
      host.appendChild(el);
      els.set(i, el);
    };
    mount(0);
    const nav = createFocusNav({
      mode: "activedescendant",
      orientation: "vertical",
      count: 50,
      index: 0,
      getItem: (i) => els.get(i),
      getId: (i) => `row-${i}`,
      reveal: (i) =>
        new Promise<void>((resolve) => {
          resolvers.push(() => {
            mount(i);
            resolve();
          });
        }),
    });
    focusNav(host, nav);
    // Held ArrowDown: three keys before the first mount finishes.
    press(host, "ArrowDown");
    press(host, "ArrowDown");
    press(host, "ArrowDown");
    expect(nav.index).toBe(3);
    for (const resolve of resolvers) resolve();
    await flush();
    // Only the newest request wins; the stale ones do not set the id.
    expect(host.getAttribute("aria-activedescendant")).toBe("row-3");
  });

  it("validate() clears an id whose item has unmounted", () => {
    const { host, items, nav } = setup();
    nav.set(3);
    expect(host.getAttribute("aria-activedescendant")).toBe("item-3");
    items[3].remove();
    nav.validate();
    expect(host.hasAttribute("aria-activedescendant")).toBe(false);
  });

  it("uses typeahead without moving focus", () => {
    const labels = ["Apple", "Banana", "Cherry", "Date"];
    const { host } = setup({ typeahead: { label: (i) => labels[i] } });
    host.focus();
    press(host, "c");
    expect(host.getAttribute("aria-activedescendant")).toBe("item-2");
    expect(document.activeElement).toBe(host);
  });
});

describe("createFocusNav (headless)", () => {
  it("tabIndex gives the first enabled item the tab stop when none is active", () => {
    const nav = createFocusNav({ count: 5, skip: (i) => i < 2 });
    expect([0, 1, 2, 3].map((i) => nav.tabIndex(i))).toEqual([-1, -1, 0, -1]);
    nav.set(3);
    expect([0, 1, 2, 3].map((i) => nav.tabIndex(i))).toEqual([-1, -1, -1, 0]);
  });

  it("publishes the tab stop in its store, and follows update()", () => {
    let skipped = 2;
    const nav = createFocusNav({ count: 5, skip: (i) => i < skipped });
    expect(get(nav).tabStop).toBe(2);
    skipped = 4;
    nav.update({ count: 5, skip: (i) => i < skipped });
    expect(get(nav).tabStop).toBe(4);
    nav.set(1);
    expect(get(nav).tabStop).toBe(1);
  });

  it("handleKeydown works as an on:keydown handler with no node", () => {
    const moves: number[] = [];
    const nav = createFocusNav({
      count: 5,
      orientation: "vertical",
      onMove: (index) => {
        moves.push(index);
      },
    });
    const event = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      cancelable: true,
    });
    expect(nav.handleKeydown(event)).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    expect(
      nav.handleKeydown(new KeyboardEvent("keydown", { key: "ArrowDown" })),
    ).toBe(true);
    expect(moves).toEqual([0, 1]);
    expect(get(nav).index).toBe(1);
  });

  it("moves from `at.from` instead of the active index", () => {
    const nav = createFocusNav({ count: 10, index: 0 });
    const moves: number[] = [];
    nav.update({
      count: 10,
      onMove: (index) => {
        moves.push(index);
      },
    });
    nav.handleKeydown(new KeyboardEvent("keydown", { key: "ArrowRight" }), {
      from: 6,
    });
    expect(moves).toEqual([7]);
  });

  it("does not move when nothing is enabled", () => {
    const nav = createFocusNav({ count: 3, skip: () => true });
    const event = new KeyboardEvent("keydown", {
      key: "Home",
      cancelable: true,
    });
    expect(nav.handleKeydown(event)).toBe(true);
    expect(nav.index).toBe(-1);
  });
});
