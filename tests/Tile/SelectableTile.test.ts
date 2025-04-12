import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import SelectableTileTest from "./SelectableTile.test.svelte";

describe("SelectableTile", () => {
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
    render(SelectableTileTest, { disabled: true });
    const tile = screen.getByTestId("selectable-tile");
    expect(tile).toHaveClass("bx--tile--disabled");
  });

  it("renders with custom title and value", () => {
    render(SelectableTileTest, {
      title: "Custom Title",
      value: "custom-value",
    });
    const input = screen.getByRole("checkbox");
    expect(input).toHaveAttribute("title", "Custom Title");
    expect(input).toHaveAttribute("value", "custom-value");
  });

  it("renders with custom name and icon description", () => {
    render(SelectableTileTest, {
      name: "custom-name",
      iconDescription: "Custom checkmark",
    });

    const input = screen.getByRole("checkbox");
    expect(input).toHaveAttribute("name", "custom-name");

    const icon = screen.getByTestId("selectable-tile").querySelector("svg");
    expect(icon).toHaveAttribute("aria-label", "Custom checkmark");
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
