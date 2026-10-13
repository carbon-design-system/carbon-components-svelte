import { fireEvent, render, screen } from "@testing-library/svelte";
import SplitterComponent from "carbon-components-svelte/Splitter/Splitter.svelte";
import { tick } from "svelte";
import { rect } from "../utils/rect";
import { user } from "../utils/user";
import Splitter from "./Splitter.test.svelte";
import SplitterNested from "./SplitterNested.test.svelte";

/** Returns the "bound-size" element that mirrors the bound `size`. */
const boundSize = () => screen.getByTestId("bound-size");
/** Returns the "bound-collapsed" element that mirrors the bound `collapsed`. */
const boundCollapsed = () => screen.getByTestId("bound-collapsed");

/** Presses the separator at `from`, moves it to `to` and releases it along `axis`. */
async function drag(
  separator: HTMLElement,
  from: number,
  to: number,
  axis: "clientX" | "clientY" = "clientX",
) {
  await fireEvent.pointerDown(separator, { [axis]: from, pointerId: 1 });
  await fireEvent.pointerMove(separator, { [axis]: to, pointerId: 1 });
  await fireEvent.pointerUp(separator, { pointerId: 1 });
}

function setup(props: Record<string, unknown> = {}) {
  const onResize = vi.fn();
  const { rerender } = render(Splitter, { props: { onResize, ...props } });
  const root = screen.getByTestId("splitter");
  vi.spyOn(root, "getBoundingClientRect").mockReturnValue(
    rect({ width: 400, height: 200 }),
  );
  const separator = screen.getByRole("separator");
  const startPane = screen.getByText("Start pane").parentElement;
  assert(startPane);
  return { onResize, root, separator, startPane, rerender };
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
    expect(boundSize()).toHaveTextContent("95");
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
    expect(boundSize()).toHaveTextContent(expected);
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

  it("moves by step, and by ten steps with Shift", async () => {
    const { separator } = setup({ step: 5, size: 20 });

    separator.focus();
    await user.keyboard("{ArrowRight}");
    expect(separator).toHaveAttribute("aria-valuenow", "25");

    await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
    expect(separator).toHaveAttribute("aria-valuenow", "75");
  });

  it("uses ArrowUp and ArrowDown when vertical", async () => {
    const { separator, root } = setup({ orientation: "vertical" });

    expect(root).toHaveClass("bx--splitter--vertical");
    expect(separator).toHaveAttribute("aria-orientation", "horizontal");

    separator.focus();
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowUp}{ArrowLeft}");

    expect(separator).toHaveAttribute("aria-valuenow", "51");
  });

  it("collapses to min on Enter and restores the previous size", async () => {
    const { onResize, separator } = setup({ size: 40, min: 10 });

    separator.focus();
    await user.keyboard("{Enter}");
    expect(separator).toHaveAttribute("aria-valuenow", "10");

    await user.keyboard("{Enter}");
    expect(separator).toHaveAttribute("aria-valuenow", "40");
    expect(onResize.mock.calls).toEqual([[{ size: 10 }], [{ size: 40 }]]);
  });

  describe("collapsed", () => {
    const toggle = () =>
      user.click(screen.getByRole("button", { name: "Toggle collapsed" }));

    it("collapses on mount and restores the given size", async () => {
      const { separator } = setup({ size: 40, min: 10, collapsed: true });

      expect(separator).toHaveAttribute("aria-valuenow", "10");
      expect(boundSize()).toHaveTextContent("10");

      await toggle();

      expect(separator).toHaveAttribute("aria-valuenow", "40");
      expect(boundCollapsed()).toHaveTextContent("false");
    });

    it("collapses and restores when set, without firing resize", async () => {
      const { onResize, separator } = setup({ size: 40, min: 10 });

      await toggle();
      expect(separator).toHaveAttribute("aria-valuenow", "10");
      await toggle();
      expect(separator).toHaveAttribute("aria-valuenow", "40");

      expect(onResize).not.toHaveBeenCalled();
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

      await drag(separator, 160, 0);
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

  describe("collapsedSize", () => {
    const boundCollapsed = () => screen.getByTestId("bound-collapsed");

    it("collapses below min on Enter and restores", async () => {
      const { separator, startPane } = setup({
        size: 40,
        min: 20,
        collapsedSize: 0,
      });

      expect(separator).toHaveAttribute("aria-valuemin", "0");
      separator.focus();
      await user.keyboard("{Enter}");
      expect(separator).toHaveAttribute("aria-valuenow", "0");
      expect(startPane.style.flexBasis).toBe("0%");
      expect(boundCollapsed()).toHaveTextContent("true");

      await user.keyboard("{Enter}");
      expect(separator).toHaveAttribute("aria-valuenow", "40");
      expect(boundCollapsed()).toHaveTextContent("false");
    });

    it("keeps Home at min", async () => {
      const { separator } = setup({ size: 40, min: 20, collapsedSize: 0 });

      separator.focus();
      await user.keyboard("{Home}");

      expect(separator).toHaveAttribute("aria-valuenow", "20");
      expect(boundCollapsed()).toHaveTextContent("false");
    });

    it("snaps a drag past halfway below min collapsed, and back open", async () => {
      const { onResize, separator } = setup({
        size: 50,
        min: 20,
        collapsedSize: 0,
      });

      await fireEvent.pointerDown(separator, { clientX: 200, pointerId: 1 });
      // 15%: below min but short of halfway, so it holds at min.
      await fireEvent.pointerMove(separator, { clientX: 60, pointerId: 1 });
      expect(separator).toHaveAttribute("aria-valuenow", "20");
      // 8%: past halfway, so it snaps collapsed.
      await fireEvent.pointerMove(separator, { clientX: 32, pointerId: 1 });
      expect(separator).toHaveAttribute("aria-valuenow", "0");
      // 30%: open again.
      await fireEvent.pointerMove(separator, { clientX: 120, pointerId: 1 });
      expect(separator).toHaveAttribute("aria-valuenow", "30");
      await fireEvent.pointerMove(separator, { clientX: 20, pointerId: 1 });
      await fireEvent.pointerUp(separator, { pointerId: 1 });

      expect(boundCollapsed()).toHaveTextContent("true");
      expect(onResize.mock.calls).toEqual([[{ size: 0 }]]);
    });

    it("collapses below min when set, and renders a stored collapsed size", async () => {
      const { separator } = setup({ size: 0, min: 20, collapsedSize: 0 });

      expect(separator).toHaveAttribute("aria-valuenow", "0");
      expect(boundCollapsed()).toHaveTextContent("true");

      await user.click(
        screen.getByRole("button", { name: "Toggle collapsed" }),
      );
      expect(separator).toHaveAttribute("aria-valuenow", "60");
    });

    it("renders a size between collapsedSize and min at min", () => {
      const { separator } = setup({ size: 12, min: 20, collapsedSize: 0 });

      expect(separator).toHaveAttribute("aria-valuenow", "20");
      expect(screen.getByTestId("bound-size")).toHaveTextContent("12");
    });

    it("never collapses further than min when larger than min", async () => {
      const { separator } = setup({ size: 40, min: 20, collapsedSize: 30 });

      separator.focus();
      await user.keyboard("{Enter}");

      expect(separator).toHaveAttribute("aria-valuenow", "20");
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

      await drag(separator, 200, 0);

      expect(separator).toHaveAttribute("aria-valuenow", "25");
      expect(boundCollapsed()).toHaveTextContent("true");
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
      expect(boundSize()).toHaveTextContent("30");
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

    it("drops a pixel min from the pane once it collapses below it", async () => {
      const { separator, startPane } = setup({
        size: 50,
        min: "100px",
        collapsedSize: 0,
      });
      report(400, 200);
      await tick();
      expect(startPane.style.minWidth).toBe("100px");

      separator.focus();
      await user.keyboard("{Enter}");

      expect(separator).toHaveAttribute("aria-valuenow", "0");
      expect(startPane.style.minWidth).toBe("");
    });

    it.each([
      {
        orientation: "horizontal",
        set: ["minWidth", "maxWidth"],
        unset: "minHeight",
      },
      {
        orientation: "vertical",
        set: ["minHeight", "maxHeight"],
        unset: "minWidth",
      },
    ] as const)(
      "sets the $orientation pixel bounds on the start pane before it is measured",
      ({ orientation, set, unset }) => {
        const { startPane } = setup({
          orientation,
          min: "100px",
          max: "300px",
        });

        expect(startPane.style[set[0]]).toBe("100px");
        expect(startPane.style[set[1]]).toBe("300px");
        expect(startPane.style[unset]).toBe("");
      },
    );
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
    const { onResize, root, separator } = setup();

    await fireEvent.pointerDown(separator, { clientX: 200, pointerId: 1 });
    expect(root).toHaveClass("bx--splitter--resizing");

    await fireEvent.pointerMove(separator, { clientX: 100, pointerId: 1 });
    expect(separator).toHaveAttribute("aria-valuenow", "25");
    await fireEvent.pointerMove(separator, { clientX: 133, pointerId: 1 });
    await fireEvent.pointerUp(separator, { pointerId: 1 });

    expect(separator).toHaveAttribute("aria-valuenow", "33.25");
    expect(root).not.toHaveClass("bx--splitter--resizing");
    expect(onResize.mock.calls).toEqual([[{ size: 33.25 }]]);
  });

  describe("in RTL", () => {
    beforeEach(() => {
      document.documentElement.style.direction = "rtl";
    });

    afterEach(() => {
      document.documentElement.style.removeProperty("direction");
    });

    it("grows the start pane, on the right, as the separator is dragged left", async () => {
      const { separator } = setup();

      await drag(separator, 200, 100);

      expect(separator).toHaveAttribute("aria-valuenow", "75");
    });

    it("grows the start pane with ArrowLeft and shrinks it with ArrowRight", async () => {
      const { separator } = setup();

      separator.focus();
      await user.keyboard("{ArrowLeft}{ArrowLeft}{ArrowRight}");

      expect(separator).toHaveAttribute("aria-valuenow", "51");
    });

    it("keeps a vertical drag and keys as they are", async () => {
      const { separator } = setup({ orientation: "vertical" });

      await drag(separator, 100, 150, "clientY");
      expect(separator).toHaveAttribute("aria-valuenow", "75");

      separator.focus();
      await user.keyboard("{ArrowUp}{ArrowLeft}");
      expect(separator).toHaveAttribute("aria-valuenow", "74");
    });
  });

  it("measures a vertical drag along the height", async () => {
    const { separator } = setup({ orientation: "vertical" });

    await drag(separator, 100, 150, "clientY");

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
    const { onResize, separator } = setup();

    await fireEvent.pointerDown(separator, { clientX: 200, pointerId: 1 });
    await fireEvent.pointerUp(separator, { pointerId: 1 });

    expect(onResize).not.toHaveBeenCalled();
  });

  it("restores the initial size on double click", async () => {
    const { onResize, separator } = setup({ size: 30 });

    separator.focus();
    await user.keyboard("{End}");
    await user.dblClick(separator);

    expect(separator).toHaveAttribute("aria-valuenow", "30");
    expect(onResize).toHaveBeenLastCalledWith({ size: 30 });
  });

  it("ignores drags and keys when disabled", async () => {
    const { onResize, separator } = setup({ disabled: true });

    expect(separator).not.toHaveAttribute("tabindex");
    expect(separator).not.toHaveAttribute("aria-valuenow");
    expect(separator).toHaveClass("bx--splitter__separator--disabled");

    await drag(separator, 200, 100);
    await fireEvent.keyDown(separator, { key: "ArrowRight" });

    expect(onResize).not.toHaveBeenCalled();
    expect(boundSize()).toHaveTextContent("50");
  });

  it("ignores double click when disabled", async () => {
    const { onResize, separator, rerender } = setup({ size: 30 });

    await rerender({ size: 60, disabled: true });
    await user.dblClick(separator);

    expect(onResize).not.toHaveBeenCalled();
    expect(boundSize()).toHaveTextContent("60");
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

    it("cancels a pending hover when disabled mid-wait", async () => {
      const { separator, rerender } = setup();

      await fireEvent.pointerEnter(separator, { pointerType: "mouse" });
      await vi.advanceTimersByTimeAsync(100);
      await rerender({ disabled: true });
      await vi.advanceTimersByTimeAsync(100);

      expect(separator).not.toHaveClass(HOVER);
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
