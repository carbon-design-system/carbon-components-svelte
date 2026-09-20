import { get, writable } from "svelte/store";
import { createOptionListNavigator } from "../../src/utils/option-list-navigator.js";

function buildMenu(
  options: Array<{ id: string; disabled?: boolean; hidden?: boolean }>,
) {
  const menu = document.createElement("div");
  for (const option of options) {
    const el = document.createElement("div");
    el.id = option.id;
    el.setAttribute("role", "option");
    if (option.disabled) el.setAttribute("aria-disabled", "true");
    if (option.hidden) el.setAttribute("hidden", "");
    menu.appendChild(el);
  }
  return menu;
}

describe("createOptionListNavigator", () => {
  test("getOptionElements skips aria-disabled options", () => {
    const menu = buildMenu([
      { id: "a" },
      { id: "b", disabled: true },
      { id: "c" },
    ]);
    const navigator = createOptionListNavigator({
      getMenuRef: () => menu,
      highlightedId: writable(null),
    });

    expect(navigator.getOptionElements().map((el) => el.id)).toEqual([
      "a",
      "c",
    ]);
  });

  test("getOptionElements excludes hidden options by default", () => {
    const menu = buildMenu([{ id: "a" }, { id: "b", hidden: true }]);
    const navigator = createOptionListNavigator({
      getMenuRef: () => menu,
      highlightedId: writable(null),
    });

    expect(navigator.getOptionElements().map((el) => el.id)).toEqual(["a"]);
  });

  test("includeHidden keeps hidden options", () => {
    const menu = buildMenu([{ id: "a" }, { id: "b", hidden: true }]);
    const navigator = createOptionListNavigator({
      getMenuRef: () => menu,
      highlightedId: writable(null),
      includeHidden: true,
    });

    expect(navigator.getOptionElements().map((el) => el.id)).toEqual([
      "a",
      "b",
    ]);
  });

  test("moveActive sets null when there are no options", () => {
    const menu = buildMenu([]);
    const highlightedId = writable<string | null>("stale");
    const navigator = createOptionListNavigator({
      getMenuRef: () => menu,
      highlightedId,
    });

    navigator.moveActive(1);
    expect(get(highlightedId)).toBeNull();
  });

  test("moveActive steps forward and wraps at the end", () => {
    const menu = buildMenu([{ id: "a" }, { id: "b" }, { id: "c" }]);
    const highlightedId = writable<string | null>("c");
    const navigator = createOptionListNavigator({
      getMenuRef: () => menu,
      highlightedId,
    });

    navigator.moveActive(1);
    expect(get(highlightedId)).toBe("a");
  });

  test("moveActive steps backward and wraps at the start", () => {
    const menu = buildMenu([{ id: "a" }, { id: "b" }, { id: "c" }]);
    const highlightedId = writable<string | null>("a");
    const navigator = createOptionListNavigator({
      getMenuRef: () => menu,
      highlightedId,
    });

    navigator.moveActive(-1);
    expect(get(highlightedId)).toBe("c");
  });

  test("moveActive from an id no longer in the list starts at the first option", () => {
    const menu = buildMenu([{ id: "a" }, { id: "b" }]);
    const highlightedId = writable<string | null>("stale");
    const navigator = createOptionListNavigator({
      getMenuRef: () => menu,
      highlightedId,
    });

    navigator.moveActive(1);
    expect(get(highlightedId)).toBe("a");
  });

  test("setActiveEdge jumps to the first or last option", () => {
    const menu = buildMenu([{ id: "a" }, { id: "b" }, { id: "c" }]);
    const highlightedId = writable<string | null>(null);
    const navigator = createOptionListNavigator({
      getMenuRef: () => menu,
      highlightedId,
    });

    navigator.setActiveEdge("first");
    expect(get(highlightedId)).toBe("a");

    navigator.setActiveEdge("last");
    expect(get(highlightedId)).toBe("c");
  });

  test("setActiveEdge is a no-op when there are no options", () => {
    const menu = buildMenu([]);
    const highlightedId = writable<string | null>("kept");
    const navigator = createOptionListNavigator({
      getMenuRef: () => menu,
      highlightedId,
    });

    navigator.setActiveEdge("first");
    expect(get(highlightedId)).toBe("kept");
  });

  test("getOptionElements returns an empty list when the menu ref is missing", () => {
    const highlightedId = writable<string | null>(null);
    const navigator = createOptionListNavigator({
      getMenuRef: () => null,
      highlightedId,
    });

    expect(navigator.getOptionElements()).toEqual([]);
  });
});
