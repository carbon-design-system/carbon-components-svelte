import {
  edgeScrollStep,
  keyboardIndex,
  makeRoom,
  slotAt,
  slotToIndex,
  tabReorder,
  TOUCH_HOLD_MS,
} from "../../src/utils/tab-reorder.js";

describe("slotAt", () => {
  const centers = [50, 150, 250, 350];

  it("counts the tabs before the pointer", () => {
    expect(slotAt(centers, 10)).toBe(0);
    expect(slotAt(centers, 100)).toBe(1);
    expect(slotAt(centers, 300)).toBe(3);
    expect(slotAt(centers, 999)).toBe(4);
  });

  it("counts from the other side when the tabs run right to left", () => {
    const rtl = [350, 250, 150, 50];
    expect(slotAt(rtl, 999, true)).toBe(0);
    expect(slotAt(rtl, 300, true)).toBe(1);
    expect(slotAt(rtl, 10, true)).toBe(4);
  });
});

describe("slotToIndex", () => {
  it("counts a slot after the tab one less, since the tab leaves first", () => {
    expect(slotToIndex(3, 0)).toBe(2);
    expect(slotToIndex(1, 3)).toBe(1);
    expect(slotToIndex(0, 0)).toBe(0);
    expect(slotToIndex(1, 0)).toBe(0);
  });
});

describe("makeRoom", () => {
  it("steps the tabs a tab passes toward where it came from", () => {
    expect(makeRoom(0, 2)).toEqual({ from: 1, to: 2, step: -1 });
    expect(makeRoom(3, 1)).toEqual({ from: 1, to: 2, step: 1 });
  });

  it("moves nothing for a tab that stays", () => {
    expect(makeRoom(2, 2)).toBeNull();
  });
});

describe("keyboardIndex", () => {
  it("moves one place along the inline axis and stops at the ends", () => {
    expect(keyboardIndex("ArrowRight", 1, 4)).toBe(2);
    expect(keyboardIndex("ArrowLeft", 1, 4)).toBe(0);
    expect(keyboardIndex("ArrowLeft", 0, 4)).toBe(0);
    expect(keyboardIndex("ArrowRight", 3, 4)).toBe(3);
  });

  it("swaps the arrows in RTL", () => {
    expect(keyboardIndex("ArrowLeft", 1, 4, true)).toBe(2);
    expect(keyboardIndex("ArrowRight", 1, 4, true)).toBe(0);
  });

  it("sends Home and End to the ends and ignores other keys", () => {
    expect(keyboardIndex("Home", 2, 4)).toBe(0);
    expect(keyboardIndex("End", 1, 4)).toBe(3);
    expect(keyboardIndex("ArrowDown", 1, 4)).toBe(-1);
    expect(keyboardIndex("a", 1, 4)).toBe(-1);
  });
});

describe("edgeScrollStep", () => {
  it("is zero away from the edges and ramps up toward them", () => {
    expect(edgeScrollStep(200, 0, 400)).toBe(0);
    const near = edgeScrollStep(380, 0, 400);
    const at = edgeScrollStep(400, 0, 400);
    expect(near).toBeGreaterThan(0);
    expect(at).toBeGreaterThan(near);
    expect(edgeScrollStep(10, 0, 400)).toBeLessThan(0);
  });
});

describe("tabReorder", () => {
  let list: HTMLUListElement;
  let links: HTMLAnchorElement[];
  let items: HTMLLIElement[];

  function pointer(
    type: string,
    init: PointerEventInit & { pointerType?: string } = {},
  ) {
    return new PointerEvent(type, {
      pointerId: 1,
      isPrimary: true,
      button: 0,
      bubbles: true,
      cancelable: true,
      ...init,
    });
  }

  beforeEach(() => {
    list = document.createElement("ul");
    items = [];
    links = [];
    for (let i = 0; i < 4; i++) {
      const item = document.createElement("li");
      item.className = "bx--tabs__nav-item";
      const link = document.createElement("a");
      link.className = "bx--tabs__nav-link";
      link.id = `tab-${i}`;
      link.tabIndex = 0;
      link.setAttribute("role", "tab");
      item.appendChild(link);
      list.appendChild(item);
      items.push(item);
      links.push(link);
      // 100px tabs side by side from x = 0.
      item.getBoundingClientRect = () =>
        ({ left: i * 100, width: 100, right: i * 100 + 100 }) as DOMRect;
    }
    list.getBoundingClientRect = () =>
      ({ left: 0, right: 400, width: 400 }) as DOMRect;
    document.body.appendChild(list);
  });

  afterEach(() => {
    list.remove();
  });

  it("reports a drag past the threshold when it is dropped in a new gap", () => {
    const onReorder = vi.fn();
    const onStart = vi.fn();
    const capture = vi.fn();
    list.setPointerCapture = capture;
    const action = tabReorder(list, { onReorder, onStart });

    links[0].dispatchEvent(
      pointer("pointerdown", { clientX: 50, clientY: 20 }),
    );
    document.dispatchEvent(
      pointer("pointermove", { clientX: 52, clientY: 20 }),
    );
    expect(onStart).not.toHaveBeenCalled();

    document.dispatchEvent(
      pointer("pointermove", { clientX: 260, clientY: 20 }),
    );
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith(1);
    expect(items[0]).toHaveClass("bx--tabs__nav-item--dragging");
    expect(items[0].style.transform).toBe("translateX(210px)");
    // The tabs it passed step aside by its width, toward the start.
    expect(items[1].style.transform).toBe("translateX(-100px)");
    expect(items[2].style.transform).toBe("translateX(-100px)");
    expect(items[3].style.transform).toBe("");

    document.dispatchEvent(pointer("pointerup", { clientX: 260, clientY: 20 }));
    expect(onReorder).toHaveBeenCalledWith({
      id: "tab-0",
      oldIndex: 0,
      newIndex: 2,
      source: "pointer",
    });
    expect(items[0]).not.toHaveClass("bx--tabs__nav-item--dragging");
    expect(items[0].style.transform).toBe("");
    expect(items[1].style.transform).toBe("");
    expect(items[2].style.transform).toBe("");
    action.destroy();
  });

  it("does not capture the pointer for a press that never drags", () => {
    const capture = vi.fn();
    list.setPointerCapture = capture;
    const onReorder = vi.fn();
    const action = tabReorder(list, { onReorder });

    links[1].dispatchEvent(
      pointer("pointerdown", { clientX: 150, clientY: 20 }),
    );
    document.dispatchEvent(pointer("pointerup", { clientX: 150, clientY: 20 }));

    expect(capture).not.toHaveBeenCalled();
    expect(onReorder).not.toHaveBeenCalled();
    action.destroy();
  });

  it("leaves a press on the dismiss button alone", () => {
    const close = document.createElement("div");
    close.className = "bx--tabs__nav-item--close";
    items[1].appendChild(close);
    const onStart = vi.fn();
    const action = tabReorder(list, { onStart });

    close.dispatchEvent(pointer("pointerdown", { clientX: 190, clientY: 20 }));
    document.dispatchEvent(
      pointer("pointermove", { clientX: 300, clientY: 20 }),
    );

    expect(onStart).not.toHaveBeenCalled();
    action.destroy();
  });

  it("swallows the click that follows a drag, and only that one", async () => {
    const action = tabReorder(list, { onReorder: vi.fn() });
    const onClick = vi.fn();
    list.addEventListener("click", onClick);

    links[0].dispatchEvent(
      pointer("pointerdown", { clientX: 50, clientY: 20 }),
    );
    document.dispatchEvent(
      pointer("pointermove", { clientX: 300, clientY: 20 }),
    );
    document.dispatchEvent(pointer("pointerup", { clientX: 300, clientY: 20 }));
    links[0].click();
    expect(onClick).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve));
    links[0].click();
    expect(onClick).toHaveBeenCalledTimes(1);
    action.destroy();
  });

  it("cancels with Escape and reports nothing", () => {
    const onReorder = vi.fn();
    const onEnd = vi.fn();
    const action = tabReorder(list, { onReorder, onEnd });

    links[0].dispatchEvent(
      pointer("pointerdown", { clientX: 50, clientY: 20 }),
    );
    document.dispatchEvent(
      pointer("pointermove", { clientX: 300, clientY: 20 }),
    );
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    document.dispatchEvent(pointer("pointerup", { clientX: 300, clientY: 20 }));

    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onReorder).not.toHaveBeenCalled();
    expect(items[0]).not.toHaveClass("bx--tabs__nav-item--dragging");
    action.destroy();
  });

  it("reads the gap from the right in RTL", () => {
    const onReorder = vi.fn();
    const action = tabReorder(list, { onReorder, rtl: () => true });

    // The first tab is the rightmost one in RTL.
    for (let i = 0; i < 4; i++) {
      const left = (3 - i) * 100;
      items[i].getBoundingClientRect = () =>
        ({ left, width: 100, right: left + 100 }) as DOMRect;
    }
    links[0].dispatchEvent(
      pointer("pointerdown", { clientX: 350, clientY: 20 }),
    );
    document.dispatchEvent(
      pointer("pointermove", { clientX: 140, clientY: 20 }),
    );
    document.dispatchEvent(pointer("pointerup", { clientX: 140, clientY: 20 }));

    expect(onReorder).toHaveBeenCalledWith(
      expect.objectContaining({ oldIndex: 0, newIndex: 2 }),
    );
    action.destroy();
  });

  it("ignores a disabled tab and a secondary button", () => {
    items[0].classList.add("bx--tabs__nav-item--disabled");
    const onStart = vi.fn();
    const action = tabReorder(list, { onStart });

    links[0].dispatchEvent(
      pointer("pointerdown", { clientX: 50, clientY: 20 }),
    );
    document.dispatchEvent(
      pointer("pointermove", { clientX: 300, clientY: 20 }),
    );
    document.dispatchEvent(pointer("pointerup", { clientX: 300, clientY: 20 }));
    links[1].dispatchEvent(
      pointer("pointerdown", { clientX: 150, clientY: 20, button: 2 }),
    );
    document.dispatchEvent(
      pointer("pointermove", { clientX: 300, clientY: 20 }),
    );

    expect(onStart).not.toHaveBeenCalled();
    action.destroy();
  });

  it("starts a touch drag only after the hold", () => {
    vi.useFakeTimers();
    const onStart = vi.fn();
    const action = tabReorder(list, { onStart });

    // A swipe: it moves before the hold has passed, so the list scrolls.
    links[0].dispatchEvent(
      pointer("pointerdown", {
        clientX: 50,
        clientY: 20,
        pointerType: "touch",
      }),
    );
    document.dispatchEvent(
      pointer("pointermove", { clientX: 120, clientY: 20 }),
    );
    document.dispatchEvent(pointer("pointerup", { clientX: 120, clientY: 20 }));
    expect(onStart).not.toHaveBeenCalled();

    // A press that rests, then moves.
    links[0].dispatchEvent(
      pointer("pointerdown", {
        clientX: 50,
        clientY: 20,
        pointerType: "touch",
      }),
    );
    vi.advanceTimersByTime(TOUCH_HOLD_MS + 1);
    document.dispatchEvent(
      pointer("pointermove", { clientX: 120, clientY: 20 }),
    );
    expect(onStart).toHaveBeenCalledTimes(1);
    document.dispatchEvent(pointer("pointerup", { clientX: 120, clientY: 20 }));

    vi.useRealTimers();
    action.destroy();
  });

  it("moves with Ctrl or Cmd and Shift and an arrow, and not without them", () => {
    const onReorder = vi.fn();
    const action = tabReorder(list, { onReorder });

    function press(init: KeyboardEventInit) {
      const event = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        ...init,
      });
      links[1].dispatchEvent(event);
      return event;
    }

    expect(press({ key: "ArrowRight" }).defaultPrevented).toBe(false);
    expect(press({ key: "ArrowRight", shiftKey: true }).defaultPrevented).toBe(
      false,
    );
    expect(press({ key: "ArrowRight", ctrlKey: true }).defaultPrevented).toBe(
      false,
    );
    expect(onReorder).not.toHaveBeenCalled();

    const event = press({ key: "ArrowRight", ctrlKey: true, shiftKey: true });
    expect(event.defaultPrevented).toBe(true);
    expect(onReorder).toHaveBeenCalledWith({
      id: "tab-1",
      oldIndex: 1,
      newIndex: 2,
      source: "keyboard",
    });

    press({ key: "Home", metaKey: true, shiftKey: true });
    expect(onReorder).toHaveBeenLastCalledWith(
      expect.objectContaining({ oldIndex: 1, newIndex: 0 }),
    );
    action.destroy();
  });

  it("does nothing once disabled", () => {
    const onReorder = vi.fn();
    const action = tabReorder(list, { onReorder, enabled: false });

    links[1].dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "ArrowRight",
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      }),
    );
    links[0].dispatchEvent(
      pointer("pointerdown", { clientX: 50, clientY: 20 }),
    );
    document.dispatchEvent(
      pointer("pointermove", { clientX: 300, clientY: 20 }),
    );

    expect(onReorder).not.toHaveBeenCalled();
    expect(items[0]).not.toHaveClass("bx--tabs__nav-item--dragging");
    action.destroy();
  });
});
