import { rovingFocus } from "../../src/utils/rovingFocus.js";

type Options = Parameters<typeof rovingFocus>[1];

function setup(count: number, options: Partial<Options> = {}) {
  const container = document.createElement("div");
  const items = Array.from({ length: count }, (_, i) => {
    const button = document.createElement("button");
    button.setAttribute("role", "option");
    button.textContent = `Item ${i}`;
    container.appendChild(button);
    return button;
  });
  document.body.appendChild(container);

  let active = 0;
  const onMove = vi.fn((index: number) => {
    active = index;
  });

  const action = rovingFocus(container, {
    selector: "[role='option']",
    getActiveIndex: () => active,
    onMove,
    ...options,
  });

  return {
    container,
    items,
    onMove,
    action,
    setActive: (index: number) => {
      active = index;
    },
  };
}

function keydown(target: Element, key: string) {
  const event = new KeyboardEvent("keydown", { key, bubbles: true });
  const preventDefault = vi.spyOn(event, "preventDefault");
  target.dispatchEvent(event);
  return { event, preventDefault };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("rovingFocus", () => {
  test("ArrowRight moves to the next index", () => {
    const { items, onMove } = setup(3);
    keydown(items[0], "ArrowRight");
    expect(onMove).toHaveBeenCalledWith(1, expect.any(KeyboardEvent));
  });

  test("ArrowLeft wraps from the first item to the last", () => {
    const { items, onMove } = setup(3);
    keydown(items[0], "ArrowLeft");
    expect(onMove).toHaveBeenCalledWith(2, expect.any(KeyboardEvent));
  });

  test("ArrowRight wraps from the last item to the first", () => {
    const { items, onMove, setActive } = setup(3);
    setActive(2);
    keydown(items[2], "ArrowRight");
    expect(onMove).toHaveBeenCalledWith(0, expect.any(KeyboardEvent));
  });

  test("horizontal orientation ignores ArrowUp/ArrowDown", () => {
    const { items, onMove } = setup(3);
    keydown(items[0], "ArrowDown");
    keydown(items[0], "ArrowUp");
    expect(onMove).not.toHaveBeenCalled();
  });

  test("vertical orientation uses ArrowDown/ArrowUp, not Left/Right", () => {
    const { items, onMove } = setup(3, { orientation: "vertical" });
    keydown(items[0], "ArrowDown");
    expect(onMove).toHaveBeenCalledWith(1, expect.any(KeyboardEvent));

    onMove.mockClear();
    keydown(items[0], "ArrowRight");
    expect(onMove).not.toHaveBeenCalled();
  });

  test("both orientation handles all four arrow keys", () => {
    const { items, onMove } = setup(3, { orientation: "both" });
    keydown(items[0], "ArrowRight");
    keydown(items[0], "ArrowDown");
    expect(onMove).toHaveBeenCalledTimes(2);
  });

  test("Home jumps to the first item and calls preventDefault", () => {
    const { items, onMove, setActive } = setup(3);
    setActive(2);
    const { preventDefault } = keydown(items[2], "Home");
    expect(onMove).toHaveBeenCalledWith(0, expect.any(KeyboardEvent));
    expect(preventDefault).toHaveBeenCalledOnce();
  });

  test("End jumps to the last item and calls preventDefault", () => {
    const { items, onMove } = setup(3);
    const { preventDefault } = keydown(items[0], "End");
    expect(onMove).toHaveBeenCalledWith(2, expect.any(KeyboardEvent));
    expect(preventDefault).toHaveBeenCalledOnce();
  });

  test("arrow keys do not call preventDefault", () => {
    const { items } = setup(3);
    const { preventDefault } = keydown(items[0], "ArrowRight");
    expect(preventDefault).not.toHaveBeenCalled();
  });

  test("skipDisabled skips disabled items", () => {
    const { items, onMove } = setup(3, { skipDisabled: true });
    items[1].disabled = true;
    keydown(items[0], "ArrowRight");
    expect(onMove).toHaveBeenCalledWith(2, expect.any(KeyboardEvent));
  });

  test("without skipDisabled, navigation lands on a disabled item", () => {
    const { items, onMove } = setup(3);
    items[1].disabled = true;
    keydown(items[0], "ArrowRight");
    expect(onMove).toHaveBeenCalledWith(1, expect.any(KeyboardEvent));
  });

  test("ignores keydown outside the selector", () => {
    const { container, onMove } = setup(3);
    const stray = document.createElement("input");
    container.appendChild(stray);
    keydown(stray, "ArrowRight");
    expect(onMove).not.toHaveBeenCalled();
  });

  test("ArrowRight on the container moves to the next index", () => {
    const { container, onMove } = setup(3);
    keydown(container, "ArrowRight");
    expect(onMove).toHaveBeenCalledWith(1, expect.any(KeyboardEvent));
  });

  test("wrap: false clamps at the ends instead of wrapping", () => {
    const { items, onMove, setActive } = setup(3, { wrap: false });
    setActive(2);
    keydown(items[2], "ArrowRight");
    expect(onMove).toHaveBeenCalledWith(2, expect.any(KeyboardEvent));
  });

  test("focusOnMove focuses the resolved item", () => {
    const { items } = setup(3, { focusOnMove: true });
    keydown(items[0], "ArrowRight");
    expect(document.activeElement).toBe(items[1]);
  });

  test("getItems sets the item list and count", () => {
    const { items, onMove, setActive } = setup(4, {
      getItems: () => {
        const all = Array.from(
          document.querySelectorAll<HTMLElement>("[role='option']"),
        );
        return all.slice(0, 3);
      },
    });
    setActive(2);
    keydown(items[2], "ArrowRight");
    expect(onMove).toHaveBeenCalledWith(0, expect.any(KeyboardEvent));
  });

  test("destroy removes the keydown listener", () => {
    const { items, onMove, action } = setup(3);
    action.destroy();
    keydown(items[0], "ArrowRight");
    expect(onMove).not.toHaveBeenCalled();
  });
});
