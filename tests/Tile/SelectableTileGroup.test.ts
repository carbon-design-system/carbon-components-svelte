import { render, screen } from "@testing-library/svelte";
import type SelectableTileGroupComponent from "carbon-components-svelte/Tile/SelectableTileGroup.svelte";
import type { ComponentEvents, ComponentProps } from "svelte";
import { user } from "../setup-tests";
import SelectableTileGroup from "./SelectableTileGroup.test.svelte";

describe("SelectableTileGroup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with default props", () => {
    render(SelectableTileGroup);

    const fieldset = screen.getByRole("group");
    expect(fieldset).toHaveClass("bx--tile-group");
    expect(fieldset).not.toBeDisabled();

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);
  });

  it("should render with legend", () => {
    render(SelectableTileGroup, { props: { legendText: "Select options" } });

    expect(screen.getByText("Select options")).toBeInTheDocument();
    expect(screen.getByText("Select options")).toHaveClass("bx--label");
  });

  it("should handle disabled state", () => {
    render(SelectableTileGroup, { props: { disabled: true } });

    const fieldset = screen.getByRole("group");
    expect(fieldset).toBeDisabled();

    const checkboxes = screen.getAllByRole("checkbox");
    for (const checkbox of checkboxes) {
      expect(checkbox).toBeDisabled();
    }
  });

  it("should handle custom name", () => {
    render(SelectableTileGroup, { props: { name: "custom-group" } });

    const checkboxes = screen.getAllByRole("checkbox");
    for (const checkbox of checkboxes) {
      expect(checkbox).toHaveAttribute("name", "custom-group");
    }
  });

  it("should handle initial selected values", () => {
    render(SelectableTileGroup, {
      props: { selected: ["option1", "option3"] },
    });

    const checkboxes = screen.getAllByRole("checkbox");
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
    const { component } = render(SelectableTileGroup);

    component.selected = ["option2"];
    await new Promise((resolve) => setTimeout(resolve, 0));

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).not.toBeChecked();
    expect(checkboxes[1]).toBeChecked();
    expect(checkboxes[2]).not.toBeChecked();

    component.selected = ["option1", "option3"];
    await new Promise((resolve) => setTimeout(resolve, 0));

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
    render(SelectableTileGroup, { props: { selected: [] } });

    const checkboxes = screen.getAllByRole("checkbox");
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
      type SelectEventDetail = SelectEvent extends CustomEvent<infer T>
        ? T
        : never;
      expectTypeOf<SelectEventDetail>().toEqualTypeOf<CustomValue>();

      type DeselectEvent = Events["deselect"];
      type DeselectEventDetail = DeselectEvent extends CustomEvent<infer T>
        ? T
        : never;
      expectTypeOf<DeselectEventDetail>().toEqualTypeOf<CustomValue>();
    });

    it("should default to string type when generic is not specified", () => {
      type ComponentType = SelectableTileGroupComponent;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      expectTypeOf<Props["selected"]>().toEqualTypeOf<string[] | undefined>();

      type SelectEvent = Events["select"];
      type SelectEventDetail = SelectEvent extends CustomEvent<infer T>
        ? T
        : never;
      expectTypeOf<SelectEventDetail>().toEqualTypeOf<string>();

      type DeselectEvent = Events["deselect"];
      type DeselectEventDetail = DeselectEvent extends CustomEvent<infer T>
        ? T
        : never;
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
      type SelectEventDetail = SelectEvent extends CustomEvent<infer T>
        ? T
        : never;

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
      type SelectEventDetail = SelectEvent extends CustomEvent<infer T>
        ? T
        : never;
      expectTypeOf<SelectEventDetail>().toEqualTypeOf<InferredType>();

      type DeselectEvent = Events["deselect"];
      type DeselectEventDetail = DeselectEvent extends CustomEvent<infer T>
        ? T
        : never;
      expectTypeOf<DeselectEventDetail>().toEqualTypeOf<InferredType>();
    });
  });
});
