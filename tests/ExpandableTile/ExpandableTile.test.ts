import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import ExpandableTile from "./ExpandableTile.test.svelte";
import ExpandableTileCustom from "./ExpandableTileCustom.test.svelte";
import ExpandableTileToggle from "./ExpandableTileToggle.test.svelte";
import ExpandableTileVariants from "./ExpandableTileVariants.test.svelte";

describe("ExpandableTile", () => {
  it("should render with default props", () => {
    render(ExpandableTile);

    const tile = screen.getByRole("button");
    expect(tile).toBeInTheDocument();
    expect(tile).toHaveClass("bx--tile", "bx--tile--expandable");
    expect(tile).toHaveAttribute("aria-expanded", "false");
    expect(tile).toHaveAttribute("title", "Interact to expand Tile");

    const aboveContent = screen.getByTestId("above-content");
    const belowContent = screen.getByTestId("below-content");
    expect(aboveContent).toHaveTextContent("Above the fold content here");
    expect(belowContent).toHaveTextContent("Below the fold content here");
  });

  it("should render with expandable classes", () => {
    render(ExpandableTileVariants);

    const tile = screen.getByTestId("basic");
    expect(tile).toHaveClass("bx--tile", "bx--tile--expandable");
  });

  it("should handle expanded state", () => {
    render(ExpandableTile, { props: { expanded: true } });

    const tile = screen.getByRole("button");
    expect(tile).toHaveAttribute("aria-expanded", "true");
    expect(tile).toHaveAttribute("title", "Interact to collapse Tile");
    expect(tile).toHaveClass("bx--tile--is-expanded");
  });

  it("should render pre-expanded", () => {
    render(ExpandableTileVariants);

    const tile = screen.getByTestId("pre-expanded");
    expect(tile).toHaveAttribute("aria-expanded", "true");
    expect(tile).toHaveClass("bx--tile--is-expanded");
  });

  it("should handle light variant", () => {
    render(ExpandableTile, { props: { light: true } });

    expect(screen.getByRole("button")).toHaveClass("bx--tile--light");
  });

  it("should handle custom icon text", async () => {
    render(ExpandableTile, {
      props: {
        tileCollapsedIconText: "Custom collapsed text",
        tileExpandedIconText: "Custom expanded text",
      },
    });

    const tile = screen.getByRole("button");
    expect(tile).toHaveAttribute("title", "Custom collapsed text");

    await user.click(tile);
    expect(tile).toHaveAttribute("title", "Custom expanded text");
  });

  it("should handle custom labels", async () => {
    render(ExpandableTile, {
      props: {
        tileCollapsedLabel: "Show more",
        tileExpandedLabel: "Show less",
      },
    });

    expect(screen.getByText("Show more")).toBeInTheDocument();

    await user.click(screen.getByRole("button"));
    expect(screen.getByText("Show less")).toBeInTheDocument();
  });

  it("should handle custom tabindex", () => {
    render(ExpandableTile, { props: { tabindex: "1" } });

    expect(screen.getByRole("button")).toHaveAttribute("tabindex", "1");
  });

  it("should handle custom id", () => {
    render(ExpandableTile, { props: { id: "custom-id" } });

    expect(screen.getByRole("button")).toHaveAttribute("id", "custom-id");
  });

  it("should toggle expanded state on click", async () => {
    render(ExpandableTile);

    const tile = screen.getByRole("button");
    expect(tile).toHaveAttribute("aria-expanded", "false");

    await user.click(tile);
    expect(tile).toHaveAttribute("aria-expanded", "true");

    await user.click(tile);
    expect(tile).toHaveAttribute("aria-expanded", "false");
  });

  it("should handle keyboard events", async () => {
    render(ExpandableTile);

    const tile = screen.getByRole("button");
    await user.tab();
    expect(tile).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(tile).toHaveAttribute("aria-expanded", "true");

    await user.keyboard(" ");
    expect(tile).toHaveAttribute("aria-expanded", "false");
  });

  describe("with interactive content", () => {
    it("should not toggle expanded state when clicking an interactive child element", async () => {
      render(ExpandableTileVariants);

      const tile = screen.getByTestId("interactive");
      const link = screen.getByTestId("inner-link");

      expect(tile).not.toHaveClass("bx--tile--is-expanded");

      await user.click(link);
      expect(tile).not.toHaveClass("bx--tile--is-expanded");
    });

    it("should only toggle expanded state when clicking the chevron button", async () => {
      render(ExpandableTileVariants);

      const tile = screen.getByTestId("interactive");
      expect(tile).not.toHaveClass("bx--tile--is-expanded");

      const chevronButton = tile.querySelector("button.bx--tile__chevron");
      expect.assert(chevronButton);
      expect(chevronButton).toHaveAttribute("aria-expanded", "false");

      await user.click(chevronButton);
      expect(tile).toHaveClass("bx--tile--is-expanded");
      expect(chevronButton).toHaveAttribute("aria-expanded", "true");

      await user.click(chevronButton);
      expect(tile).not.toHaveClass("bx--tile--is-expanded");
      expect(chevronButton).toHaveAttribute("aria-expanded", "false");
    });

    it("should render as a div (not button) when it contains interactive content", () => {
      render(ExpandableTileVariants);

      const tile = screen.getByTestId("interactive");
      expect(tile.tagName).not.toBe("BUTTON");
    });

    it("should not toggle when clicking interactive button or link", async () => {
      render(ExpandableTileCustom);

      const tile = document.querySelector(".bx--tile--expandable");
      const chevronButton = tile?.querySelector("button.bx--tile__chevron");
      const link = screen.getByTestId("test-link");
      const button = screen.getByTestId("test-button");

      expect(chevronButton).toHaveAttribute("aria-expanded", "false");

      await user.click(link);
      expect(chevronButton).toHaveAttribute("aria-expanded", "false");

      await user.click(button);
      expect(chevronButton).toHaveAttribute("aria-expanded", "false");
    });
  });

  it("should handle mouse events", async () => {
    render(ExpandableTile);

    const tile = screen.getByRole("button");
    await user.hover(tile);
    await user.unhover(tile);
  });

  it("should handle max height and padding", async () => {
    render(ExpandableTile, {
      props: {
        tileMaxHeight: 200,
        tilePadding: 20,
      },
    });

    const tile = screen.getByRole("button");
    expect(tile.getAttribute("style")).toBe("max-height: 220px;");

    await user.click(tile);
    expect(tile.getAttribute("style")).toBe("max-height: none;");
  });

  it("should set max-height to none when tileMaxHeight is 0 to prevent height animation on initial load", () => {
    render(ExpandableTile, {
      props: {
        tileMaxHeight: 0,
        tilePadding: 20,
      },
    });

    const tile = screen.getByRole("button");
    expect(tile.getAttribute("style")).toBe("max-height: none;");
  });

  it("should not overwrite consumer-bound tilePadding after afterUpdate runs", async () => {
    const { component } = render(ExpandableTileVariants, {
      props: { tilePadding: 50, tileMaxHeight: 300 },
    });

    await tick();

    expect(component.tilePadding).toBe(50);
  });

  it("should not overwrite consumer-bound tileMaxHeight after the ResizeObserver measures", async () => {
    const { component } = render(ExpandableTileVariants, {
      props: { tilePadding: 50, tileMaxHeight: 300 },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    await tick();

    expect(component.tileMaxHeight).toBe(300);
  });

  it("should re-observe the above-the-fold element when hasInteractiveContent toggles", async () => {
    // Toggling `hasInteractiveContent` swaps the root tag via <svelte:element>,
    // which destroys and re-creates the subtree — including the element bound
    // to `refAbove`. The ResizeObserver must follow the new node, otherwise it
    // keeps watching the detached original and `tileMaxHeight` stops updating.
    const observed = new Set<Element>();
    const OriginalResizeObserver = globalThis.ResizeObserver;

    class TrackingResizeObserver {
      private elements = new Set<Element>();
      observe(el: Element) {
        this.elements.add(el);
        observed.add(el);
      }
      unobserve(el: Element) {
        this.elements.delete(el);
        observed.delete(el);
      }
      disconnect() {
        for (const el of this.elements) observed.delete(el);
        this.elements.clear();
      }
    }

    globalThis.ResizeObserver =
      TrackingResizeObserver as unknown as typeof ResizeObserver;

    try {
      const { rerender } = render(ExpandableTileToggle, {
        props: { interactive: false },
      });

      const firstRefAbove = screen
        .getByTestId("toggle")
        .querySelector(".bx--tile-content");
      expect(firstRefAbove).not.toBeNull();
      expect(observed.has(firstRefAbove as Element)).toBe(true);

      await rerender({ interactive: true });

      const newRefAbove = screen
        .getByTestId("toggle")
        .querySelector(".bx--tile-content");
      expect(newRefAbove).not.toBeNull();
      // The root element is recreated, so the above-the-fold node is new.
      expect(newRefAbove).not.toBe(firstRefAbove);
      // The observer must follow the new node…
      expect(observed.has(newRefAbove as Element)).toBe(true);
      // …and let go of the detached original.
      expect(observed.has(firstRefAbove as Element)).toBe(false);
    } finally {
      globalThis.ResizeObserver = OriginalResizeObserver;
    }
  });
});
