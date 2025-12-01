import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import ClickableTile from "./ClickableTile.test.svelte";

describe("ClickableTile", () => {
  it("should render with href", () => {
    render(ClickableTile);

    const tile = screen.getByText("Link only");
    expect(tile).toHaveAttribute("href", "https://www.carbondesignsystem.com/");
    expect(tile).toHaveClass("bx--tile", "bx--tile--clickable");
  });

  it("should render light variant with other attributes", () => {
    render(ClickableTile);

    const tile = screen.getByText("Link with light variant");
    expect(tile).toHaveClass("bx--tile--light");
    expect(tile).toHaveAttribute("target", "_blank");
    expect(tile).toHaveAttribute("title", "");
  });

  it("should toggle clicked state on click", async () => {
    render(ClickableTile);

    const tile = screen.getByTestId("click-test");
    expect(tile).not.toHaveClass("bx--tile--is-clicked");

    await user.click(tile);
    expect(tile).toHaveClass("bx--tile--is-clicked");

    await user.click(tile);
    expect(tile).not.toHaveClass("bx--tile--is-clicked");
  });

  it("should have clicked state", async () => {
    render(ClickableTile);

    const tile = screen.getByText("Clicked");
    expect(tile).toHaveClass("bx--tile--is-clicked");

    await user.type(tile, "{Space}");
    expect(tile).not.toHaveClass("bx--tile--is-clicked");
  });

  it("should respect disabled state", () => {
    render(ClickableTile);

    const disabledTile = screen.getByTestId("disabled-test");
    expect(disabledTile).toHaveAttribute("aria-disabled", "true");
    expect(disabledTile).toHaveClass("bx--tile--clickable");
  });
});
