import { fireEvent, render, screen } from "@testing-library/svelte";
import type RadioButtonGroupComponent from "carbon-components-svelte/RadioButtonGroup/RadioButtonGroup.svelte";
import { type ComponentEvents, type ComponentProps, tick } from "svelte";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import RadioButtonGroupButtonNames from "./RadioButtonGroup.buttonNames.test.svelte";
import RadioButtonGroup from "./RadioButtonGroup.test.svelte";

describe("RadioButtonGroup", () => {
  it("should render with default props", () => {
    render(RadioButtonGroup);

    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "aria-orientation",
      "horizontal",
    );
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("should handle selected value", () => {
    render(RadioButtonGroup, { props: { selected: "2" } });

    expect(screen.getByRole("radio", { name: "Option 2" })).toBeChecked();
  });

  // Regression: programmatic selected changes must dispatch change once
  it("dispatches change exactly once per programmatic selection", async () => {
    const onChange = vi.fn();
    const { component } = render(RadioButtonGroup, {
      props: { selected: "1", onChange },
    });

    component.selected = "2";
    await tick();
    component.selected = "3";
    await tick();

    expect(onChange.mock.calls).toEqual([["2"], ["3"]]);
  });

  it("should handle disabled state", () => {
    render(RadioButtonGroup, { props: { disabled: true } });

    expect(screen.getByRole("radiogroup")).toBeDisabled();

    // Native `<fieldset disabled>` propagates to nested inputs; individual
    // radio buttons should not carry their own `disabled` attribute.
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toBeDisabled();
      expect(radio).not.toHaveAttribute("disabled");
    }
  });

  it("should handle required state", () => {
    render(RadioButtonGroup, { props: { required: true } });

    const radios = screen.getAllByRole("radio");
    for (const radio of radios) {
      expect(radio).toBeRequired();
    }
  });

  it("should handle custom name", () => {
    render(RadioButtonGroup, { props: { name: "custom-group" } });

    const radios = screen.getAllByRole("radio");
    for (const radio of radios) {
      expect(radio).toHaveAttribute("name", "custom-group");
    }
  });

  it("should share a generated name when name is omitted", () => {
    render(RadioButtonGroup);

    const radios = screen.getAllByRole("radio");
    const names = radios.map((radio) => radio.getAttribute("name"));

    expect(names[0]).toBeTruthy();
    expect(new Set(names).size).toBe(1);
  });

  it("should keep the buttons' own name when the group has none", () => {
    render(RadioButtonGroupButtonNames);

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toHaveAttribute("name", "plan");
    }
    const form = getForm();
    expect([...new FormData(form)]).toEqual([["plan", "pro"]]);
  });

  it("should let the group name override the buttons' own name", () => {
    render(RadioButtonGroupButtonNames, { props: { groupName: "tier" } });

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toHaveAttribute("name", "tier");
    }
  });

  it("should move selection on arrow keys when name is omitted", async () => {
    render(RadioButtonGroup);

    const radio1 = screen.getByRole("radio", { name: "Option 1" });
    const radio2 = screen.getByRole("radio", { name: "Option 2" });

    await user.click(radio1);
    await user.keyboard("{ArrowDown}");

    expect(radio2).toBeChecked();
  });

  it("should handle legend text", () => {
    render(RadioButtonGroup, { props: { legendText: "Choose an option" } });

    expect(
      screen.getByRole("radiogroup", { name: "Choose an option" }),
    ).toBeInTheDocument();
  });

  it("should hide legend visually", () => {
    render(RadioButtonGroup, {
      props: { legendText: "Legend", hideLegend: true },
    });

    const legend = screen.getByText("Legend");
    expect(legend).toHaveClass("bx--visually-hidden");
  });

  it.each([
    ["left", "bx--radio-button-group--label-left"],
    ["right", "bx--radio-button-group--label-right"],
  ] as const)("should handle label position %s", (labelPosition, className) => {
    render(RadioButtonGroup, { props: { labelPosition } });

    expect(screen.getByRole("radiogroup")).toHaveClass(className);
  });

  it("should handle vertical orientation", () => {
    render(RadioButtonGroup, { props: { orientation: "vertical" } });

    const fieldset = screen.getByRole("radiogroup");
    expect(fieldset).toHaveClass("bx--radio-button-group--vertical");
    expect(fieldset).toHaveAttribute("aria-orientation", "vertical");
  });

  it("should handle custom id", () => {
    render(RadioButtonGroup, {
      props: { id: "custom-id" },
    });

    const formItem = document.getElementById("custom-id");
    expect(formItem).toBeInTheDocument();
  });

  it("should handle legend slot", () => {
    render(RadioButtonGroup, { props: { useSlot: true } });

    expect(screen.getByText("Custom Legend")).toBeInTheDocument();
  });

  it("should apply custom class", () => {
    render(RadioButtonGroup, {
      props: { customClass: "custom-group" },
    });

    const fieldset = screen.getByRole("radiogroup");
    const formItem = fieldset.closest(".bx--form-item");
    assert(formItem);
    expect(formItem).toHaveClass("custom-group");
  });

  it("should propagate external selected updates to child radios", async () => {
    const { component } = render(RadioButtonGroup, {
      props: { selected: "1" },
    });

    expect(screen.getByRole("radio", { name: "Option 1" })).toBeChecked();

    component.selected = "3";
    await tick();

    expect(screen.getByRole("radio", { name: "Option 3" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Option 1" })).not.toBeChecked();
  });

  it("should check the clicked radio, dispatch change and update selected", async () => {
    const onChange = vi.fn();
    const { component } = render(RadioButtonGroup, { props: { onChange } });

    const radio2 = screen.getByRole("radio", { name: "Option 2" });
    await user.click(radio2);

    expect(radio2).toBeChecked();
    expect(onChange).toHaveBeenCalledWith("2");
    expect(component.selected).toBe("2");

    await user.click(screen.getByRole("radio", { name: "Option 3" }));

    expect(component.selected).toBe("3");
  });

  it("should render helper text when provided", () => {
    render(RadioButtonGroup, { props: { helperText: "Helper text message" } });
    const helperElement = screen.getByText("Helper text message");
    expect(helperElement).toHaveClass("bx--form__helper-text");
  });

  it("should not render helper text by default", () => {
    const { container } = render(RadioButtonGroup);

    expect(container.querySelector(".bx--form__helper-text")).toBeNull();
  });

  it("should associate helper text with each radio via aria-describedby", () => {
    render(RadioButtonGroup, {
      props: { id: "group-1", helperText: "Helper text message" },
    });

    const helperElement = screen.getByText("Helper text message");
    const helperId = helperElement.getAttribute("id");
    expect(helperId).toBe("helper-group-1");

    const radios = screen.getAllByRole("radio");
    expect(radios.length).toBeGreaterThan(0);
    for (const radio of radios) {
      expect(radio).toHaveAttribute("aria-describedby", helperId);
    }
  });

  describe("Validation", () => {
    it("should mark the radiogroup as invalid and describe each radio via the message", () => {
      render(RadioButtonGroup, {
        props: { invalid: true, invalidText: "Pick one" },
      });

      const message = screen.getByText("Pick one");

      const radiogroup = screen.getByRole("radiogroup");
      expect(radiogroup).toHaveAttribute("aria-invalid", "true");
      expect(radiogroup).not.toHaveAttribute("aria-describedby");

      for (const radio of screen.getAllByRole("radio")) {
        expect(radio).not.toHaveAttribute("aria-invalid");
        expect(radio).toHaveAttribute(
          "aria-describedby",
          message.getAttribute("id"),
        );
      }
    });

    it("should show warning message without marking the radiogroup as invalid", () => {
      render(RadioButtonGroup, {
        props: { warn: true, warnText: "Check the tier" },
      });

      expect(screen.getByText("Check the tier")).toBeInTheDocument();
      expect(screen.getByRole("radiogroup")).not.toHaveAttribute(
        "aria-invalid",
      );

      for (const radio of screen.getAllByRole("radio")) {
        expect(radio).not.toHaveAttribute("aria-invalid");
      }
    });

    it("should prioritize invalid over warn when both are set", () => {
      render(RadioButtonGroup, {
        props: {
          invalid: true,
          invalidText: "Pick one",
          warn: true,
          warnText: "Check the tier",
        },
      });

      expect(screen.getByText("Pick one")).toBeInTheDocument();
      expect(screen.queryByText("Check the tier")).not.toBeInTheDocument();
    });

    it("should not show the invalid message when disabled", () => {
      render(RadioButtonGroup, {
        props: { disabled: true, invalid: true, invalidText: "Pick one" },
      });

      expect(screen.queryByText("Pick one")).not.toBeInTheDocument();
    });
  });

  describe("readonly", () => {
    it("should apply readonly class on the fieldset", () => {
      const { container } = render(RadioButtonGroup, {
        props: { readonly: true },
      });

      expect(
        container.querySelector(".bx--radio-button-group--readonly"),
      ).toBeTruthy();
    });

    it("describes the group as read-only for screen readers that ignore aria-readonly", async () => {
      const { rerender } = render(RadioButtonGroup, {
        props: { id: "readonly-group", readonly: true },
      });

      const radiogroup = screen.getByRole("radiogroup");
      expect(radiogroup).toHaveAttribute(
        "aria-describedby",
        "readonly-readonly-group",
      );

      const description = document.getElementById("readonly-readonly-group");
      expect(description).toHaveTextContent("Read-only");
      expect(description).toHaveClass("bx--visually-hidden");

      // ARIA does not support aria-readonly on role "radio"; only the fieldset carries it.
      for (const radio of screen.getAllByRole("radio")) {
        expect(radio).not.toHaveAttribute("aria-readonly");
      }

      await rerender({ readonlyText: "Custom read-only text" });

      expect(description).toHaveTextContent("Custom read-only text");
    });

    it("leaves the read-only description to the fieldset, not the radios", () => {
      render(RadioButtonGroup, { props: { readonly: true } });

      for (const radio of screen.getAllByRole("radio")) {
        expect(radio).not.toHaveAttribute("aria-describedby");
        expect(radio.closest(".bx--radio-button-wrapper")).toHaveClass(
          "bx--radio-button-wrapper--readonly",
        );
      }
    });

    it("should not change selection when clicking another radio", async () => {
      render(RadioButtonGroup, { props: { selected: "1", readonly: true } });

      const radio2 = screen.getByRole("radio", { name: "Option 2" });
      await user.click(radio2);

      // jsdom doesn't restore the previously checked radio in a group after
      // a cancelled click the way real browsers do; covered by the e2e test.
      expect(radio2).not.toBeChecked();
    });

    it("should set aria-readonly on the radiogroup when readonly, and not on the radios", () => {
      render(RadioButtonGroup, { props: { selected: "1", readonly: true } });

      expect(screen.getByRole("radiogroup")).toHaveAttribute(
        "aria-readonly",
        "true",
      );

      for (const radio of screen.getAllByRole("radio")) {
        expect(radio).not.toHaveAttribute("aria-readonly");
      }
    });

    it("should update aria-readonly on the radiogroup when readonly flips after mount", async () => {
      const { rerender } = render(RadioButtonGroup, {
        props: { selected: "1", readonly: false },
      });

      expect(screen.getByRole("radiogroup")).not.toHaveAttribute(
        "aria-readonly",
      );

      await rerender({ selected: "1", readonly: true });

      expect(screen.getByRole("radiogroup")).toHaveAttribute(
        "aria-readonly",
        "true",
      );
    });

    it("should not forward a child RadioButton's on:change when the group is readonly", async () => {
      const onRadioChange = vi.fn();
      render(RadioButtonGroup, {
        props: { selected: "1", readonly: true, onRadioChange },
      });

      await fireEvent.change(screen.getByRole("radio", { name: "Option 2" }));

      expect(onRadioChange).not.toHaveBeenCalled();
    });

    it("should not change selection when readonly flips to true after mount", async () => {
      const { rerender } = render(RadioButtonGroup, {
        props: { selected: "1", readonly: false },
      });

      await rerender({ selected: "1", readonly: true });

      const radio2 = screen.getByRole("radio", { name: "Option 2" });
      await user.click(radio2);

      // jsdom doesn't restore the previously checked radio in a group after
      // a cancelled click the way real browsers do; covered by the e2e test.
      expect(radio2).not.toBeChecked();
    });

    it("should not propagate external selected updates to children when readonly", async () => {
      const { component } = render(RadioButtonGroup, {
        props: { selected: "1", readonly: true },
      });

      expect(screen.getByRole("radio", { name: "Option 1" })).toBeChecked();

      component.selected = "2";
      await tick();

      expect(screen.getByRole("radio", { name: "Option 1" })).toBeChecked();
      expect(screen.getByRole("radio", { name: "Option 2" })).not.toBeChecked();
    });
  });

  describe("Generics", () => {
    it("should support custom string literal types with generics", () => {
      type CustomValue = "option1" | "option2" | "option3";

      type ComponentType = RadioButtonGroupComponent<CustomValue>;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      expectTypeOf<Props["selected"]>().toEqualTypeOf<
        CustomValue | undefined
      >();

      type ChangeEvent = Events["change"];
      type ChangeEventDetail =
        ChangeEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<ChangeEventDetail>().toEqualTypeOf<CustomValue | null>();
    });

    it("should default to string | number when generic is not specified", () => {
      type ComponentType = RadioButtonGroupComponent;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      expectTypeOf<Props["selected"]>().toEqualTypeOf<
        string | number | undefined
      >();

      type ChangeEvent = Events["change"];
      type ChangeEventDetail =
        ChangeEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<ChangeEventDetail>().toEqualTypeOf<string | number | null>();
    });
  });
});
