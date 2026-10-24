import { createMenubar } from "../../src/utils/menubar.js";

function setup(options?: Parameters<typeof createMenubar>[0]) {
  const bar = createMenubar(options);
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

  it("swaps ArrowLeft and ArrowRight while rtl returns true", () => {
    let rtl = true;
    const { items } = setup({ rtl: () => rtl });
    items[1].focus();

    press(items[1], "ArrowLeft");
    expect(items[2]).toHaveFocus();
    press(items[2], "ArrowRight");
    expect(items[1]).toHaveFocus();

    rtl = false;
    press(items[1], "ArrowRight");
    expect(items[2]).toHaveFocus();
  });

  it("keeps Up and Down in a vertical bar in RTL", () => {
    const rtl = vi.fn(() => true);
    const { items } = setup({ orientation: "vertical", rtl });
    items[0].focus();

    press(items[0], "ArrowDown");
    expect(items[1]).toHaveFocus();
    press(items[1], "ArrowLeft");
    expect(items[1]).toHaveFocus();
    expect(rtl).not.toHaveBeenCalled();
  });
});
