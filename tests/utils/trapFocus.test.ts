import { trapFocus } from "../../src/utils/trapFocus.js";

/**
 * Build a container with `count` buttons, append it to the document, and
 * return the container plus its buttons. jsdom has no layout, so
 * `offsetParent` is null and the zero-dimension filter branch is skipped —
 * the buttons count as visible.
 */
function setup(count: number) {
  const container = document.createElement("div");
  const buttons = Array.from({ length: count }, (_, i) => {
    const button = document.createElement("button");
    button.textContent = `Button ${i}`;
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
});
