import { render, screen } from "@testing-library/svelte";
import type RadioTileComponent from "carbon-components-svelte/Tile/RadioTile.svelte";
import type { ComponentProps } from "svelte";
import { user } from "../setup-tests";
import RadioTileGroup from "./RadioTile.group.test.svelte";
import RadioTileSingle from "./RadioTile.single.test.svelte";
import RadioTile from "./RadioTile.test.svelte";
import RadioTileCustom from "./RadioTileCustom.test.svelte";

describe("RadioTile", () => {
  it("should render with default props", () => {
    render(RadioTile);

    const input = screen.getByRole("radio");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("name", "test-group");
    expect(input).toHaveAttribute("value", "test");
    expect(input).not.toBeChecked();
    expect(screen.getByText("Test content")).toBeInTheDocument();
    expect(screen.getByTitle("Tile checkmark")).toBeInTheDocument();
  });

  it("should handle checked state", () => {
    render(RadioTile, {
      props: { checked: true },
    });

    const input = screen.getByRole("radio");
    expect(input).toBeChecked();
    expect(screen.getByText("Test content").closest(".bx--tile")).toHaveClass(
      "bx--tile--is-selected",
    );
  });

  it("should handle light variant", () => {
    render(RadioTile, {
      props: { light: true },
    });

    expect(screen.getByText("Test content").closest(".bx--tile")).toHaveClass(
      "bx--tile--light",
    );
  });

  it("should handle disabled state", () => {
    render(RadioTile, {
      props: { disabled: true },
    });

    const input = screen.getByRole("radio");
    expect(input).toBeDisabled();
    expect(screen.getByText("Test content").closest(".bx--tile")).toHaveClass(
      "bx--tile--disabled",
    );
  });

  it("should handle required state", () => {
    render(RadioTile, {
      props: { required: true },
    });

    expect(screen.getByRole("radio")).toHaveAttribute("required");
  });

  it("should handle custom value", () => {
    render(RadioTile, {
      props: { value: "custom-value" },
    });

    expect(screen.getByRole("radio")).toHaveAttribute("value", "custom-value");
  });

  it("should handle custom tabindex", () => {
    render(RadioTile, {
      props: { tabindex: "1" },
    });

    expect(screen.getByRole("radio")).toHaveAttribute("tabindex", "1");
  });

  it("should handle custom icon description", () => {
    render(RadioTile, {
      props: { iconDescription: "Custom checkmark" },
    });

    expect(screen.getByTitle("Custom checkmark")).toBeInTheDocument();
  });

  it("should handle custom id", () => {
    render(RadioTile, { props: { id: "custom-id" } });

    expect(screen.getByRole("radio")).toHaveAttribute("id", "custom-id");

    const radioTileLabel = screen.getByText("Test content").closest("label");
    assert(radioTileLabel);
    expect(radioTileLabel).toHaveAttribute("for", "custom-id");
  });

  it("should handle custom name", () => {
    render(RadioTileSingle);

    expect(screen.getByRole("radio")).toHaveAttribute("name", "custom-name");
  });

  it("should handle custom slots", () => {
    render(RadioTileCustom);

    expect(screen.getByText("Custom content")).toBeInTheDocument();
  });

  it("should handle change event", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(RadioTile);

    const input = screen.getByRole("radio");
    await user.click(input);

    expect(input).toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith("change");
  });

  it("should handle keyboard events", async () => {
    render(RadioTileGroup);

    const inputs = screen.getAllByRole("radio");

    expect(inputs[1]).not.toHaveFocus();
    expect(inputs[1]).toBeChecked();

    await user.tab();
    expect(inputs[1]).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(inputs[2]).toHaveFocus();
    expect(inputs[2]).toBeChecked();

    await user.keyboard("{ArrowDown}");
    expect(inputs[0]).toHaveFocus();
    expect(inputs[0]).toBeChecked();
  });

  it("supports programmatic selection", async () => {
    render(RadioTileGroup);

    const inputs = screen.getAllByRole("radio");
    expect(inputs[1]).not.toHaveFocus();
    expect(inputs[1]).toBeChecked();
    expect(screen.getByText(/Selected: Standard plan/)).toBeInTheDocument();

    await user.click(inputs[2]);
    expect(inputs[2]).toHaveFocus();
    expect(inputs[2]).toBeChecked();
    expect(screen.getByText(/Selected: Plus plan/)).toBeInTheDocument();

    await user.click(screen.getByRole("button"));
    expect(inputs[1]).not.toHaveFocus();
    expect(inputs[1]).toBeChecked();
    expect(screen.getByText(/Selected: Standard plan/)).toBeInTheDocument();
  });

  it("should handle disabled state with events", async () => {
    render(RadioTile, {
      props: { disabled: true },
    });

    const input = screen.getByRole("radio");
    await user.click(input);
    expect(input).not.toBeChecked();
  });

  it("should handle mouse events", async () => {
    render(RadioTile);

    const tile = screen.getByText("Test content").closest(".bx--tile");
    assert(tile);
    await user.hover(tile);
    await user.unhover(tile);
  });

  it("should handle custom content slot", () => {
    render(RadioTileCustom);

    const content = screen.getByText("Custom content");
    expect(content).toBeInTheDocument();
    expect(content.tagName).toBe("DIV");
  });

  it("should handle TileGroup context", () => {
    render(RadioTile, { props: { checked: true } });

    const input = screen.getByRole("radio");
    expect(input).toBeChecked();
    expect(screen.getByText("Test content").closest(".bx--tile")).toHaveClass(
      "bx--tile--is-selected",
    );
    expect(input).toHaveAttribute("name", "test-group");
  });

  describe("Generics", () => {
    it("should support custom string literal types with generics", () => {
      type CustomValue = "option1" | "option2" | "option3";

      type ComponentType = RadioTileComponent<CustomValue>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["value"]>().toEqualTypeOf<CustomValue | undefined>();
    });

    it("should default to string when generic is not specified", () => {
      type ComponentType = RadioTileComponent;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["value"]>().toEqualTypeOf<string | undefined>();
    });
  });
});
