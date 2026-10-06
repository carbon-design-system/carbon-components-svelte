import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ClickableTile from "./ClickableTile.test.svelte";
import ClickableTileButton from "./ClickableTileButton.test.svelte";

describe("ClickableTile", () => {
  it("should render with href", () => {
    render(ClickableTile);

    const tile = screen.getByText("Link only");
    expect(tile).toHaveAttribute("href", "https://www.carbondesignsystem.com/");
    expect(tile).toHaveClass("bx--tile", "bx--tile--clickable");
  });

  it("should not include a literal false token in the class attribute", () => {
    render(ClickableTile);

    const tile = screen.getByText("Link only");
    expect(tile.className).not.toMatch(/\bfalse\b/);
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

  it("should fire the click handler on Space, not just toggle clicked state", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ClickableTile);

    const tile = screen.getByTestId("click-test");
    tile.focus();
    await user.keyboard(" ");

    expect(consoleLog).toHaveBeenCalledWith("clicked");
  });

  it("should fire the click handler on Enter", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ClickableTile);

    const tile = screen.getByTestId("click-test");
    tile.focus();
    await user.keyboard("{Enter}");

    expect(consoleLog).toHaveBeenCalledWith("clicked");
  });

  it("should respect disabled state", () => {
    render(ClickableTile);

    const disabledTile = screen.getByTestId("disabled-test");
    expect(disabledTile).toHaveAttribute("aria-disabled", "true");
    expect(disabledTile).toHaveClass("bx--tile--clickable");
  });

  it("should not toggle clicked state when disabled", async () => {
    render(ClickableTile);

    const disabledTile = screen.getByTestId("disabled-test");
    expect(disabledTile).not.toHaveClass("bx--tile--is-clicked");

    await user.click(disabledTile);
    expect(disabledTile).not.toHaveClass("bx--tile--is-clicked");
  });

  it("should expose a reference to the underlying anchor element", () => {
    const { component } = render(ClickableTile);

    expect(component.ref).toBeInstanceOf(HTMLAnchorElement);
    expect(component.ref).toHaveClass("bx--tile--clickable");
  });

  describe("without href", () => {
    it("is a focusable button", async () => {
      render(ClickableTileButton);

      const tile = screen.getByRole("button", { name: "Acknowledge incident" });
      expect(tile).toHaveClass("bx--tile--clickable");

      await user.tab();
      expect(tile).toHaveFocus();
    });

    it("activates on Enter and Space", async () => {
      const onClick = vi.fn();
      render(ClickableTileButton, { props: { onClick } });

      const tile = screen.getByRole("button", { name: "Acknowledge incident" });
      tile.focus();
      await user.keyboard("{Enter}");
      await user.keyboard(" ");

      expect(onClick).toHaveBeenCalledTimes(2);
      expect(tile).not.toHaveClass("bx--tile--is-clicked");
    });

    it("keeps a consumer's tabindex", () => {
      render(ClickableTileButton);

      expect(screen.getByTestId("custom-tabindex")).toHaveAttribute(
        "tabindex",
        "-1",
      );
    });

    it("stays a disabled link when disabled", () => {
      render(ClickableTileButton);

      const tile = screen.getByTestId("disabled");
      expect(tile).toHaveAttribute("role", "link");
      expect(tile).toHaveAttribute("aria-disabled", "true");
      expect(tile).not.toHaveAttribute("tabindex");
    });
  });

  it("does not add button semantics when href is set", () => {
    render(ClickableTile);

    const tile = screen.getByText("Link only");
    expect(tile).not.toHaveAttribute("role");
    expect(tile).not.toHaveAttribute("tabindex");
  });
});
