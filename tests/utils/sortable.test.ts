import { sortable } from "../../src/utils/sortable.js";
import type { SortableOptions } from "../../src/utils/sortable.js";

type Detail = import("../../src/utils/sortable-model.js").SortDetail;

function buildList(
  texts: string[],
  { posinset = 0, handle = true } = {},
): HTMLUListElement {
  const list = document.createElement("ul");
  texts.forEach((text, index) => {
    const item = document.createElement("li");
    item.dataset.sortableId = text.toLowerCase();
    if (posinset) item.setAttribute("aria-posinset", String(posinset + index));
    if (handle) {
      const grip = document.createElement("button");
      grip.type = "button";
      item.append(grip);
    }
    item.append(text);
    list.append(item);
  });
  document.body.append(list);
  return list;
}

const targets = (list: HTMLElement) =>
  [...list.querySelectorAll("li")].map(
    (item) => item.querySelector<HTMLElement>("button") ?? item,
  );

// A repeated message gains an invisible tail so it is announced again.
const status = () =>
  document
    .querySelector("[role='status']")
    ?.textContent?.replace(/\u200b/g, "");

function press(target: Element, key: string, init: KeyboardEventInit = {}) {
  target.dispatchEvent(
    new KeyboardEvent("keydown", {
      key,
      bubbles: true,
      cancelable: true,
      ...init,
    }),
  );
}

describe("sortable", () => {
  const cleanups: Array<() => void> = [];

  function mount(
    list: HTMLElement,
    options: SortableOptions = { handleSelector: "button" },
  ) {
    const action = sortable(list, options);
    cleanups.push(() => action.destroy());
    const sorts: Detail[] = [];
    list.addEventListener("sort", (event) =>
      sorts.push((event as CustomEvent<Detail>).detail),
    );
    return { action, sorts };
  }

  afterEach(() => {
    for (const cleanup of cleanups.splice(0)) cleanup();
    document.body.innerHTML = "";
  });

  it("makes the list one tab stop and describes each handle", () => {
    const list = buildList(["Alpha", "Bravo", "Charlie"]);
    mount(list);
    const [first, second] = targets(list);

    expect(first.getAttribute("tabindex")).toBe("0");
    expect(second.getAttribute("tabindex")).toBe("-1");
    expect(first.getAttribute("aria-roledescription")).toBe("sortable item");
    expect(first.getAttribute("aria-label")).toBe("Reorder Alpha");
    const described = first.getAttribute("aria-describedby") ?? "";
    expect(document.getElementById(described)?.textContent).toMatch(
      /^Press Space to pick up/,
    );
  });

  it("moves focus between items while idle", () => {
    const list = buildList(["Alpha", "Bravo", "Charlie"]);
    mount(list);
    const [first, second, third] = targets(list);

    first.focus();
    press(first, "ArrowDown");
    expect(document.activeElement).toBe(second);
    expect(second.getAttribute("tabindex")).toBe("0");
    expect(first.getAttribute("tabindex")).toBe("-1");
    press(second, "End");
    expect(document.activeElement).toBe(third);
  });

  it("picks up, moves, and drops with a cancelable sort event", () => {
    const list = buildList(["Alpha", "Bravo", "Charlie"]);
    const { sorts } = mount(list, {
      handleSelector: "button",
      name: "Letters",
    });
    const [first] = targets(list);

    first.focus();
    press(first, " ");
    expect(status()).toBe("Picked up Alpha, position 1 of 3.");
    expect(list.querySelector("li")?.hasAttribute("data-sortable-lifted")).toBe(
      true,
    );
    press(first, "ArrowDown");
    press(first, "ArrowDown");
    expect(status()).toBe("Alpha moved to position 3 of 3.");
    press(first, " ");

    expect(sorts).toEqual([
      {
        id: "alpha",
        from: "Letters",
        to: "Letters",
        oldIndex: 0,
        newIndex: 2,
        source: "keyboard",
      },
    ]);
    expect(status()).toBe("Dropped Alpha at position 3 of 3.");
    expect(list.querySelector("[data-sortable-lifted]")).toBeNull();
    expect(list.textContent).toBe("AlphaBravoCharlie");
  });

  it("reports no move when the item is dropped where it was", () => {
    const list = buildList(["Alpha", "Bravo"]);
    const { sorts } = mount(list);
    const [, second] = targets(list);

    second.focus();
    press(second, " ");
    press(second, "ArrowUp");
    press(second, "ArrowDown");
    press(second, " ");

    expect(sorts).toEqual([]);
    expect(status()).toBe("Dropped Bravo at position 2 of 2.");
  });

  it("puts the item back on Escape", () => {
    const list = buildList(["Alpha", "Bravo"]);
    const { sorts } = mount(list);
    const [first] = targets(list);

    first.focus();
    press(first, " ");
    press(first, "ArrowDown");
    const cancelKey = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    const reached = vi.fn();
    document.addEventListener("keydown", reached);
    first.dispatchEvent(cancelKey);
    document.removeEventListener("keydown", reached);

    expect(sorts).toEqual([]);
    expect(status()).toBe("Cancelled. Alpha is back at position 1 of 2.");
    expect(list.querySelector("[data-sortable-lifted]")).toBeNull();
    // A parent such as a Modal must not see the Escape that cancelled.
    expect(reached).not.toHaveBeenCalled();
  });

  it("treats a prevented sort event as a refusal", () => {
    const list = buildList(["Alpha", "Bravo"]);
    mount(list);
    list.addEventListener("sort", (event) => event.preventDefault());
    const [first] = targets(list);

    first.focus();
    press(first, " ");
    press(first, "ArrowDown");
    press(first, " ");

    expect(status()).toBe("Cancelled. Alpha is back at position 1 of 2.");
  });

  it("keeps hearing the keys after focus leaves the lifted item", () => {
    const list = buildList(["Alpha", "Bravo", "Charlie"]);
    const { sorts } = mount(list);
    const [first] = targets(list);

    first.focus();
    press(first, " ");
    // A windowed list can unmount the focused handle mid-move.
    first.blur();
    press(document.body, "ArrowDown");
    press(document.body, " ");

    expect(sorts.map(({ newIndex }) => newIndex)).toEqual([1]);
  });

  it("uses aria-posinset for the index of a windowed row", () => {
    const list = buildList(["Row 41", "Row 42", "Row 43"], { posinset: 41 });
    list.querySelector("li")?.setAttribute("aria-setsize", "1000");
    const { sorts } = mount(list);
    const [first] = targets(list);

    first.focus();
    press(first, " ");
    expect(status()).toBe("Picked up Row 41, position 41 of 1000.");
    press(first, "ArrowDown");
    press(first, " ");

    expect(sorts[0]).toMatchObject({ oldIndex: 40, newIndex: 41 });
  });

  it("swaps the inline arrows of a horizontal list in RTL", () => {
    const list = buildList(["One", "Two", "Three"]);
    list.setAttribute("dir", "rtl");
    const { sorts } = mount(list, {
      handleSelector: "button",
      orientation: "horizontal",
    });
    const [first] = targets(list);

    first.focus();
    press(first, " ");
    press(first, "ArrowRight");
    expect(status()).toBe("One moved to position 1 of 3.");
    press(first, "ArrowLeft");
    press(first, " ");

    expect(sorts[0]).toMatchObject({ oldIndex: 0, newIndex: 1 });
  });

  it("moves an item to a connected list and dispatches on the target", () => {
    const todo = buildList(["Write", "Test"]);
    const done = buildList(["Plan"]);
    mount(todo, { handleSelector: "button", name: "todo", group: "board" });
    const { sorts } = mount(done, {
      handleSelector: "button",
      name: "done",
      group: "board",
    });
    const [write] = targets(todo);

    write.focus();
    press(write, " ");
    press(write, "ArrowRight");
    expect(status()).toBe("Write moved to done, position 1 of 2.");
    press(write, "ArrowDown");
    press(write, " ");

    expect(sorts).toEqual([
      {
        id: "write",
        from: "todo",
        to: "done",
        oldIndex: 0,
        newIndex: 1,
        source: "keyboard",
      },
    ]);
  });

  it("uses the item when there is no handle", () => {
    const list = buildList(["Alpha", "Bravo"], { handle: false });
    const { sorts } = mount(list, {});
    const [first] = targets(list);

    expect(first.getAttribute("tabindex")).toBe("0");
    first.focus();
    press(first, "Enter");
    press(first, "ArrowDown");
    press(first, "Enter");

    expect(sorts[0]).toMatchObject({ oldIndex: 0, newIndex: 1 });
  });

  it("leaves keys from controls inside an item alone", () => {
    const list = buildList(["Alpha", "Bravo"], { handle: false });
    const link = document.createElement("a");
    link.href = "#x";
    list.querySelector("li")?.append(link);
    mount(list, {});

    const space = new KeyboardEvent("keydown", {
      key: " ",
      bubbles: true,
      cancelable: true,
    });
    link.dispatchEvent(space);

    expect(space.defaultPrevented).toBe(false);
    expect(status()).toBe("");
  });

  it("takes its strings from the options", () => {
    const list = buildList(["Alpha", "Bravo"]);
    mount(list, {
      handleSelector: "button",
      pickedUpText: ({ label, position }) => `Levantado ${label} ${position}`,
      roleDescriptionText: "elemento ordenable",
    });
    const [first] = targets(list);

    expect(first.getAttribute("aria-roledescription")).toBe(
      "elemento ordenable",
    );
    first.focus();
    press(first, " ");
    expect(status()).toBe("Levantado Alpha 1");
  });

  it("adds nothing for a disabled list", () => {
    const list = buildList(["Alpha", "Bravo"]);
    const { sorts } = mount(list, { handleSelector: "button", disabled: true });
    const [first] = targets(list);

    first.focus();
    press(first, " ");
    press(first, "ArrowDown");

    expect(sorts).toEqual([]);
    expect(status()).toBe("");
  });

  it("removes what it added on destroy", () => {
    const list = buildList(["Alpha", "Bravo"]);
    const { action } = mount(list);
    const [first] = targets(list);
    first.focus();
    press(first, " ");

    action.destroy();

    expect(document.querySelector("[role='status']")).toBeNull();
    expect(document.querySelector("[hidden]")).toBeNull();
    expect(first.hasAttribute("aria-roledescription")).toBe(false);
    expect(first.hasAttribute("tabindex")).toBe(false);
    expect(first.hasAttribute("aria-describedby")).toBe(false);
    expect(first.hasAttribute("aria-label")).toBe(false);
    expect(document.querySelector(".bx--sortable__indicator")).toBeNull();
  });
});
