import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { rect } from "../utils/rect";
import PopoverPortal from "./PopoverPortal.test.svelte";

const popover = () => document.getElementById("pop");

describe("Popover in a portal", () => {
  afterEach(() => vi.restoreAllMocks());

  it("renders outside its anchor with its classes", () => {
    render(PopoverPortal, { props: { portalPopover: true } });

    expect(screen.getByTestId("anchor")).not.toContainElement(popover());
    expect(popover()).toHaveClass(
      "bx--popover",
      "bx--popover--portal",
      "bx--popover--open",
      "bx--popover--bottom-left",
      "bx--popover--caret",
    );
  });

  // In Svelte 3 and 4, a `class` in a spread replaces a static `class`.
  it.each([
    [true, "in a portal"],
    [false, "in place"],
  ])(
    "keeps a consumer class with its own (portalPopover %s, %s)",
    (portalPopover) => {
      render(PopoverPortal, {
        props: { portalPopover, className: "custom" },
      });

      expect(popover()).toHaveClass(
        "custom",
        "bx--popover",
        "bx--popover--open",
        "bx--popover--bottom-left",
      );
    },
  );

  it("places a closed portalled popover nowhere", () => {
    render(PopoverPortal, { props: { portalPopover: true, open: false } });

    expect(popover()).toBeNull();
  });

  describe("when a box around it would cut it off", () => {
    // A 1000 x 600 window. The box is 400 x 100 and clips; the popover
    // opens 160px tall below a 40px anchor, so it runs past the box.
    beforeEach(() => {
      vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(
        1000,
      );
      vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(
        600,
      );
      vi.spyOn(
        HTMLElement.prototype,
        "getBoundingClientRect",
      ).mockImplementation(function (this: HTMLElement) {
        if (this.dataset.testid === "box")
          return rect({ width: 400, height: 100 });
        if (this.id === "pop")
          return rect({ top: 40, width: 200, height: 160 });
        return rect({ width: 40, height: 40 });
      });
    });

    // Fit on a tick, then move to the portal on the next.
    async function settle() {
      await tick();
      await tick();
      await tick();
    }

    function clipBox() {
      const box = screen.getByTestId("box");
      box.style.overflowX = "hidden";
      box.style.overflowY = "hidden";
      Object.defineProperty(box, "clientWidth", { value: 400 });
      Object.defineProperty(box, "clientHeight", { value: 100 });
    }

    it("moves to a portal for that open", async () => {
      const { rerender } = render(PopoverPortal, { props: { open: false } });
      clipBox();
      await rerender({ open: true });
      await settle();

      expect(screen.getByTestId("box")).not.toContainElement(popover());
      expect(popover()).toHaveClass("bx--popover--portal");

      // Closed, it is back in place for the next open.
      await rerender({ open: false });
      expect(screen.getByTestId("anchor")).toContainElement(popover());
      expect(popover()).not.toHaveClass("bx--popover--open");
    });

    it("stays in place with portalPopover false", async () => {
      const { rerender } = render(PopoverPortal, {
        props: { open: false, portalPopover: false },
      });
      clipBox();
      await rerender({ open: true });
      await settle();

      expect(screen.getByTestId("anchor")).toContainElement(popover());
    });
  });
});
