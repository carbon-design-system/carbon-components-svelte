import { render, screen } from "@testing-library/svelte";
import type RadioTileComponent from "carbon-components-svelte/Tile/RadioTile.svelte";
import { type ComponentProps, tick } from "svelte";
import RadioTileStandalone from "../Tile/RadioTileStandalone.test.svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { flushMacrotask } from "../utils/flush-macrotask";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import RadioTileChecked from "./RadioTile.checked.test.svelte";
import RadioTileGroup from "./RadioTile.group.test.svelte";
import RadioTileGroupEach from "./RadioTile.group-each.test.svelte";
import RadioTileGroupValue from "./RadioTile.group-value.test.svelte";
import RadioTileKeyboard from "./RadioTile.keyboard.test.svelte";
import RadioTileRef from "./RadioTile.ref.test.svelte";
import RadioTileSingle from "./RadioTile.single.test.svelte";
import RadioTileStandaloneGroup from "./RadioTile.standalone.test.svelte";
import RadioTileStandaloneEach from "./RadioTile.standalone-each.test.svelte";
import RadioTile from "./RadioTile.test.svelte";
import RadioTileAria from "./RadioTileAria.test.svelte";
import RadioTileCustom from "./RadioTileCustom.test.svelte";

describe("RadioTile", () => {
  describe("value changes in a TileGroup", () => {
    it("carries the selection to the checked tile's new value", async () => {
      const onSelect = vi.fn();
      const { component } = render(RadioTileGroupValue, {
        props: { onSelect },
      });
      await user.click(screen.getByText("Standard"));
      onSelect.mockClear();

      component.standardValue = "standard-v2";
      await tick();

      expect(component.selected).toBe("standard-v2");
      expect(screen.getByRole("radio", { name: "Standard" })).toBeChecked();
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("leaves the selection alone when an unchecked tile's value changes", async () => {
      const { component } = render(RadioTileGroupValue);
      await user.click(screen.getByText("Lite"));

      component.standardValue = "standard-v2";
      await tick();

      expect(component.selected).toBe("lite");
      expect(screen.getByRole("radio", { name: "Lite" })).toBeChecked();
    });
  });

  it("does not throw when rendered outside a TileGroup", () => {
    expect(() => render(RadioTileStandalone)).not.toThrow();
  });

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

  it("should handle checked state in TileGroup context", () => {
    render(RadioTile, {
      props: { checked: true },
    });

    const input = screen.getByRole("radio");
    expect(input).toBeChecked();
    expect(input).toHaveAttribute("name", "test-group");
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

  it("hides the checkmark icon from assistive technology", () => {
    render(RadioTile);

    const checkmark = screen
      .getByText("Test content")
      .closest(".bx--tile")
      ?.querySelector(".bx--tile__checkmark");
    expect(checkmark).toHaveAttribute("aria-hidden", "true");
    expect(
      screen.getByRole("radio", { name: "Test content" }),
    ).toBeInTheDocument();
  });

  it("should handle custom id", () => {
    render(RadioTile, { props: { id: "custom-id" } });

    expect(screen.getByRole("radio")).toHaveAttribute("id", "custom-id");

    const radioTileLabel = screen.getByText("Test content").closest("label");
    assert(radioTileLabel);
    expect(radioTileLabel).toHaveAttribute("for", "custom-id");
  });

  it("exposes a reference to the input element", () => {
    const { component } = render(RadioTileRef);

    expect(component.ref).toBeInstanceOf(HTMLInputElement);
    expect(component.ref).toBe(screen.getByRole("radio"));
  });

  it("should handle custom name", () => {
    render(RadioTileSingle);

    expect(screen.getByRole("radio")).toHaveAttribute("name", "custom-name");
  });

  it("should handle custom content slot", () => {
    render(RadioTileCustom);

    const content = screen.getByText("Custom content");
    expect(content).toBeInTheDocument();
    expect(content.tagName).toBe("DIV");
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

  describe("keyboard selection", () => {
    it("selects with Space through the native change", async () => {
      const onSelect = vi.fn();
      const onChange = vi.fn();
      render(RadioTileKeyboard, { props: { onSelect, onChange } });

      const [, radioB] = screen.getAllByRole("radio");
      radioB.focus();
      await user.keyboard(" ");

      expect(radioB).toBeChecked();
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect.mock.calls[0][0].detail).toBe("b");
      expect(screen.getByTestId("bound")).toHaveTextContent("b");
    });

    it("selects with Enter without submitting the form", async () => {
      const onSelect = vi.fn();
      const onChange = vi.fn();
      const onSubmit = vi.fn();
      render(RadioTileKeyboard, { props: { onSelect, onChange, onSubmit } });

      const [, radioB] = screen.getAllByRole("radio");
      radioB.focus();
      await user.keyboard("{Enter}");

      expect(radioB).toBeChecked();
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("does not dispatch select for the already selected tile", async () => {
      const onSelect = vi.fn();
      const onChange = vi.fn();
      render(RadioTileKeyboard, { props: { onSelect, onChange } });

      const [radioA] = screen.getAllByRole("radio");
      radioA.focus();
      await user.keyboard(" ");
      await user.keyboard("{Enter}");
      await user.click(radioA);

      expect(radioA).toBeChecked();
      expect(onSelect).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
    });
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

  describe("standalone", () => {
    const isSelected = (radio: HTMLElement) =>
      radio.nextElementSibling?.classList.contains("bx--tile--is-selected");

    it("checks and styles a tile when clicked", async () => {
      const { component } = render(RadioTileStandaloneGroup);
      const solo = screen.getByRole("radio", { name: "Solo" });

      await user.click(solo);

      expect(solo).toBeChecked();
      expect(component.checkedSolo).toBe(true);
      expect(isSelected(solo)).toBe(true);
    });

    it("unchecks a tile when a sibling with the same name is clicked", async () => {
      const { component } = render(RadioTileStandaloneGroup);
      const radioA = screen.getByRole("radio", { name: "A" });
      const radioB = screen.getByRole("radio", { name: "B" });

      await user.click(radioA);
      await user.click(radioB);

      expect(component.checkedA).toBe(false);
      expect(isSelected(radioA)).toBe(false);
      expect(component.checkedB).toBe(true);
      expect(isSelected(radioB)).toBe(true);
    });

    it("unchecks a sibling when checked is set", async () => {
      const { component } = render(RadioTileStandaloneGroup, {
        props: { checkedA: true },
      });
      const radioA = screen.getByRole("radio", { name: "A" });
      const radioB = screen.getByRole("radio", { name: "B" });

      component.checkedB = true;
      await flushMacrotask();

      expect(component.checkedA).toBe(false);
      expect(isSelected(radioA)).toBe(false);
      expect(radioB).toBeChecked();
      expect(isSelected(radioB)).toBe(true);
    });

    it("keeps checked in sync when bound to array items", async () => {
      render(RadioTileStandaloneEach);
      const bound = screen.getByTestId("bound");

      await user.click(screen.getByRole("radio", { name: "annual" }));
      expect(bound).toHaveTextContent("[false,true]");

      await user.click(screen.getByRole("button", { name: "Pick monthly" }));
      expect(bound).toHaveTextContent("[true,false]");
      expect(screen.getByRole("radio", { name: "monthly" })).toBeChecked();
    });

    it("follows the form reset", async () => {
      const { component } = render(RadioTileStandaloneGroup, {
        props: { checkedA: true },
      });
      const radioA = screen.getByRole("radio", { name: "A" });
      expect(radioA).toBeChecked();

      getForm().reset();
      await flushFormReset();

      expect(radioA).not.toBeChecked();
      expect(component.checkedA).toBe(false);
      expect(isSelected(radioA)).toBe(false);
    });
  });

  describe("checked inside TileGroup", () => {
    const isSelected = (radio: HTMLElement) =>
      radio.nextElementSibling?.classList.contains("bx--tile--is-selected");

    it("selects the tile in the group when checked is set", async () => {
      const onSelect = vi.fn();
      const { component } = render(RadioTileChecked, { props: { onSelect } });
      const [radioA, radioB] = screen.getAllByRole("radio");

      component.checkedB = true;
      await flushMacrotask();

      expect(component.selected).toBe("b");
      expect(radioB).toBeChecked();
      expect(isSelected(radioB)).toBe(true);
      expect(radioA).not.toBeChecked();
      expect(isSelected(radioA)).toBe(false);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("clears the group selection when the selected tile is unchecked", async () => {
      const { component } = render(RadioTileChecked, {
        props: { selected: "b" },
      });
      const [radioA, radioB] = screen.getAllByRole("radio");
      expect(component.checkedB).toBe(true);

      component.checkedB = false;
      await flushMacrotask();

      expect(component.selected).toBeUndefined();
      expect(radioA).not.toBeChecked();
      expect(radioB).not.toBeChecked();
      expect(isSelected(radioB)).toBe(false);
    });

    it("keeps checked in sync when bound to array items", async () => {
      render(RadioTileGroupEach);
      const bound = screen.getByTestId("bound");
      expect(bound).toHaveTextContent("[true,false] monthly");

      await user.click(screen.getByRole("radio", { name: "monthly" }));
      await user.click(screen.getByRole("radio", { name: "annual" }));
      expect(bound).toHaveTextContent("[false,true] annual");

      await user.click(screen.getByRole("radio", { name: "monthly" }));
      await user.click(screen.getByRole("button", { name: "Pick annual" }));
      expect(bound).toHaveTextContent("[false,true] annual");
      expect(screen.getByRole("radio", { name: "annual" })).toBeChecked();
    });

    it("leaves another tile's selection alone when an unchecked tile stays unchecked", async () => {
      const { component } = render(RadioTileChecked);
      const [radioA] = screen.getAllByRole("radio");

      component.selected = "b";
      await flushMacrotask();
      component.selected = "a";
      await flushMacrotask();

      expect(component.checkedB).toBe(false);
      expect(component.selected).toBe("a");
      expect(radioA).toBeChecked();
    });
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

  describe("aria attributes", () => {
    it("should apply aria-describedby to the input element, not the label", () => {
      render(RadioTileAria, { ariaDescribedBy: "description-id" });

      const input = screen.getByRole("radio");
      expect(input).toHaveAttribute("aria-describedby", "description-id");

      const label = input.nextElementSibling;
      assert(label instanceof HTMLLabelElement);
      expect(label.tagName).toBe("LABEL");
      expect(label).not.toHaveAttribute("aria-describedby");
    });

    it("should apply aria-labelledby to the input element, not the label", () => {
      render(RadioTileAria, { ariaLabelledBy: "label-id" });

      const input = screen.getByRole("radio");
      expect(input).toHaveAttribute("aria-labelledby", "label-id");

      const label = input.nextElementSibling;
      assert(label instanceof HTMLLabelElement);
      expect(label.tagName).toBe("LABEL");
      expect(label).not.toHaveAttribute("aria-labelledby");
    });

    it("should apply both aria-describedby and aria-labelledby to the input element", () => {
      render(RadioTileAria, {
        ariaDescribedBy: "description-id",
        ariaLabelledBy: "label-id",
      });

      const input = screen.getByRole("radio");
      expect(input).toHaveAttribute("aria-describedby", "description-id");
      expect(input).toHaveAttribute("aria-labelledby", "label-id");

      const label = input.nextElementSibling;
      assert(label instanceof HTMLLabelElement);
      expect(label.tagName).toBe("LABEL");
      expect(label).not.toHaveAttribute("aria-describedby");
      expect(label).not.toHaveAttribute("aria-labelledby");
    });
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
