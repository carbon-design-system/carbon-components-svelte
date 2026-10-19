import { fireEvent, render, screen } from "@testing-library/svelte";
import type SelectableTileComponent from "carbon-components-svelte/Tile/SelectableTile.svelte";
import type { ComponentProps } from "svelte";
import { user } from "../utils/user";
import SelectableTileTest from "./SelectableTile.test.svelte";
import SelectableTileChange from "./SelectableTileChange.test.svelte";
import SelectableTileStandalone from "./SelectableTileStandalone.test.svelte";

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

    expect(tile.tagName).toBe("LABEL");
    expect(tile).not.toHaveAttribute("role", "checkbox");
  });

  it("renders a title attribute only when one is set", () => {
    const { unmount } = render(SelectableTileStandalone);
    expect(screen.getByRole("checkbox")).not.toHaveAttribute("title");
    unmount();

    render(SelectableTileTest, {
      title: "Custom Title",
      value: "custom-value",
    });
    const input = screen.getByRole("checkbox");
    expect(input).toHaveAttribute("title", "Custom Title");
    expect(input).toHaveAttribute("value", "custom-value");
  });

  it("renders with a custom icon description", () => {
    render(SelectableTileTest, { iconDescription: "Custom checkmark" });

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

  it("hides the checkmark icon from assistive technology", () => {
    render(SelectableTileTest);

    const checkmark = screen
      .getByTestId("selectable-tile")
      .querySelector(".bx--tile__checkmark");
    expect(checkmark).toHaveAttribute("aria-hidden", "true");
  });

  describe("interaction", () => {
    const activate = {
      click: () => user.click(screen.getByTestId("selectable-tile")),
      keyboard: async () => {
        await user.keyboard("{Tab}");
        await user.keyboard("{Enter}");
      },
    };

    it.each([
      ["click", false, "select"],
      ["click", true, "deselect"],
      ["keyboard", false, "select"],
      ["keyboard", true, "deselect"],
    ] as const)(
      "%s with selected=%s dispatches %s",
      async (input, selected, event) => {
        const onSelect = vi.fn();
        const onDeselect = vi.fn();
        render(SelectableTileTest, { selected, onSelect, onDeselect });

        await activate[input]();

        const handlers = { select: onSelect, deselect: onDeselect };
        expect(handlers[event]).toHaveBeenCalledWith(expect.any(String));
      },
    );

    it("prevents selection when disabled", async () => {
      const onSelect = vi.fn();
      const onDeselect = vi.fn();
      render(SelectableTileTest, { disabled: true, onSelect, onDeselect });

      const tile = screen.getByTestId("selectable-tile");
      await user.click(tile);
      expect(onSelect).not.toHaveBeenCalled();
      expect(onDeselect).not.toHaveBeenCalled();
    });

    it("forwards the input's change event after updating selected", async () => {
      const onChange = vi.fn();
      render(SelectableTileChange, { onChange });

      await user.click(screen.getByRole("checkbox"));
      expect(onChange).toHaveBeenCalledWith(true, true);

      await user.click(screen.getByRole("checkbox"));
      expect(onChange).toHaveBeenLastCalledWith(false, false);
    });

    it("toggles once when Enter is held down", async () => {
      const onSelect = vi.fn();
      const onDeselect = vi.fn();
      render(SelectableTileTest, { onSelect, onDeselect });
      const checkbox = screen.getByRole("checkbox");
      checkbox.focus();

      await fireEvent.keyDown(checkbox, { key: "Enter" });
      await fireEvent.keyDown(checkbox, { key: "Enter", repeat: true });
      await fireEvent.keyDown(checkbox, { key: "Enter", repeat: true });

      expect(checkbox).toBeChecked();
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(expect.any(String));
      expect(onDeselect).not.toHaveBeenCalled();
    });
  });

  describe("Generics", () => {
    it("narrows value to a custom string literal type", () => {
      type Region = "us-east-1" | "us-west-2";
      type Props = ComponentProps<SelectableTileComponent<Region>>;

      expectTypeOf<Props["value"]>().toEqualTypeOf<Region | undefined>();
    });

    it("defaults value to string when the generic is not specified", () => {
      type Props = ComponentProps<SelectableTileComponent>;

      expectTypeOf<Props["value"]>().toEqualTypeOf<string | undefined>();
    });
  });
});
