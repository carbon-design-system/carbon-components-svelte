import { fireEvent, render, screen } from "@testing-library/svelte";
import { DEBOUNCE_DELAY } from "carbon-components-svelte/Resizer/Resizer.svelte";
import Resizer from "./Resizer.test.svelte";

/**
 * jsdom has no real layout, so getBoundingClientRect() always reports 0.
 * Stub it on the prototype (before mount, since Resizer reads sizes at
 * mount time too) to report each stubbed element's *current* inline
 * width/height, falling back to 100x100 — this mirrors a real browser,
 * where a re-measurement after a style change reports the new size.
 */
function stubLayout() {
  const original = Element.prototype.getBoundingClientRect;
  const stubbed = new Set<string>(["prev", "next"]);

  Element.prototype.getBoundingClientRect = function (this: HTMLElement) {
    const testId = this.getAttribute("data-testid");
    if (testId && stubbed.has(testId)) {
      const width = this.style.width
        ? Number.parseFloat(this.style.width)
        : 100;
      const height = this.style.height
        ? Number.parseFloat(this.style.height)
        : 100;
      return {
        width,
        height,
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: width,
        bottom: height,
        toJSON() {
          return this;
        },
      } as DOMRect;
    }
    return original.call(this);
  };

  return () => {
    Element.prototype.getBoundingClientRect = original;
  };
}

function setup(props: Record<string, unknown> = {}) {
  const restore = stubLayout();
  const utils = render(Resizer, props);
  return {
    ...utils,
    prev: screen.getByTestId("prev"),
    next: screen.getByTestId("next"),
    resizer: screen.getByTestId("resizer"),
    restore,
  };
}

describe("Resizer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders as a separator with the expected aria attributes", () => {
    render(Resizer, { orientation: "horizontal" });
    const el = screen.getByRole("separator");
    expect(el).toHaveAttribute("aria-orientation", "horizontal");
    expect(el).toHaveAttribute("aria-live", "assertive");
    expect(el).toHaveAttribute("tabindex", "0");
  });

  it("applies a custom class and forwards a ref", () => {
    const { component } = render(Resizer, {
      class: "custom-class",
    } as never);
    expect(screen.getByRole("separator")).toHaveClass("custom-class");
    expect(component.ref).toBeInstanceOf(HTMLElement);
  });

  it("resizes both siblings on mouse drag and dispatches resize/resizeend", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const { prev, next, resizer, restore } = setup();

    await fireEvent.mouseDown(resizer, { clientX: 50, button: 0 });
    await fireEvent.mouseMove(window, { clientX: 70 });
    await fireEvent.mouseUp(window, { clientX: 70 });

    expect(consoleLog).toHaveBeenCalledWith("resizestart");
    expect(consoleLog).toHaveBeenCalledWith("resize", 20);
    expect(consoleLog).toHaveBeenCalledWith("resizeend");
    expect(prev).toHaveStyle("width: 120px");
    expect(next).toHaveStyle("width: 80px");
    restore();
  });

  it("keeps delta cumulative from resizestart across multiple mousemove events in one drag", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const { prev, next, resizer, restore } = setup();

    await fireEvent.mouseDown(resizer, { clientX: 50, button: 0 });
    await fireEvent.mouseMove(window, { clientX: 55 });
    await fireEvent.mouseMove(window, { clientX: 60 });
    await fireEvent.mouseMove(window, { clientX: 65 });
    await fireEvent.mouseUp(window, { clientX: 65 });

    // Each move reports total displacement from resizestart (5, 10, 15),
    // not the 5px incremental step since the previous move.
    expect(consoleLog).toHaveBeenCalledWith("resize", 5);
    expect(consoleLog).toHaveBeenCalledWith("resize", 10);
    expect(consoleLog).toHaveBeenCalledWith("resize", 15);
    expect(prev).toHaveStyle("width: 115px");
    expect(next).toHaveStyle("width: 85px");
    restore();
  });

  it("resizes by 5px on ArrowRight and back on ArrowLeft for vertical orientation", async () => {
    const { prev, next, resizer, restore } = setup();

    await fireEvent.keyDown(resizer, { key: "ArrowRight" });
    expect(prev).toHaveStyle("width: 105px");
    expect(next).toHaveStyle("width: 95px");

    await fireEvent.keyDown(resizer, { key: "ArrowLeft" });
    expect(prev).toHaveStyle("width: 100px");
    expect(next).toHaveStyle("width: 100px");
    restore();
  });

  it("resizes by 25px with Shift", async () => {
    const { prev, next, resizer, restore } = setup();

    await fireEvent.keyDown(resizer, { key: "ArrowRight", shiftKey: true });
    expect(prev).toHaveStyle("width: 125px");
    expect(next).toHaveStyle("width: 75px");
    restore();
  });

  it("ignores unrelated keys", async () => {
    const { prev, next, resizer, restore } = setup();
    await fireEvent.keyDown(resizer, { key: "a" });
    expect(prev.style.width).toBe("");
    expect(next.style.width).toBe("");
    restore();
  });

  it("fully collapses the previous sibling on Home and the next on End", async () => {
    const { prev, next, resizer, restore } = setup();

    await fireEvent.keyDown(resizer, { key: "Home" });
    expect(prev).toHaveStyle("width: 0px");
    expect(next).toHaveStyle("width: 200px");

    await fireEvent.keyDown(resizer, { key: "End" });
    expect(prev).toHaveStyle("width: 200px");
    expect(next).toHaveStyle("width: 0px");
    restore();
  });

  it("debounces resizeend for keyboard interactions", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const { resizer, restore } = setup();

    await fireEvent.keyDown(resizer, { key: "ArrowRight" });
    expect(consoleLog).not.toHaveBeenCalledWith("resizeend");

    await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_DELAY + 50));
    expect(consoleLog).toHaveBeenCalledWith("resizeend");
    restore();
  });

  it("resets both siblings to their initial size on double-click", async () => {
    const { prev, next, resizer, restore } = setup();

    await fireEvent.keyDown(resizer, { key: "ArrowRight", shiftKey: true });
    expect(prev).toHaveStyle("width: 125px");

    await fireEvent.dblClick(resizer);
    expect(prev).toHaveStyle("width: 100px");
    expect(next).toHaveStyle("width: 100px");
    restore();
  });

  it("skips the default reset when on:dblclick calls preventDefault", async () => {
    const { prev, resizer, restore } = setup({ preventReset: true });

    await fireEvent.keyDown(resizer, { key: "ArrowRight", shiftKey: true });
    await fireEvent.dblClick(resizer);

    expect(prev).toHaveStyle("width: 125px");
    restore();
  });

  it("does not touch sibling DOM when on:resize calls preventDefault (controlled mode)", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const { prev, next, resizer, restore } = setup({ controlled: true });

    await fireEvent.keyDown(resizer, { key: "ArrowRight" });

    expect(consoleLog).toHaveBeenCalledWith("resize", 5);
    expect(prev.style.width).toBe("");
    expect(next.style.width).toBe("");
    restore();
  });

  it("fires resizestart on every keydown, since each keyboard step is its own interaction", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const { resizer, restore } = setup();

    await fireEvent.keyDown(resizer, { key: "ArrowRight" });
    await fireEvent.keyDown(resizer, { key: "ArrowRight" });

    expect(
      consoleLog.mock.calls.filter(([message]) => message === "resizestart"),
    ).toHaveLength(2);
    restore();
  });

  it("lets a controlled consumer avoid compounding by tracking its own baseline from resizestart", async () => {
    const { component, resizer, restore } = setup({
      controlled: true,
      controlledWidth: 200,
    });

    await fireEvent.mouseDown(resizer, { clientX: 50, button: 0 });
    await fireEvent.mouseMove(window, { clientX: 55 });
    await fireEvent.mouseMove(window, { clientX: 60 });
    await fireEvent.mouseMove(window, { clientX: 65 });
    await fireEvent.mouseUp(window, { clientX: 65 });

    // 15px of total mouse movement should produce 15px of total width
    // change, not a compounded (5 + 10 + 15 = 30px) change.
    expect(component.controlledWidth).toBe(215);
    restore();
  });
});
