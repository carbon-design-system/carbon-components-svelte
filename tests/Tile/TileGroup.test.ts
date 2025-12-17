import { render, screen } from "@testing-library/svelte";
import type TileGroupComponent from "carbon-components-svelte/Tile/TileGroup.svelte";
import type { ComponentEvents, ComponentProps } from "svelte";
import { user } from "../setup-tests";
import TileGroup from "./TileGroup.test.svelte";

describe("TileGroup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it("should handle disabled state", () => {
    render(TileGroup, { props: { disabled: true } });

    const fieldset = screen.getByRole("group");
    expect(fieldset).toBeDisabled();

    const radios = screen.getAllByRole("radio");
    for (const radio of radios) {
      expect(radio).toBeDisabled();
    }
  });

  it("should handle required state", () => {
    render(TileGroup, { props: { required: true } });

    const radios = screen.getAllByRole("radio");
    for (const radio of radios) {
      expect(radio).toBeRequired();
    }
  });

  it("should handle custom name", () => {
    render(TileGroup, { props: { name: "custom-group" } });

    const radios = screen.getAllByRole("radio");
    for (const radio of radios) {
      expect(radio).toHaveAttribute("name", "custom-group");
    }
  });

  it("should handle initial selected value", () => {
    render(TileGroup, { props: { selected: "option2" } });

    const radios = screen.getAllByRole("radio");
    expect(radios[0]).not.toBeChecked();
    expect(radios[1]).toBeChecked();
    expect(radios[2]).not.toBeChecked();
  });

  it("should handle select event", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(TileGroup);

    const radios = screen.getAllByRole("radio");
    await user.click(radios[1]);

    expect(consoleLog).toHaveBeenCalledWith("select", "option2");
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

  it("should apply custom class", () => {
    render(TileGroup, { props: { customClass: "custom-tile-group" } });

    const fieldset = screen.getByRole("group");
    expect(fieldset).toHaveClass("custom-tile-group");
  });

  it("should handle programmatic selected value changes", async () => {
    const { component } = render(TileGroup);

    component.selected = "option2";
    await new Promise((resolve) => setTimeout(resolve, 0));

    const radios = screen.getAllByRole("radio");
    expect(radios[1]).toBeChecked();

    component.selected = "option3";
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(radios[2]).toBeChecked();
  });

  it("should not dispatch select event on initial render", () => {
    const consoleLog = vi.spyOn(console, "log");
    render(TileGroup, { props: { selected: "option1" } });

    expect(consoleLog).not.toHaveBeenCalled();
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
    render(TileGroup);

    const legend = screen.queryByRole("legend");
    expect(legend).not.toBeInTheDocument();
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

    it("should provide type-safe access to custom string literal types in event handlers", () => {
      type Status = "pending" | "approved" | "rejected";

      const handleSelect = (value: Status) => {
        expectTypeOf(value).toEqualTypeOf<Status>();
        if (value === "pending") {
          expectTypeOf(value).toEqualTypeOf<"pending">();
        }
      };

      expectTypeOf(handleSelect).parameter(0).toEqualTypeOf<Status>();

      type ComponentType = TileGroupComponent<Status>;
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
      type ComponentType = TileGroupComponent<ValidStringLiteral>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["selected"]>().toEqualTypeOf<
        ValidStringLiteral | undefined
      >();

      type StringComponentType = TileGroupComponent<string>;
      type StringProps = ComponentProps<StringComponentType>;
      expectTypeOf<StringProps["selected"]>().toEqualTypeOf<
        string | undefined
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

      type ComponentType = TileGroupComponent<InferredType>;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      expectTypeOf<Props["selected"]>().toEqualTypeOf<
        InferredType | undefined
      >();

      type SelectEvent = Events["select"];
      type SelectEventDetail =
        SelectEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<SelectEventDetail>().toEqualTypeOf<InferredType>();
    });
  });
});
