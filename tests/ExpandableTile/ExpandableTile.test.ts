import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import ExpandableTile from "./ExpandableTile.test.svelte";
import ExpandableTileCustom from "./ExpandableTileCustom.test.svelte";

describe("ExpandableTile", () => {
  it("should render with default props", () => {
    render(ExpandableTile);

    const tile = screen.getByRole("button");
    expect(tile).toBeInTheDocument();
    expect(tile).toHaveAttribute("aria-expanded", "false");
    expect(tile).toHaveAttribute("title", "Interact to expand Tile");
    expect(screen.getByTestId("above-content")).toBeInTheDocument();
    expect(screen.getByTestId("below-content")).toBeInTheDocument();
  });

  it("should handle expanded state", () => {
    render(ExpandableTile, { props: { expanded: true } });

    const tile = screen.getByRole("button");
    expect(tile).toHaveAttribute("aria-expanded", "true");
    expect(tile).toHaveAttribute("title", "Interact to collapse Tile");
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

  it("should handle interactive content without toggling", async () => {
    render(ExpandableTileCustom);

    const tile = document.querySelector(".bx--tile--expandable");
    const chevronButton = tile?.querySelector(
      "button.bx--tile__chevron--interactive",
    );
    const link = screen.getByTestId("test-link");
    const button = screen.getByTestId("test-button");

    expect(chevronButton).toHaveAttribute("aria-expanded", "false");

    await user.click(link);
    expect(chevronButton).toHaveAttribute("aria-expanded", "false");

    await user.click(button);
    expect(chevronButton).toHaveAttribute("aria-expanded", "false");
  });

  it("should handle mouse events", async () => {
    render(ExpandableTile);

    const tile = screen.getByRole("button");
    await user.hover(tile);
    await user.unhover(tile);
  });

  it("should handle custom content slots", () => {
    render(ExpandableTile);

    const aboveContent = screen.getByTestId("above-content");
    const belowContent = screen.getByTestId("below-content");

    expect(aboveContent).toHaveTextContent("Above the fold content here");
    expect(belowContent).toHaveTextContent("Below the fold content here");
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
});
