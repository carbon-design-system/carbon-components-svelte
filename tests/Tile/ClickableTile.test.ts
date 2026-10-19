import { fireEvent, render, screen } from "@testing-library/svelte";
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

  it("should render with other attributes", () => {
    render(ClickableTile);

    const tile = screen.getByText("Link with other attributes");
    expect(tile).toHaveAttribute("target", "_blank");
    expect(tile).toHaveAttribute("title", "");
  });

  it("adds rel for target=_blank only", () => {
    render(ClickableTile);

    expect(screen.getByText("Link with other attributes")).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
    expect(screen.getByText("Link only")).not.toHaveAttribute("rel");
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

    // `user.type` clicks the element first, so it cannot tell Space from a
    // click. Focus the tile and press the key alone.
    tile.focus();
    await user.keyboard(" ");
    expect(tile).not.toHaveClass("bx--tile--is-clicked");
  });

  it.each([
    ["Space", " "],
    ["Enter", "{Enter}"],
  ])("should fire the click handler on %s", async (_name, key) => {
    const onClick = vi.fn();
    render(ClickableTile, { props: { onClick } });

    const tile = screen.getByTestId("click-test");
    tile.focus();
    await user.keyboard(key);

    expect(onClick).toHaveBeenCalled();
  });

  it("cancels the default action of Space so the page does not scroll", async () => {
    render(ClickableTile);

    const notCanceled = await fireEvent.keyDown(
      screen.getByTestId("click-test"),
      { key: " " },
    );

    expect(notCanceled).toBe(false);
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

    it("activates once while Space is held", async () => {
      const onClick = vi.fn();
      render(ClickableTileButton, { props: { onClick } });

      screen.getByRole("button", { name: "Acknowledge incident" }).focus();
      await user.keyboard("[Space>3/]");

      expect(onClick).toHaveBeenCalledTimes(1);
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
      expect(tile).toHaveClass("bx--tile--clickable");
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
