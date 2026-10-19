import { render, screen } from "@testing-library/svelte";
import type TileGroupComponent from "carbon-components-svelte/Tile/TileGroup.svelte";
import type { ComponentEvents, ComponentProps } from "svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import TileGroupSlot from "./TileGroup.slot.test.svelte";
import TileGroup from "./TileGroup.test.svelte";
import TileGroupTileNames from "./TileGroup.tileNames.test.svelte";
import TileGroupTwoGroups from "./TileGroup.twoGroups.test.svelte";

describe("TileGroup", () => {
  it("should render with default props", () => {
    render(TileGroup);

    const fieldset = screen.getByRole("group");
    expect(fieldset).toHaveClass("bx--tile-group");
    expect(fieldset).not.toBeDisabled();

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
  });

  it("should render with legend", () => {
    render(TileGroup, { props: { legendText: "Select an option" } });

    expect(screen.getByText("Select an option")).toBeInTheDocument();
    expect(screen.getByText("Select an option")).toHaveClass("bx--label");
  });

  it("hides the legend visually", () => {
    render(TileGroup, { props: { legendText: "Legend", hideLegend: true } });

    expect(screen.getByText("Legend")).toHaveClass("bx--visually-hidden");
    expect(screen.getByRole("group", { name: "Legend" })).toBeInTheDocument();
  });

  it("should render legendChildren slot", () => {
    render(TileGroupSlot);

    expect(screen.getByText("Custom legend content")).toBeInTheDocument();
  });

  it("should handle disabled state", () => {
    render(TileGroup, { props: { disabled: true } });

    const fieldset = screen.getByRole("group");
    expect(fieldset).toBeDisabled();

    // Native `<fieldset disabled>` propagates to nested inputs; individual
    // tiles should not carry their own `disabled` attribute.
    const radios = screen.getAllByRole("radio");
    for (const radio of radios) {
      expect(radio).toBeDisabled();
      expect(radio).not.toHaveAttribute("disabled");
    }
  });

  it("styles every tile as disabled when the group is disabled", async () => {
    const { component } = render(TileGroup, { props: { disabled: true } });

    const radios = screen.getAllByRole("radio");
    for (const radio of radios) {
      expect(radio.nextElementSibling).toHaveClass("bx--tile--disabled");
      expect(radio).not.toHaveAttribute("tabindex");
    }

    component.disabled = false;
    await flushMacrotask();

    for (const radio of radios) {
      expect(radio.nextElementSibling).not.toHaveClass("bx--tile--disabled");
      expect(radio).toHaveAttribute("tabindex", "0");
    }
  });

  it("should handle required state", () => {
    render(TileGroup, { props: { required: true } });

    const radios = screen.getAllByRole("radio");
    for (const radio of radios) {
      expect(radio).toBeRequired();
    }
  });

  it("shares a generated name when name is omitted", () => {
    render(TileGroup);

    const names = screen
      .getAllByRole("radio")
      .map((radio) => radio.getAttribute("name"));
    expect(names[0]).toBeTruthy();
    expect(new Set(names).size).toBe(1);
  });

  it("shares a generated name when name is empty", () => {
    render(TileGroup, { props: { name: "" } });

    const names = screen
      .getAllByRole("radio")
      .map((radio) => radio.getAttribute("name"));
    expect(names[0]).toBeTruthy();
    expect(new Set(names).size).toBe(1);
  });

  it("keeps the tiles' own name when the group has none", () => {
    render(TileGroupTileNames);

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toHaveAttribute("name", "plan");
    }
    const form = getForm();
    expect([...new FormData(form)]).toEqual([["plan", "pro"]]);
  });

  it("lets the group name override the tiles' own name", () => {
    render(TileGroupTileNames, { props: { groupName: "tier" } });

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toHaveAttribute("name", "tier");
    }
  });

  it("applies a group name set after mount to every tile", async () => {
    const { rerender } = render(TileGroup, { props: { name: "tier" } });

    await rerender({ name: "plan" });

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toHaveAttribute("name", "plan");
    }
  });

  it("associates every tile with a form set after mount", async () => {
    const { rerender } = render(TileGroup);

    await rerender({ form: "outer-form" });

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toHaveAttribute("form", "outer-form");
    }
  });

  it("requires every tile once required is set after mount", async () => {
    const { rerender } = render(TileGroup);

    await rerender({ required: true });

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toBeRequired();
    }
  });

  it("generates a different name per group", () => {
    render(TileGroupTwoGroups);

    const [a, b, c, d] = screen
      .getAllByRole("radio")
      .map((radio) => radio.getAttribute("name"));
    expect(a).toBe(b);
    expect(c).toBe(d);
    expect(a).not.toBe(c);
  });

  it("should handle initial selected value", () => {
    render(TileGroup, { props: { selected: "option2" } });

    const radios = screen.getAllByRole("radio");
    expect(radios[0]).not.toBeChecked();
    expect(radios[1]).toBeChecked();
    expect(radios[2]).not.toBeChecked();
  });

  it("should handle select event", async () => {
    const onSelect = vi.fn();
    render(TileGroup, { props: { onSelect } });

    const radios = screen.getAllByRole("radio");
    await user.click(radios[1]);

    expect(onSelect).toHaveBeenCalledWith("option2");
    expect(radios[1]).toBeChecked();
  });

  it("should update selected value on radio change", async () => {
    const { component } = render(TileGroup);

    const radios = screen.getAllByRole("radio");

    await user.click(radios[0]);
    expect(component.selected).toBe("option1");

    await user.click(radios[2]);
    expect(component.selected).toBe("option3");
  });

  it("should handle programmatic selected value changes", async () => {
    const { component } = render(TileGroup);

    component.selected = "option2";
    await flushMacrotask();

    const radios = screen.getAllByRole("radio");
    expect(radios[1]).toBeChecked();

    component.selected = "option3";
    await flushMacrotask();

    expect(radios[2]).toBeChecked();
  });

  it("should not dispatch select event on initial render", () => {
    const onSelect = vi.fn();
    render(TileGroup, { props: { selected: "option1", onSelect } });

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("should handle keyboard navigation", async () => {
    render(TileGroup);

    const radios = screen.getAllByRole("radio");

    await user.tab();
    expect(radios[0]).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(radios[1]).toHaveFocus();
    expect(radios[1]).toBeChecked();

    await user.keyboard("{ArrowDown}");
    expect(radios[2]).toHaveFocus();
    expect(radios[2]).toBeChecked();

    await user.keyboard("{ArrowDown}");
    expect(radios[0]).toHaveFocus();
    expect(radios[0]).toBeChecked();
  });

  it("should handle arrow up navigation", async () => {
    render(TileGroup);

    const radios = screen.getAllByRole("radio");

    await user.tab();
    expect(radios[0]).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(radios[2]).toHaveFocus();
    expect(radios[2]).toBeChecked();
  });

  it("should render without legend when not provided", () => {
    const { container } = render(TileGroup);

    // `queryByRole("legend")` finds nothing even when a legend renders.
    expect(container.querySelector("legend")).not.toBeInTheDocument();
  });

  describe("Generics", () => {
    it("should support custom string literal types with generics", () => {
      type CustomValue = "option1" | "option2" | "option3";

      type ComponentType = TileGroupComponent<CustomValue>;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      expectTypeOf<Props["selected"]>().toEqualTypeOf<
        CustomValue | undefined
      >();

      type SelectEvent = Events["select"];
      type SelectEventDetail =
        SelectEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<SelectEventDetail>().toEqualTypeOf<CustomValue>();
    });

    it("should default to string type when generic is not specified", () => {
      type ComponentType = TileGroupComponent;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      expectTypeOf<Props["selected"]>().toEqualTypeOf<string | undefined>();

      type SelectEvent = Events["select"];
      type SelectEventDetail =
        SelectEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<SelectEventDetail>().toEqualTypeOf<string>();
    });
  });
});
