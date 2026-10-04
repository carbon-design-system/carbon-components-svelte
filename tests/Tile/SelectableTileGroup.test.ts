import { render, screen } from "@testing-library/svelte";
import type SelectableTileGroupComponent from "carbon-components-svelte/Tile/SelectableTileGroup.svelte";
import { type ComponentEvents, type ComponentProps, tick } from "svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
import { user } from "../utils/user";
import SelectableTileGroupSlot from "./SelectableTileGroup.slot.test.svelte";
import SelectableTileGroup from "./SelectableTileGroup.test.svelte";
import SelectableTileGroupDuplicate from "./SelectableTileGroupDuplicate.test.svelte";
import SelectableTileGroupNested from "./SelectableTileGroupNested.test.svelte";
import SelectableTileGroupNotify from "./SelectableTileGroupNotify.test.svelte";
import SelectableTileGroupRange from "./SelectableTileGroupRange.test.svelte";
import SelectableTileGroupReactive from "./SelectableTileGroupReactive.test.svelte";

describe("SelectableTileGroup", () => {
  it("should render with default props", () => {
    const { container } = render(SelectableTileGroup);

    const fieldset = screen.getByRole("group");
    expect(fieldset).toHaveClass("bx--tile-group");
    expect(fieldset).not.toBeDisabled();

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes).toHaveLength(3);
  });

  it("should render with legend", () => {
    render(SelectableTileGroup, { props: { legendText: "Select options" } });

    expect(screen.getByText("Select options")).toBeInTheDocument();
    expect(screen.getByText("Select options")).toHaveClass("bx--label");
  });

  it("should render legendChildren slot", () => {
    render(SelectableTileGroupSlot);

    expect(screen.getByText("Custom legend content")).toBeInTheDocument();
  });

  it("should hide legend visually", () => {
    render(SelectableTileGroup, {
      props: { legendText: "Legend", hideLegend: true },
    });

    const legend = screen.getByText("Legend");
    expect(legend).toHaveClass("bx--visually-hidden");
  });

  it("should handle disabled state", () => {
    const { container } = render(SelectableTileGroup, {
      props: { disabled: true },
    });

    const fieldset = screen.getByRole("group");
    expect(fieldset).toBeDisabled();

    // Native `<fieldset disabled>` propagates to nested inputs; individual
    // tiles should not carry their own `disabled` attribute.
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    for (const checkbox of checkboxes) {
      expect(checkbox).toBeDisabled();
      expect(checkbox).not.toHaveAttribute("disabled");
    }

    for (const tile of container.querySelectorAll(".bx--tile")) {
      expect(tile).toHaveClass("bx--tile--disabled");
    }
  });

  it("restores tile styling when the group is re-enabled", async () => {
    const { component, container } = render(SelectableTileGroup, {
      props: { disabled: true },
    });

    component.disabled = false;
    await tick();

    for (const tile of container.querySelectorAll(".bx--tile")) {
      expect(tile).not.toHaveClass("bx--tile--disabled");
    }
  });

  it("should handle custom name", () => {
    const { container } = render(SelectableTileGroup, {
      props: { name: "custom-group" },
    });

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    for (const checkbox of checkboxes) {
      expect(checkbox).toHaveAttribute("name", "custom-group");
    }
  });

  it("should handle initial selected values", () => {
    const { container } = render(SelectableTileGroup, {
      props: { selected: ["option1", "option3"] },
    });

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[2]).toBeChecked();
  });

  it("should handle select event", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(SelectableTileGroup);

    const tiles = screen.getAllByText(/Option/);
    await user.click(tiles[1]);

    expect(consoleLog).toHaveBeenCalledWith("select", "option2");
  });

  it("should handle deselect event", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(SelectableTileGroup, { props: { selected: ["option2"] } });

    const tiles = screen.getAllByText(/Option/);
    await user.click(tiles[1]);

    expect(consoleLog).toHaveBeenCalledWith("deselect", "option2");
  });

  describe("change event", () => {
    it("fires after select and deselect with every selected value", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(SelectableTileGroup, { props: { selected: ["option1"] } });
      const checkboxes = screen.getAllByRole("checkbox");

      await user.click(checkboxes[2]);
      expect(consoleLog.mock.calls).toEqual([
        ["select", "option3"],
        ["change", ["option1", "option3"]],
      ]);
      consoleLog.mockClear();

      await user.click(checkboxes[0]);
      expect(consoleLog.mock.calls).toEqual([
        ["deselect", "option1"],
        ["change", ["option3"]],
      ]);
    });

    it("does not fire when selected is set programmatically", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { component } = render(SelectableTileGroup);

      component.selected = ["option2"];
      await flushMacrotask();

      expect(consoleLog).not.toHaveBeenCalled();
    });
  });

  it("should update selected values on checkbox change", async () => {
    const { component } = render(SelectableTileGroup);

    const tiles = screen.getAllByText(/Option/);

    await user.click(tiles[0]);
    expect(component.selected).toContain("option1");

    await user.click(tiles[2]);
    expect(component.selected).toContain("option1");
    expect(component.selected).toContain("option3");

    await user.click(tiles[0]);
    expect(component.selected).not.toContain("option1");
    expect(component.selected).toContain("option3");
  });

  it("should allow multiple selections", async () => {
    const { component } = render(SelectableTileGroup);

    const tiles = screen.getAllByText(/Option/);

    await user.click(tiles[0]);
    await user.click(tiles[1]);
    await user.click(tiles[2]);

    expect(component.selected).toHaveLength(3);
    expect(component.selected).toContain("option1");
    expect(component.selected).toContain("option2");
    expect(component.selected).toContain("option3");
  });

  it("should apply custom class", () => {
    render(SelectableTileGroup, {
      props: { customClass: "custom-tile-group" },
    });

    const fieldset = screen.getByRole("group");
    expect(fieldset).toHaveClass("custom-tile-group");
  });

  it("should handle programmatic selected value changes", async () => {
    const { component, container } = render(SelectableTileGroup);

    component.selected = ["option2"];
    await flushMacrotask();

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes[0]).not.toBeChecked();
    expect(checkboxes[1]).toBeChecked();
    expect(checkboxes[2]).not.toBeChecked();

    component.selected = ["option1", "option3"];
    await flushMacrotask();

    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[2]).toBeChecked();
  });

  it("should not dispatch events on initial render", () => {
    const consoleLog = vi.spyOn(console, "log");
    render(SelectableTileGroup, { props: { selected: ["option1"] } });

    expect(consoleLog).not.toHaveBeenCalled();
  });

  it("should handle keyboard selection with Enter", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(SelectableTileGroup);

    await user.keyboard("{Tab}");
    await user.keyboard("{Enter}");
    expect(consoleLog).toHaveBeenCalledWith("select", "option1");
  });

  it("should handle keyboard selection with Space", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(SelectableTileGroup);

    await user.keyboard("{Tab}");
    await user.keyboard(" ");
    expect(consoleLog).toHaveBeenCalledWith("select", "option1");
  });

  it("should render without legend when not provided", () => {
    render(SelectableTileGroup);

    const legend = screen.queryByRole("legend");
    expect(legend).not.toBeInTheDocument();
  });

  it("should handle empty selected array", () => {
    const { container } = render(SelectableTileGroup, {
      props: { selected: [] },
    });

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    for (const checkbox of checkboxes) {
      expect(checkbox).not.toBeChecked();
    }
  });

  it("should handle clearing all selections", async () => {
    const { component } = render(SelectableTileGroup, {
      props: { selected: ["option1", "option2", "option3"] },
    });

    const tiles = screen.getAllByText(/Option/);

    await user.click(tiles[0]);
    await user.click(tiles[1]);
    await user.click(tiles[2]);

    expect(component.selected).toHaveLength(0);
  });

  it("should re-register with group when tile value changes after mount", async () => {
    const { component } = render(SelectableTileGroupReactive, {
      props: { tileValue: "a", tileSelected: true },
    });

    await tick();
    expect(component.groupSelected).toEqual(["a"]);

    component.tileValue = "b";
    await tick();

    expect(component.groupSelected).toEqual(["b"]);
  });

  describe("store notifications", () => {
    it("notifies tiles once per toggle", async () => {
      const onNotify = vi.fn();
      render(SelectableTileGroupNotify, { props: { onNotify } });
      await tick();
      onNotify.mockClear();

      await user.click(screen.getAllByRole("checkbox")[0]);
      await tick();

      expect(onNotify).toHaveBeenCalledTimes(1);
    });

    it("notifies tiles once when selected is set programmatically", async () => {
      const onNotify = vi.fn();
      const { component } = render(SelectableTileGroupNotify, {
        props: { onNotify },
      });
      await tick();
      onNotify.mockClear();

      component.selected = ["b"];
      await tick();

      expect(onNotify).toHaveBeenCalledTimes(1);
      expect(screen.getAllByRole("checkbox")[1]).toBeChecked();
    });
  });

  describe("duplicate values", () => {
    it("warns once when two tiles share a value", async () => {
      const consoleWarn = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      render(SelectableTileGroupDuplicate, {
        props: { values: ["a", "a", "a"] },
      });
      await tick();

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn.mock.calls[0][0]).toContain('share the value "a"');
    });

    it("does not warn for unique values, including while tiles swap values", async () => {
      const consoleWarn = vi.spyOn(console, "warn");
      const { component } = render(SelectableTileGroupDuplicate);
      await tick();

      // Non-keyed `{#each}`: the first tile takes "b" before the second
      // gives it up.
      component.values = ["b", "c"];
      await tick();

      expect(consoleWarn).not.toHaveBeenCalled();
    });

    it("releases a value when its tile unmounts", async () => {
      const consoleWarn = vi.spyOn(console, "warn");
      const { component } = render(SelectableTileGroupDuplicate);
      await tick();

      component.values = ["a"];
      await tick();
      component.values = ["a", "b"];
      await tick();

      expect(consoleWarn).not.toHaveBeenCalled();
    });
  });

  describe("shift+click range selection", () => {
    it("selects, then deselects, a range between the anchor and the shift-clicked tile", async () => {
      render(SelectableTileGroup);
      const checkboxes = screen.getAllByRole("checkbox");

      await user.click(checkboxes[0]);

      await user.keyboard("{Shift>}");
      await user.click(checkboxes[2]);
      await user.keyboard("{/Shift}");

      // Every tile between the anchor and the shift-clicked tile is selected.
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).toBeChecked();
      expect(checkboxes[2]).toBeChecked();

      // Shift+click the middle tile: the anchor is now the last-toggled
      // tile (index 2), so this deselects the range back to it.
      await user.keyboard("{Shift>}");
      await user.click(checkboxes[1]);
      await user.keyboard("{/Shift}");

      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
      expect(checkboxes[2]).not.toBeChecked();
    });

    it("dispatches select and deselect for every tile the range changes", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(SelectableTileGroup);
      const checkboxes = screen.getAllByRole("checkbox");

      await user.click(checkboxes[0]);
      consoleLog.mockClear();

      await user.keyboard("{Shift>}");
      await user.click(checkboxes[2]);
      await user.keyboard("{/Shift}");

      // option1 was already selected, so only the newly selected tiles fire.
      expect(consoleLog.mock.calls).toEqual([
        ["select", "option2"],
        ["select", "option3"],
        ["change", ["option1", "option2", "option3"]],
      ]);
      consoleLog.mockClear();

      await user.click(checkboxes[0]);
      consoleLog.mockClear();
      await user.keyboard("{Shift>}");
      await user.click(checkboxes[2]);
      await user.keyboard("{/Shift}");

      expect(consoleLog.mock.calls).toEqual([
        ["deselect", "option2"],
        ["deselect", "option3"],
        ["change", []],
      ]);
    });

    it("leaves tiles of a nested group out of the range", async () => {
      const { component } = render(SelectableTileGroupNested);
      const checkboxes = screen.getAllByRole("checkbox");

      await user.click(checkboxes[0]);
      await user.keyboard("{Shift>}");
      await user.click(checkboxes[2]);
      await user.keyboard("{/Shift}");

      expect(component.outer).toEqual(["outer-1", "outer-2"]);
      expect(component.inner).toEqual([]);
      expect(checkboxes[1]).not.toBeChecked();
    });

    it("falls back to a single toggle when there is no prior anchor", async () => {
      render(SelectableTileGroup);
      const checkboxes = screen.getAllByRole("checkbox");

      await user.keyboard("{Shift>}");
      await user.click(checkboxes[2]);
      await user.keyboard("{/Shift}");

      expect(checkboxes[0]).not.toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
      expect(checkboxes[2]).toBeChecked();
    });

    it("skips disabled tiles within the range", async () => {
      const { component } = render(SelectableTileGroupRange);
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes[2]).toBeDisabled();

      await user.click(checkboxes[0]);
      await user.keyboard("{Shift>}");
      await user.click(checkboxes[3]);
      await user.keyboard("{/Shift}");

      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).toBeChecked();
      expect(checkboxes[2]).not.toBeChecked();
      expect(checkboxes[3]).toBeChecked();
      expect(component.selected).not.toContain("option3");
    });

    it("supports range selection from the keyboard with Shift+Enter and Shift+Space", async () => {
      render(SelectableTileGroup);
      const checkboxes = screen.getAllByRole("checkbox");

      checkboxes[0].focus();
      await user.keyboard("{Enter}");

      checkboxes[1].focus();
      await user.keyboard("{Shift>}{Enter}{/Shift}");

      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).toBeChecked();

      checkboxes[2].focus();
      await user.keyboard("{Shift>} {/Shift}");

      // Anchor is now checkboxes[1] (the last tile toggled); Space extends
      // the range to checkboxes[2].
      expect(checkboxes[2]).toBeChecked();
    });
  });

  describe("Generics", () => {
    it("should support custom string literal types with generics", () => {
      type CustomValue = "option1" | "option2" | "option3";

      const selectedValues: CustomValue[] = ["option1", "option2"];

      expectTypeOf<typeof selectedValues>().toEqualTypeOf<CustomValue[]>();

      type ComponentType = SelectableTileGroupComponent<CustomValue>;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      expectTypeOf<Props["selected"]>().toEqualTypeOf<
        CustomValue[] | undefined
      >();

      type SelectEvent = Events["select"];
      type SelectEventDetail =
        SelectEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<SelectEventDetail>().toEqualTypeOf<CustomValue>();

      type DeselectEvent = Events["deselect"];
      type DeselectEventDetail =
        DeselectEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<DeselectEventDetail>().toEqualTypeOf<CustomValue>();

      type ChangeEvent = Events["change"];
      type ChangeEventDetail =
        ChangeEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<ChangeEventDetail>().toEqualTypeOf<CustomValue[]>();
    });

    it("should default to string type when generic is not specified", () => {
      type ComponentType = SelectableTileGroupComponent;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      expectTypeOf<Props["selected"]>().toEqualTypeOf<string[] | undefined>();

      type SelectEvent = Events["select"];
      type SelectEventDetail =
        SelectEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<SelectEventDetail>().toEqualTypeOf<string>();

      type DeselectEvent = Events["deselect"];
      type DeselectEventDetail =
        DeselectEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<DeselectEventDetail>().toEqualTypeOf<string>();
    });

    it("should provide type-safe access to custom string literal types in event handlers", () => {
      type Status = "pending" | "approved" | "rejected";

      const handleSelect = (value: Status) => {
        expectTypeOf(value).toEqualTypeOf<Status>();
        if (value === "pending") {
          expectTypeOf(value).toEqualTypeOf<"pending">();
        }
      };

      expectTypeOf(handleSelect).parameter(0).toEqualTypeOf<Status>();

      type ComponentType = SelectableTileGroupComponent<Status>;
      type Events = ComponentEvents<ComponentType>;
      type SelectEvent = Events["select"];
      type SelectEventDetail =
        SelectEvent extends CustomEvent<infer T> ? T : never;

      expectTypeOf<SelectEventDetail>().toEqualTypeOf<
        Parameters<typeof handleSelect>[0]
      >();
    });

    it("should enforce string constraint on generic type", () => {
      type ValidStringLiteral = "a" | "b" | "c";
      type ComponentType = SelectableTileGroupComponent<ValidStringLiteral>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["selected"]>().toEqualTypeOf<
        ValidStringLiteral[] | undefined
      >();

      type StringComponentType = SelectableTileGroupComponent<string>;
      type StringProps = ComponentProps<StringComponentType>;
      expectTypeOf<StringProps["selected"]>().toEqualTypeOf<
        string[] | undefined
      >();
    });

    it("should work with 'as const' for type inference", () => {
      const selectedValues = ["option1", "option2", "option3"] as const;
      type InferredType = (typeof selectedValues)[number];

      expectTypeOf<typeof selectedValues>().toEqualTypeOf<
        readonly ["option1", "option2", "option3"]
      >();
      expectTypeOf<InferredType>().toEqualTypeOf<
        "option1" | "option2" | "option3"
      >();

      type ComponentType = SelectableTileGroupComponent<InferredType>;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      expectTypeOf<Props["selected"]>().toEqualTypeOf<
        InferredType[] | undefined
      >();

      type SelectEvent = Events["select"];
      type SelectEventDetail =
        SelectEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<SelectEventDetail>().toEqualTypeOf<InferredType>();

      type DeselectEvent = Events["deselect"];
      type DeselectEventDetail =
        DeselectEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<DeselectEventDetail>().toEqualTypeOf<InferredType>();
    });
  });
});
