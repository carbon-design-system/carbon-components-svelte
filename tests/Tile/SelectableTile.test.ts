import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import SelectableTileTest from "./SelectableTile.test.svelte";
import SelectableTileStandalone from "./SelectableTileStandalone.test.svelte";

describe("SelectableTile", () => {
  it("does not throw when rendered outside a SelectableTileGroup", () => {
    expect(() => render(SelectableTileStandalone)).not.toThrow();
  });

  it("renders with default props", () => {
    render(SelectableTileTest);
    const tile = screen.getByTestId("selectable-tile");
    expect(tile).toHaveClass("bx--tile");
    expect(tile).toHaveClass("bx--tile--selectable");
  });

  it("renders with selected state", () => {
    render(SelectableTileTest, { selected: true });
    const tile = screen.getByTestId("selectable-tile");
    expect(tile).toHaveClass("bx--tile--is-selected");
  });

  it("renders with light variant", () => {
    render(SelectableTileTest, { light: true });
    const tile = screen.getByTestId("selectable-tile");
    expect(tile).toHaveClass("bx--tile--light");
  });

  it("renders with disabled state", () => {
    const { container } = render(SelectableTileTest, { disabled: true });
    const tile = screen.getByTestId("selectable-tile");
    expect(tile).toHaveClass("bx--tile--disabled");

    const input = container.querySelector('input[type="checkbox"]');
    expect(input).toBeDisabled();
    expect(input).not.toHaveAttribute("tabindex");
  });

  it("keeps the input focusable when enabled", () => {
    const { container } = render(SelectableTileTest);
    const input = container.querySelector('input[type="checkbox"]');
    expect(input).not.toBeDisabled();
    expect(input).toHaveAttribute("tabindex", "0");
  });

  it('should not put role="checkbox" on the <label> element', () => {
    render(SelectableTileTest);
    const tile = screen.getByTestId("selectable-tile");

    if (tile.tagName === "LABEL") {
      expect(tile).not.toHaveAttribute("role", "checkbox");
    }
  });

  it("renders with custom title and value", () => {
    const { container } = render(SelectableTileTest, {
      title: "Custom Title",
      value: "custom-value",
    });
    const input = container.querySelector('input[type="checkbox"]');
    expect(input).toHaveAttribute("title", "Custom Title");
    expect(input).toHaveAttribute("value", "custom-value");
  });

  it("renders with custom name and icon description", () => {
    const { container } = render(SelectableTileTest, {
      name: "custom-name",
      iconDescription: "Custom checkmark",
    });

    const input = container.querySelector('input[type="checkbox"]');
    expect(input).toHaveAttribute("name", "custom-name");

    const icon = screen.getByTestId("selectable-tile").querySelector("svg");
    expect(icon).toHaveAttribute("aria-label", "Custom checkmark");
  });

  it("exposes checkbox semantics via the native input, not the label", () => {
    const { container } = render(SelectableTileTest);
    const input = container.querySelector('input[type="checkbox"]');
    expect(input).not.toBeChecked();

    const tile = screen.getByTestId("selectable-tile");
    expect(tile).not.toHaveAttribute("role");
    expect(tile).not.toHaveAttribute("aria-checked");
  });

  it("reflects selected and disabled state on the input", () => {
    const { container } = render(SelectableTileTest, {
      selected: true,
      disabled: true,
    });
    const input = container.querySelector('input[type="checkbox"]');
    expect(input).toBeChecked();
    expect(input).toBeDisabled();
  });

  it("hides the checkmark icon from assistive technology", () => {
    render(SelectableTileTest);

    const checkmark = screen
      .getByTestId("selectable-tile")
      .querySelector(".bx--tile__checkmark");
    expect(checkmark).toHaveAttribute("aria-hidden", "true");
  });

  describe("interaction", () => {
    it("handles click selection", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(SelectableTileTest);

      const tile = screen.getByTestId("selectable-tile");
      await user.click(tile);
      expect(consoleLog).toHaveBeenCalledWith("select", expect.any(String));
    });

    it("handles click deselection", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(SelectableTileTest, { selected: true });

      const tile = screen.getByTestId("selectable-tile");
      await user.click(tile);
      expect(consoleLog).toHaveBeenCalledWith("deselect", expect.any(String));
    });

    it("prevents selection when disabled", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(SelectableTileTest, { disabled: true });

      const tile = screen.getByTestId("selectable-tile");
      await user.click(tile);
      expect(consoleLog).not.toHaveBeenCalled();
    });

    it("handles keyboard selection", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(SelectableTileTest);

      await user.keyboard("{Tab}");
      await user.keyboard("{Enter}");
      expect(consoleLog).toHaveBeenCalledWith("select", expect.any(String));
    });

    it("handles keyboard deselection", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(SelectableTileTest, { selected: true });

      await user.keyboard("{Tab}");
      await user.keyboard("{Enter}");
      expect(consoleLog).toHaveBeenCalledWith("deselect", expect.any(String));
    });
  });
});
