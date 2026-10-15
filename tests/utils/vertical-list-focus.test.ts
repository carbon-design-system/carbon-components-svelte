import { verticalListFocus } from "../../src/utils/vertical-list-focus.js";

function setup(
  labels: string[],
  options: { isDisabled?: (item: HTMLElement) => boolean } = {},
  parent: Node = document.body,
) {
  const container = document.createElement("div");
  const items = labels.map((label) => {
    const button = document.createElement("button");
    button.setAttribute("role", "menuitem");
    button.textContent = label;
    container.appendChild(button);
    return button;
  });
  parent.appendChild(container);
  const action = verticalListFocus(container, {
    selector: "[role='menuitem']",
    ...options,
  });
  return { container, items, action };
}

function press(target: HTMLElement, key: string) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("verticalListFocus", () => {
  it("moves focus with Up/Down, wrapping at the ends", () => {
    const { items } = setup(["a", "b", "c"]);
    items[0].focus();
    press(items[0], "ArrowDown");
    expect(items[1]).toHaveFocus();
    press(items[1], "ArrowDown");
    press(items[2], "ArrowDown");
    expect(items[0]).toHaveFocus();
    press(items[0], "ArrowUp");
    expect(items[2]).toHaveFocus();
  });

  it("jumps with Home and End", () => {
    const { items } = setup(["a", "b", "c"]);
    items[1].focus();
    press(items[1], "End");
    expect(items[2]).toHaveFocus();
    press(items[2], "Home");
    expect(items[0]).toHaveFocus();
  });

  it("prevents the default scroll for arrow keys", () => {
    const { items } = setup(["a", "b"]);
    items[0].focus();
    expect(press(items[0], "ArrowDown").defaultPrevented).toBe(true);
  });

  it("follows DOM order for items inserted later", () => {
    const { container, items } = setup(["a", "c"]);
    const inserted = document.createElement("button");
    inserted.setAttribute("role", "menuitem");
    container.insertBefore(inserted, items[1]);
    items[0].focus();
    press(items[0], "ArrowDown");
    expect(inserted).toHaveFocus();
  });

  it("skips items when isDisabled is given", () => {
    const { items } = setup(["a", "b", "c"], {
      isDisabled: (item) => item.textContent === "b",
    });
    items[0].focus();
    press(items[0], "ArrowDown");
    expect(items[2]).toHaveFocus();
  });

  it("stops listening after destroy", () => {
    const { items, action } = setup(["a", "b"]);
    action.destroy();
    items[0].focus();
    press(items[0], "ArrowDown");
    expect(items[0]).toHaveFocus();
  });
});

describe("verticalListFocus inside a shadow root", () => {
  it("moves focus from the focused item", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = host.attachShadow({ mode: "open" });
    const { items } = setup(["a", "b", "c"], {}, root);
    items[1].focus();

    press(items[1], "ArrowDown");

    expect(root.activeElement).toBe(items[2]);
  });
});
