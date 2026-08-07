import { trapFocus } from "../../src/utils/trapFocus.js";

/**
 * jsdom has no layout engine, so `offsetParent`/`offsetWidth`/`offsetHeight`
 * are `null`/`0`/`0` for every element by default. `trapFocus` treats a
 * `null` offsetParent + zero height, or zero width + zero height, as "not
 * tabbable" (a cheap stand-in for elements collapsed by `display: none`), so
 * fixtures that should count as visible must stub these to look like a
 * normal laid-out element.
 */
function stubVisibleGeometry(el: HTMLElement) {
  Object.defineProperty(el, "offsetParent", {
    value: document.body,
    configurable: true,
  });
  Object.defineProperty(el, "offsetWidth", {
    value: 42,
    configurable: true,
  });
  Object.defineProperty(el, "offsetHeight", {
    value: 20,
    configurable: true,
  });
}

/**
 * Build a container with `count` buttons, append it to the document, and
 * return the container plus its buttons. Each button is stubbed to look
 * like a normal, visible, laid-out element (see `stubVisibleGeometry`).
 */
function setup(count: number) {
  const container = document.createElement("div");
  const buttons = Array.from({ length: count }, (_, i) => {
    const button = document.createElement("button");
    button.textContent = `Button ${i}`;
    stubVisibleGeometry(button);
    container.appendChild(button);
    return button;
  });
  document.body.appendChild(container);
  return { container, buttons };
}

function tabEvent(shiftKey = false) {
  const event = new KeyboardEvent("keydown", { key: "Tab", shiftKey });
  const preventDefault = vi.spyOn(event, "preventDefault");
  return { event, preventDefault };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("trapFocus", () => {
  test("forward Tab from the last element wraps to the first", () => {
    const { container, buttons } = setup(3);
    buttons[2].focus();
    const { event, preventDefault } = tabEvent();

    trapFocus({ container, event });

    expect(document.activeElement).toBe(buttons[0]);
    expect(preventDefault).toHaveBeenCalledOnce();
  });

  test("Shift+Tab from the first element wraps to the last", () => {
    const { container, buttons } = setup(3);
    buttons[0].focus();
    const { event, preventDefault } = tabEvent(true);

    trapFocus({ container, event });

    expect(document.activeElement).toBe(buttons[2]);
    expect(preventDefault).toHaveBeenCalledOnce();
  });

  test("Tab advances to the next element mid-list", () => {
    const { container, buttons } = setup(3);
    buttons[0].focus();
    const { event } = tabEvent();

    trapFocus({ container, event });

    expect(document.activeElement).toBe(buttons[1]);
  });

  test("Shift+Tab moves to the previous element mid-list", () => {
    const { container, buttons } = setup(3);
    buttons[2].focus();
    const { event } = tabEvent(true);

    trapFocus({ container, event });

    expect(document.activeElement).toBe(buttons[1]);
  });

  test("empty container calls preventDefault and focuses nothing", () => {
    const { container } = setup(0);
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    outside.focus();
    const { event, preventDefault } = tabEvent();

    trapFocus({ container, event });

    expect(document.activeElement).toBe(outside);
    expect(preventDefault).toHaveBeenCalledOnce();
  });

  test("active element outside the list: Tab focuses the first element", () => {
    const { container, buttons } = setup(3);
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    outside.focus();
    const { event } = tabEvent();

    trapFocus({ container, event });

    expect(document.activeElement).toBe(buttons[0]);
  });

  test("active element outside the list: Shift+Tab focuses the last element", () => {
    const { container, buttons } = setup(3);
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    outside.focus();
    const { event } = tabEvent(true);

    trapFocus({ container, event });

    expect(document.activeElement).toBe(buttons[2]);
  });

  test("hidden elements are excluded from the focus loop", () => {
    const { container, buttons } = setup(3);
    buttons[1].style.display = "none";
    buttons[0].focus();
    const { event } = tabEvent();

    // buttons[1] is skipped, so Tab goes straight to buttons[2].
    trapFocus({ container, event });

    expect(document.activeElement).toBe(buttons[2]);
  });

  test("visibility:hidden and display:none elements are both excluded, only the visible one is focused", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const visible = document.createElement("button");
    visible.textContent = "Visible";
    stubVisibleGeometry(visible);
    container.appendChild(visible);

    // display:none collapses the element's layout box, so it's excluded by
    // the cheap geometry checks before getComputedStyle is ever called
    // (jsdom's default offsetParent: null / offsetHeight: 0 is left as-is).
    const displayNone = document.createElement("button");
    displayNone.textContent = "Display none";
    displayNone.style.display = "none";
    container.appendChild(displayNone);

    // visibility:hidden elements keep their layout box in real browsers, so
    // this fixture is stubbed to look laid-out; it must be caught by the
    // getComputedStyle check instead of the geometry checks.
    const visibilityHidden = document.createElement("button");
    visibilityHidden.textContent = "Visibility hidden";
    visibilityHidden.style.visibility = "hidden";
    stubVisibleGeometry(visibilityHidden);
    container.appendChild(visibilityHidden);

    visible.focus();
    const { event } = tabEvent();

    trapFocus({ container, event });

    // Only one tabbable candidate (`visible`), so Tab wraps back to itself.
    expect(document.activeElement).toBe(visible);
  });
});
