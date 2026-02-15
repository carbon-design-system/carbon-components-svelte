import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import ExpandableTile from "./ExpandableTile.test.svelte";

describe("ExpandableTile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with expandable classes", () => {
    render(ExpandableTile);

    const tile = screen.getByTestId("basic");
    expect(tile).toHaveClass("bx--tile", "bx--tile--expandable");
  });

  it("should toggle expanded state on click", async () => {
    render(ExpandableTile);

    const tile = screen.getByTestId("basic");
    expect(tile).toHaveAttribute("aria-expanded", "false");

    await user.click(tile);
    expect(tile).toHaveAttribute("aria-expanded", "true");

    await user.click(tile);
    expect(tile).toHaveAttribute("aria-expanded", "false");
  });

  it("should render pre-expanded", () => {
    render(ExpandableTile);

    const tile = screen.getByTestId("pre-expanded");
    expect(tile).toHaveAttribute("aria-expanded", "true");
    expect(tile).toHaveClass("bx--tile--is-expanded");
  });

  describe("with interactive content", () => {
    it("should not toggle expanded state when clicking an interactive child element", async () => {
      render(ExpandableTile);

      const tile = screen.getByTestId("interactive");
      const link = screen.getByTestId("inner-link");

      expect(tile).not.toHaveClass("bx--tile--is-expanded");

      // Clicking the inner link should NOT toggle the tile
      await user.click(link);
      expect(tile).not.toHaveClass("bx--tile--is-expanded");
    });

    it("should only toggle expanded state when clicking the chevron button", async () => {
      render(ExpandableTile);

      const tile = screen.getByTestId("interactive");
      expect(tile).not.toHaveClass("bx--tile--is-expanded");

      // In interactive mode, the chevron is a <button> that controls expand/collapse
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
      render(ExpandableTile);

      const tile = screen.getByTestId("interactive");
      // A tile with interactive children should not be a <button>,
      // because nesting interactive elements inside a <button> is invalid HTML.
      expect(tile.tagName).not.toBe("BUTTON");
    });
  });

  it("should set max-height to none when tileMaxHeight is 0 to prevent height animation on initial load", () => {
    render(ExpandableTile);

    const tile = screen.getByTestId("basic");
    expect(tile.getAttribute("style")).toBe("max-height: none;");
  });
});
