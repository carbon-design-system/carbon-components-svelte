import { positionFlatpickrCalendarFixed } from "../../src/DatePicker/datePickerTopLayer.js";

/**
 * Reproduces the scrollbar-gutter regression: `window.innerWidth` includes the
 * reserved scrollbar gutter, while `getBoundingClientRect()` (used for the
 * input bounds) is relative to the layout viewport, which excludes it. Mixing
 * the two mis-fires the right-align decision and overhangs the calendar past
 * the real right edge by the gutter width.
 */
describe("positionFlatpickrCalendarFixed", () => {
  const stubClientWidth = (value: number) => {
    Object.defineProperty(document.documentElement, "clientWidth", {
      configurable: true,
      value,
    });
  };

  afterEach(() => {
    Object.defineProperty(document.documentElement, "clientWidth", {
      configurable: true,
      value: undefined,
    });
  });

  it("right-aligns to the input using the layout viewport width, not window.innerWidth", () => {
    // Right-docked dialog, `scrollbar-gutter: stable` on :root, viewport 1429px.
    window.innerWidth = 1429;
    stubClientWidth(1414); // 15px gutter reserved

    const positionElement = {
      getBoundingClientRect: () => ({
        top: 100,
        bottom: 132,
        left: 1141,
        right: 1348,
      }),
      offsetHeight: 32,
    } as unknown as HTMLElement;

    const calendarContainer = document.createElement("div");
    Object.defineProperty(calendarContainer, "offsetWidth", {
      configurable: true,
      value: 288,
    });
    calendarContainer.appendChild(document.createElement("div"));

    const instance = {
      calendarContainer,
      _positionElement: positionElement,
      _input: positionElement,
    } as unknown as import("flatpickr/dist/types/instance").Instance;

    positionFlatpickrCalendarFixed(instance, positionElement);

    expect(calendarContainer.classList.contains("rightMost")).toBe(true);
    expect(calendarContainer.style.left).toBe("auto");
    // viewportWidth (1414) - inputBounds.right (1348) = 66, not
    // innerWidth (1429) - 1348 = 81, which would overhang the dialog.
    expect(calendarContainer.style.right).toBe("66px");
  });

  it("falls back to left-align when there's no scrollbar gutter to mask", () => {
    window.innerWidth = 1414;
    stubClientWidth(1414);

    const positionElement = {
      getBoundingClientRect: () => ({
        top: 100,
        bottom: 132,
        left: 100,
        right: 200,
      }),
      offsetHeight: 32,
    } as unknown as HTMLElement;

    const calendarContainer = document.createElement("div");
    Object.defineProperty(calendarContainer, "offsetWidth", {
      configurable: true,
      value: 288,
    });
    calendarContainer.appendChild(document.createElement("div"));

    const instance = {
      calendarContainer,
      _positionElement: positionElement,
      _input: positionElement,
    } as unknown as import("flatpickr/dist/types/instance").Instance;

    positionFlatpickrCalendarFixed(instance, positionElement);

    expect(calendarContainer.classList.contains("rightMost")).toBe(false);
    expect(calendarContainer.style.left).toBe("100px");
    expect(calendarContainer.style.right).toBe("auto");
  });
});
