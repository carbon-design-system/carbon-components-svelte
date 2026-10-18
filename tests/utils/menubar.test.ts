import { createMenubar } from "../../src/utils/menubar.js";

function setup() {
  const bar = createMenubar();
  const container = document.createElement("ul");
  const items = ["one", "two", "three"].map((label) => {
    const li = document.createElement("li");
    const item = document.createElement("a");
    item.href = `#${label}`;
    item.textContent = label;
    li.append(item);
    container.append(li);
    bar.register(item);
    return item;
  });
  container.addEventListener("keydown", bar.handleKeydown);
  document.body.append(container);
  return { items };
}

function press(target: HTMLElement, key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("createMenubar keydown", () => {
  it("moves focus with the arrow keys", () => {
    const { items } = setup();
    items[0].focus();

    const event = press(items[0], "ArrowRight");

    expect(items[1]).toHaveFocus();
    expect(event.defaultPrevented).toBe(true);
  });

  it.each(["altKey", "ctrlKey", "metaKey", "shiftKey"])(
    "ignores arrows pressed with %s",
    (modifier) => {
      const { items } = setup();
      items[0].focus();

      const event = press(items[0], "ArrowRight", { [modifier]: true });

      expect(items[0]).toHaveFocus();
      expect(event.defaultPrevented).toBe(false);
    },
  );

  it("ignores keys a consumer already handled", () => {
    const { items } = setup();
    items[0].addEventListener("keydown", (event) => event.preventDefault());
    items[0].focus();

    press(items[0], "ArrowRight");

    expect(items[0]).toHaveFocus();
  });
});
