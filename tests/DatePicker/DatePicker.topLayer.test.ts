import { fireEvent, render, screen } from "@testing-library/svelte";
import { positionFlatpickrCalendarFixed } from "../../src/DatePicker/date-picker-top-layer.js";
import { user } from "../utils/user";
import DatePickerHost from "./DatePickerHost.test.svelte";
import { clickNextMonth, openCalendar } from "./helpers";

describe("DatePicker inside a top-layer dialog", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registers a passive capture scroll listener and repositions once per frame", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) =>
      frames.push(callback),
    );

    render(DatePickerHost);
    await openCalendar();

    const scrollCall = add.mock.calls.find(([type]) => type === "scroll");
    expect(scrollCall?.[2]).toEqual({ capture: true, passive: true });
    // Pooled listeners are shared per `(type, options)`, so scroll and
    // resize no longer share one function reference.
    const resizeCall = add.mock.calls.find(
      ([type, , options]) =>
        type === "resize" &&
        typeof options === "object" &&
        options?.passive === true &&
        !("capture" in options),
    );
    expect(resizeCall?.[2]).toEqual({ passive: true });

    // Several scroll events in one frame schedule a single reposition.
    frames.length = 0;
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("scroll"));
    expect(frames).toHaveLength(1);
  });
});

describe("DatePicker in a dialog", () => {
  it("appends the calendar into the dialog", async () => {
    render(DatePickerHost);

    const calendar = await openCalendar();

    expect(calendar.parentElement).toBe(document.querySelector("dialog"));
  });

  it("stays open when the dialog is clicked elsewhere", async () => {
    render(DatePickerHost, { props: { dialogSibling: true } });

    const calendar = await openCalendar();
    // `click` only: flatpickr closes on `mousedown` by itself, and the
    // picker's own click handler is what spares the rest of the dialog.
    await fireEvent.click(screen.getByText("Dialog text"));

    expect(calendar).toHaveClass("bx--date-picker__calendar--open");
  });
});

describe("DatePicker inside Popover", () => {
  it("does not close the popover when a portaled calendar's month-nav arrow is clicked", async () => {
    const onClose = vi.fn();
    render(DatePickerHost, { props: { container: "popover", onClose } });

    const calendar = await openCalendar();
    const popover = document.querySelector(".bx--popover");
    expect(popover?.contains(calendar)).toBe(false);

    await clickNextMonth(calendar);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("still closes the popover for a genuine outside click", async () => {
    const onClose = vi.fn();
    render(DatePickerHost, { props: { container: "popover", onClose } });

    await openCalendar();

    await user.click(document.body);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

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
    } as unknown as import("../../src/DatePicker/calendar").CalendarInstance;

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
    } as unknown as import("../../src/DatePicker/calendar").CalendarInstance;

    positionFlatpickrCalendarFixed(instance, positionElement);

    expect(calendarContainer.classList.contains("rightMost")).toBe(false);
    expect(calendarContainer.style.left).toBe("100px");
    expect(calendarContainer.style.right).toBe("auto");
  });

  it("flips above the input when there is no room below", () => {
    window.innerHeight = 500;
    stubClientWidth(1414);

    const positionElement = {
      getBoundingClientRect: () => ({
        top: 450,
        bottom: 482,
        left: 100,
        right: 200,
      }),
      offsetHeight: 32,
    } as unknown as HTMLElement;

    const calendarContainer = document.createElement("div");
    const content = document.createElement("div");
    Object.defineProperty(content, "offsetHeight", {
      configurable: true,
      value: 300,
    });
    calendarContainer.appendChild(content);

    const instance = {
      calendarContainer,
      _positionElement: positionElement,
      _input: positionElement,
    } as unknown as import("../../src/DatePicker/calendar").CalendarInstance;

    positionFlatpickrCalendarFixed(instance, positionElement);

    expect(calendarContainer.classList.contains("arrowBottom")).toBe(true);
    // input top (450) - calendar height (300) - 2px gap
    expect(calendarContainer.style.top).toBe("148px");
  });
});
