import { fireEvent, render, screen } from "@testing-library/svelte";
import SplitterComponent from "carbon-components-svelte/Splitter/Splitter.svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import Splitter from "./Splitter.test.svelte";
import SplitterNested from "./SplitterNested.test.svelte";

function mockRect(element: HTMLElement) {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    left: 0,
    right: 400,
    width: 400,
    top: 0,
    bottom: 200,
    height: 200,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
}

function setup(props: Record<string, unknown> = {}) {
  const consoleLog = vi.spyOn(console, "log");
  render(Splitter, { props });
  const root = screen.getByTestId("splitter");
  mockRect(root);
  const separator = screen.getByRole("separator");
  const startPane = screen.getByText("Start pane").parentElement;
  assert(startPane);
  return { consoleLog, root, separator, startPane };
}

describe("Splitter", () => {
  it("renders both panes and a focusable separator controlling the start pane", () => {
    const { separator, startPane } = setup();

    expect(screen.getByText("End pane")).toBeInTheDocument();
    expect(separator).toHaveAttribute("tabindex", "0");
    expect(separator).toHaveAttribute("aria-label", "Resize panes");
    expect(separator).toHaveAttribute("aria-orientation", "vertical");
    expect(separator).toHaveAttribute("aria-valuenow", "50");
    expect(separator).toHaveAttribute("aria-valuemin", "0");
    expect(separator).toHaveAttribute("aria-valuemax", "100");
    expect(separator).toHaveAttribute("aria-controls", startPane.id);
    expect(startPane.style.flexBasis).toBe("50%");
  });

  it("derives the start pane id from an explicit id", () => {
    const { container } = render(SplitterComponent, { props: { id: "files" } });

    expect(container.querySelector(".bx--splitter")).toHaveAttribute(
      "id",
      "files",
    );
    expect(screen.getByRole("separator")).toHaveAttribute(
      "aria-controls",
      "files-start",
    );
    expect(container.querySelector("#files-start")).toHaveClass(
      "bx--splitter__pane--start",
    );
  });

  it("renders size clamped to min and max without rewriting it", () => {
    const { separator, startPane } = setup({ size: 95, max: 80 });

    expect(separator).toHaveAttribute("aria-valuenow", "80");
    expect(startPane.style.flexBasis).toBe("80%");
    expect(screen.getByTestId("bound-size")).toHaveTextContent("95");
  });

  it.each([
    { keys: "{ArrowRight}", expected: "51" },
    { keys: "{ArrowLeft}", expected: "49" },
    { keys: "{Shift>}{ArrowRight}{/Shift}", expected: "60" },
    { keys: "{Home}", expected: "20" },
    { keys: "{End}", expected: "90" },
    { keys: "{ArrowUp}", expected: "50" },
  ])("moves with $keys to $expected", async ({ keys, expected }) => {
    const { separator } = setup({ min: 20, max: 90 });

    separator.focus();
    await user.keyboard(keys);

    expect(separator).toHaveAttribute("aria-valuenow", expected);
    expect(screen.getByTestId("bound-size")).toHaveTextContent(expected);
  });

  it.each(["altKey", "ctrlKey", "metaKey"])(
    "leaves %s+Arrow to the browser",
    async (modifier) => {
      const { separator } = setup();

      const notPrevented = await fireEvent.keyDown(separator, {
        key: "ArrowLeft",
        [modifier]: true,
      });

      expect(notPrevented).toBe(true);
      expect(separator).toHaveAttribute("aria-valuenow", "50");
    },
  );

  it("uses ArrowUp and ArrowDown when vertical", async () => {
    const { separator, root } = setup({ orientation: "vertical" });

    expect(root).toHaveClass("bx--splitter--vertical");
    expect(separator).toHaveAttribute("aria-orientation", "horizontal");

    separator.focus();
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowUp}{ArrowLeft}");

    expect(separator).toHaveAttribute("aria-valuenow", "51");
  });

  it("collapses to min on Enter and restores the previous size", async () => {
    const { consoleLog, separator } = setup({ size: 40, min: 10 });

    separator.focus();
    await user.keyboard("{Enter}");
    expect(separator).toHaveAttribute("aria-valuenow", "10");

    await user.keyboard("{Enter}");
    expect(separator).toHaveAttribute("aria-valuenow", "40");
    expect(consoleLog.mock.calls).toEqual([
      ["resize", { size: 10 }],
      ["resize", { size: 40 }],
    ]);
  });

  describe("collapsed", () => {
    const toggle = () =>
      user.click(screen.getByRole("button", { name: "Toggle collapsed" }));
    const boundCollapsed = () => screen.getByTestId("bound-collapsed");

    it("collapses on mount and restores the given size", async () => {
      const { separator } = setup({ size: 40, min: 10, collapsed: true });

      expect(separator).toHaveAttribute("aria-valuenow", "10");
      expect(screen.getByTestId("bound-size")).toHaveTextContent("10");

      await toggle();

      expect(separator).toHaveAttribute("aria-valuenow", "40");
      expect(boundCollapsed()).toHaveTextContent("false");
    });

    it("collapses and restores when set, without firing resize", async () => {
      const { consoleLog, separator } = setup({ size: 40, min: 10 });

      await toggle();
      expect(separator).toHaveAttribute("aria-valuenow", "10");
      await toggle();
      expect(separator).toHaveAttribute("aria-valuenow", "40");

      expect(consoleLog).not.toHaveBeenCalled();
    });

    it("reflects Enter and Home, and restores to where the gesture began", async () => {
      const { separator } = setup({ size: 40, min: 10 });

      separator.focus();
      await user.keyboard("{Enter}");
      expect(boundCollapsed()).toHaveTextContent("true");
      await user.keyboard("{Enter}");
      expect(boundCollapsed()).toHaveTextContent("false");

      await user.keyboard("{ArrowRight}{Home}");
      expect(boundCollapsed()).toHaveTextContent("true");
      await toggle();
      expect(separator).toHaveAttribute("aria-valuenow", "41");
    });

    it("reflects a drag to min and restores the drag's start size", async () => {
      const { separator } = setup({ size: 40, min: 10 });

      await fireEvent.pointerDown(separator, { clientX: 160, pointerId: 1 });
      await fireEvent.pointerMove(separator, { clientX: 0, pointerId: 1 });
      await fireEvent.pointerUp(separator, { pointerId: 1 });
      expect(boundCollapsed()).toHaveTextContent("true");

      separator.focus();
      await user.keyboard("{Enter}");
      expect(separator).toHaveAttribute("aria-valuenow", "40");
      expect(boundCollapsed()).toHaveTextContent("false");
    });

    it("restores to the middle of the range when it started at min", async () => {
      const { separator } = setup({ size: 20, min: 20, max: 80 });

      expect(boundCollapsed()).toHaveTextContent("true");
      await toggle();

      expect(separator).toHaveAttribute("aria-valuenow", "50");
    });
  });

  describe("pixel bounds", () => {
    let report: (width: number, height: number) => void = () => {};

    beforeEach(() => {
      class StubResizeObserver {
        constructor(callback: ResizeObserverCallback) {
          report = (width, height) =>
            callback(
              [...this.observed].map((target) => ({
                target,
                contentRect: { width, height },
              })) as unknown as ResizeObserverEntry[],
              this as unknown as ResizeObserver,
            );
        }
        observed = new Set<Element>();
        observe(target: Element) {
          this.observed.add(target);
        }
        unobserve(target: Element) {
          this.observed.delete(target);
        }
        disconnect() {}
      }
      vi.stubGlobal("ResizeObserver", StubResizeObserver);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("converts pixel bounds against the measured width", async () => {
      const { separator } = setup({ size: 50, min: "100px", max: "300px" });
      report(400, 200);
      await tick();

      expect(separator).toHaveAttribute("aria-valuemin", "25");
      expect(separator).toHaveAttribute("aria-valuemax", "75");

      separator.focus();
      await user.keyboard("{Home}");
      expect(separator).toHaveAttribute("aria-valuenow", "25");
      await user.keyboard("{End}");
      expect(separator).toHaveAttribute("aria-valuenow", "75");
    });

    it("clamps a drag to a pixel min", async () => {
      const { separator } = setup({ min: "100px" });
      report(400, 200);
      await tick();

      await fireEvent.pointerDown(separator, { clientX: 200, pointerId: 1 });
      await fireEvent.pointerMove(separator, { clientX: 0, pointerId: 1 });
      await fireEvent.pointerUp(separator, { pointerId: 1 });

      expect(separator).toHaveAttribute("aria-valuenow", "25");
      expect(screen.getByTestId("bound-collapsed")).toHaveTextContent("true");
    });

    it("re-clamps when the splitter shrinks, without rewriting size", async () => {
      const { separator, startPane } = setup({ size: 30, min: "100px" });
      report(400, 200);
      await tick();
      expect(separator).toHaveAttribute("aria-valuenow", "30");

      report(200, 200);
      await tick();

      expect(separator).toHaveAttribute("aria-valuemin", "50");
      expect(separator).toHaveAttribute("aria-valuenow", "50");
      expect(startPane.style.flexBasis).toBe("50%");
      expect(screen.getByTestId("bound-size")).toHaveTextContent("30");
    });

    it("uses the height when vertical", async () => {
      const { separator } = setup({ orientation: "vertical", min: "50px" });
      report(400, 200);
      await tick();

      expect(separator).toHaveAttribute("aria-valuemin", "25");
    });

    it("lets a min larger than max win", async () => {
      const { separator } = setup({ min: "300px", max: "200px" });
      report(400, 200);
      await tick();

      expect(separator).toHaveAttribute("aria-valuemin", "75");
      expect(separator).toHaveAttribute("aria-valuemax", "75");
      expect(separator).toHaveAttribute("aria-valuenow", "75");
    });

    it("sets the pixel bounds on the start pane for before it is measured", () => {
      const { startPane } = setup({ min: "100px", max: "300px" });

      expect(startPane.style.minWidth).toBe("100px");
      expect(startPane.style.maxWidth).toBe("300px");
      expect(startPane.style.minHeight).toBe("");
    });

    it("sets min and max height when vertical", () => {
      const { startPane } = setup({ orientation: "vertical", min: "100px" });

      expect(startPane.style.minHeight).toBe("100px");
      expect(startPane.style.minWidth).toBe("");
    });
  });

  it("makes a pane shrunk to nothing inert", async () => {
    // Svelte 5 sets the `inert` property, which dom-env doesn't reflect to
    // the attribute; Svelte 3 and 4 set the attribute.
    const isInert = (element: Element) =>
      (element as HTMLElement).inert || element.hasAttribute("inert");

    const { separator, startPane } = setup({ size: 30 });
    const endPane = screen.getByText("End pane").closest(".bx--splitter__pane");
    assert(endPane);

    expect(isInert(startPane)).toBe(false);
    separator.focus();
    await user.keyboard("{Home}");
    expect(isInert(startPane)).toBe(true);
    expect(isInert(endPane)).toBe(false);

    await user.keyboard("{End}");
    expect(isInert(startPane)).toBe(false);
    expect(isInert(endPane)).toBe(true);
  });

  it("follows a pointer drag and fires resize once on release", async () => {
    const { consoleLog, root, separator } = setup();

    await fireEvent.pointerDown(separator, { clientX: 200, pointerId: 1 });
    expect(root).toHaveClass("bx--splitter--resizing");

    await fireEvent.pointerMove(separator, { clientX: 100, pointerId: 1 });
    expect(separator).toHaveAttribute("aria-valuenow", "25");
    await fireEvent.pointerMove(separator, { clientX: 133, pointerId: 1 });
    await fireEvent.pointerUp(separator, { pointerId: 1 });

    expect(separator).toHaveAttribute("aria-valuenow", "33.25");
    expect(root).not.toHaveClass("bx--splitter--resizing");
    expect(consoleLog.mock.calls).toEqual([["resize", { size: 33.25 }]]);
  });

  it("measures a vertical drag along the height", async () => {
    const { separator } = setup({ orientation: "vertical" });

    await fireEvent.pointerDown(separator, { clientY: 100, pointerId: 1 });
    await fireEvent.pointerMove(separator, { clientY: 150, pointerId: 1 });
    await fireEvent.pointerUp(separator, { pointerId: 1 });

    expect(separator).toHaveAttribute("aria-valuenow", "75");
  });

  it("clamps a drag to min and max", async () => {
    const { separator } = setup({ min: 10, max: 70 });

    await fireEvent.pointerDown(separator, { clientX: 200, pointerId: 1 });
    await fireEvent.pointerMove(separator, { clientX: 0, pointerId: 1 });
    expect(separator).toHaveAttribute("aria-valuenow", "10");
    await fireEvent.pointerMove(separator, { clientX: 400, pointerId: 1 });
    await fireEvent.pointerUp(separator, { pointerId: 1 });

    expect(separator).toHaveAttribute("aria-valuenow", "70");
  });

  it("does not fire resize for a press without movement", async () => {
    const { consoleLog, separator } = setup();

    await fireEvent.pointerDown(separator, { clientX: 200, pointerId: 1 });
    await fireEvent.pointerUp(separator, { pointerId: 1 });

    expect(consoleLog).not.toHaveBeenCalled();
  });

  it("restores the initial size on double click", async () => {
    const { consoleLog, separator } = setup({ size: 30 });

    separator.focus();
    await user.keyboard("{End}");
    await user.dblClick(separator);

    expect(separator).toHaveAttribute("aria-valuenow", "30");
    expect(consoleLog).toHaveBeenLastCalledWith("resize", { size: 30 });
  });

  it("ignores drags and keys when disabled", async () => {
    const { consoleLog, separator } = setup({ disabled: true });

    expect(separator).not.toHaveAttribute("tabindex");
    expect(separator).not.toHaveAttribute("aria-valuenow");
    expect(separator).toHaveClass("bx--splitter__separator--disabled");

    await fireEvent.pointerDown(separator, { clientX: 200, pointerId: 1 });
    await fireEvent.pointerMove(separator, { clientX: 100, pointerId: 1 });
    await fireEvent.pointerUp(separator, { pointerId: 1 });
    await fireEvent.keyDown(separator, { key: "ArrowRight" });

    expect(consoleLog).not.toHaveBeenCalled();
    expect(screen.getByTestId("bound-size")).toHaveTextContent("50");
  });

  describe("hover delay", () => {
    const HOVER = "bx--splitter__separator--hover";

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("marks the separator after the default 150ms and clears on leave", async () => {
      const { separator } = setup();

      await fireEvent.pointerEnter(separator, { pointerType: "mouse" });
      await vi.advanceTimersByTimeAsync(149);
      expect(separator).not.toHaveClass(HOVER);
      await vi.advanceTimersByTimeAsync(1);
      expect(separator).toHaveClass(HOVER);

      await fireEvent.pointerLeave(separator, { pointerType: "mouse" });
      expect(separator).not.toHaveClass(HOVER);
    });

    it("does not mark the separator for a pass shorter than the delay", async () => {
      const { separator } = setup();

      await fireEvent.pointerEnter(separator, { pointerType: "mouse" });
      await vi.advanceTimersByTimeAsync(100);
      await fireEvent.pointerLeave(separator, { pointerType: "mouse" });
      await vi.advanceTimersByTimeAsync(100);

      expect(separator).not.toHaveClass(HOVER);
    });

    it("marks the separator at once with enterDelayMs 0", async () => {
      const { separator } = setup({ enterDelayMs: 0 });

      await fireEvent.pointerEnter(separator, { pointerType: "mouse" });

      expect(separator).toHaveClass(HOVER);
    });

    it("ignores touch and disabled separators", async () => {
      const { separator } = setup();
      await fireEvent.pointerEnter(separator, { pointerType: "touch" });
      await vi.advanceTimersByTimeAsync(150);
      expect(separator).not.toHaveClass(HOVER);

      const disabled = render(Splitter, { props: { disabled: true } });
      const disabledSeparator =
        disabled.container.querySelector("[role='separator']");
      assert(disabledSeparator);
      await fireEvent.pointerEnter(disabledSeparator, { pointerType: "mouse" });
      await vi.advanceTimersByTimeAsync(150);
      expect(disabledSeparator).not.toHaveClass(HOVER);
    });

    it("inherits the enclosing splitter's delay unless set", async () => {
      render(SplitterNested, { props: { outerDelayMs: 400 } });
      const inner = screen.getByRole("separator", { name: "Inner" });

      await fireEvent.pointerEnter(inner, { pointerType: "mouse" });
      await vi.advanceTimersByTimeAsync(399);
      expect(inner).not.toHaveClass(HOVER);
      await vi.advanceTimersByTimeAsync(1);
      expect(inner).toHaveClass(HOVER);
    });

    it("prefers a nested splitter's own delay", async () => {
      render(SplitterNested, { props: { outerDelayMs: 400, innerDelayMs: 0 } });
      const inner = screen.getByRole("separator", { name: "Inner" });

      await fireEvent.pointerEnter(inner, { pointerType: "mouse" });

      expect(inner).toHaveClass(HOVER);
    });
  });
});
