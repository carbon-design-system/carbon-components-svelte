import { fireEvent, render, screen } from "@testing-library/svelte";
import type RadioButtonComponent from "carbon-components-svelte/RadioButton/RadioButton.svelte";
import { type ComponentProps, tick } from "svelte";
import { user } from "../utils/user";
import RadioButton from "./RadioButton.test.svelte";
import RadioButtonCustom from "./RadioButtonCustom.test.svelte";
import RadioButtonGroupReadonly from "./RadioButtonGroup.readonly.test.svelte";
import RadioButtonReadonlyChange from "./RadioButtonReadonlyChange.test.svelte";

describe("RadioButton", () => {
  it("should render with default props", () => {
    render(RadioButton);

    const input = screen.getByRole("radio");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("name", "test-group");
    expect(input).toHaveAttribute("value", "");
    expect(input).not.toBeChecked();
    expect(screen.getByText("Option 1")).toBeInTheDocument();
  });

  it("should handle checked state", () => {
    render(RadioButton, { props: { checked: true } });

    expect(screen.getByRole("radio")).toBeChecked();
  });

  it("should handle disabled state", () => {
    render(RadioButton, { props: { disabled: true } });

    expect(screen.getByRole("radio")).toBeDisabled();
  });

  it("should handle required state", () => {
    render(RadioButton, { props: { required: true } });

    expect(screen.getByRole("radio")).toHaveAttribute("required");
  });

  it("should handle label position", () => {
    render(RadioButton, { props: { labelPosition: "left" } });

    const label = screen.getByLabelText("Option 1");
    const wrapper = label.closest(".bx--radio-button-wrapper");
    expect(wrapper).toHaveClass("bx--radio-button-wrapper--label-left");
  });

  it("should handle hidden label", () => {
    render(RadioButton, { props: { hideLabel: true } });

    expect(screen.getByText("Option 1")).toHaveClass("bx--visually-hidden");
  });

  it("should handle custom id", () => {
    render(RadioButton, { props: { id: "custom-id" } });

    const input = screen.getByRole("radio");
    expect(input).toHaveAttribute("id", "custom-id");

    const labelText = screen.getByText("Option 1");
    const label = labelText.closest("label");
    expect(label).toHaveAttribute("for", "custom-id");
  });

  it("should handle custom name", () => {
    render(RadioButton, { props: { name: "custom-name" } });

    expect(screen.getByRole("radio")).toHaveAttribute("name", "custom-name");
  });

  it("should handle custom value", () => {
    render(RadioButton, { props: { value: "custom-value" } });

    expect(screen.getByRole("radio")).toHaveAttribute("value", "custom-value");
  });

  it("should apply aria-label to the input when there is no label text", () => {
    const { container } = render(RadioButton, {
      props: { labelText: "", "aria-label": "CDN" },
    });

    expect(screen.getByRole("radio", { name: "CDN" })).toBeInTheDocument();
    expect(
      container.querySelector(".bx--radio-button-wrapper"),
    ).not.toHaveAttribute("aria-label");
  });

  it("should prefer labelText as the accessible name and strip aria-label from the wrapper", () => {
    const { container } = render(RadioButton, {
      props: { labelText: "Standard", "aria-label": "CDN" },
    });

    expect(screen.getByRole("radio", { name: "Standard" })).toBeInTheDocument();
    expect(
      container.querySelector(".bx--radio-button-wrapper"),
    ).not.toHaveAttribute("aria-label");
  });

  it("should handle custom slots", () => {
    render(RadioButtonCustom);

    expect(screen.getByText("Custom Label Text")).toBeInTheDocument();
  });

  it("should handle change event", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(RadioButton);

    const input = screen.getByRole("radio");
    await user.click(input);

    expect(input).toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith("change");
  });

  it("should handle focus and blur events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(RadioButton);

    const input = screen.getByRole("radio");
    await user.tab();
    expect(input).toHaveFocus();
    expect(consoleLog).toHaveBeenCalledWith("focus");

    await user.tab();
    expect(input).not.toHaveFocus();
    expect(consoleLog).toHaveBeenCalledWith("blur");
  });

  it("should handle disabled state with events", async () => {
    render(RadioButton, { props: { disabled: true } });

    const input = screen.getByRole("radio");
    await user.click(input);
    expect(input).not.toBeChecked();
  });

  it("should handle label text slot", () => {
    render(RadioButtonCustom);

    expect(screen.getByText("Custom Label Text").tagName).toBe("SPAN");
  });

  it("should apply custom class", () => {
    render(RadioButton, { props: { customClass: "custom-radio" } });

    const label = screen.getByLabelText("Option 1");
    const wrapper = label.closest(".bx--radio-button-wrapper");
    expect(wrapper).toHaveClass("custom-radio");
  });

  it("should bind ref to input element", () => {
    const { component } = render(RadioButton);

    expect(component.ref).toBeInstanceOf(HTMLInputElement);
    assert(component.ref);
    expect(component.ref.type).toBe("radio");
  });

  describe("readonly (group)", () => {
    it("should apply readonly class on the fieldset", () => {
      const { container } = render(RadioButtonGroupReadonly, {
        readonly: true,
      });

      expect(
        container.querySelector(".bx--radio-button-group--readonly"),
      ).toBeTruthy();
    });

    it("describes the group as read-only for screen readers that ignore aria-readonly", () => {
      render(RadioButtonGroupReadonly, {
        id: "readonly-group",
        readonly: true,
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
    });

    it("supports overriding the group's read-only assistive text", () => {
      render(RadioButtonGroupReadonly, {
        id: "readonly-group",
        readonly: true,
        readonlyText: "Custom read-only text",
      });

      expect(
        document.getElementById("readonly-readonly-group"),
      ).toHaveTextContent("Custom read-only text");
    });

    it("should not change selection when clicking another radio", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(RadioButtonGroupReadonly, { selected: "1", readonly: true });

      const pro = screen.getByRole("radio", { name: "Pro" });
      await user.click(pro);

      // jsdom doesn't restore the previously checked radio in a group after
      // a cancelled click the way real browsers do; covered by the e2e test.
      expect(pro).not.toBeChecked();
      expect(consoleLog).not.toHaveBeenCalledWith("change", "2");
    });

    it("should set aria-readonly on the radiogroup when readonly, and not on the radios", () => {
      render(RadioButtonGroupReadonly, { selected: "1", readonly: true });

      expect(screen.getByRole("radiogroup")).toHaveAttribute(
        "aria-readonly",
        "true",
      );

      for (const name of ["Free", "Pro", "Team"]) {
        expect(screen.getByRole("radio", { name })).not.toHaveAttribute(
          "aria-readonly",
        );
      }
    });

    it("should not set aria-readonly on the radiogroup when not readonly", () => {
      render(RadioButtonGroupReadonly, { selected: "1", readonly: false });

      expect(screen.getByRole("radiogroup")).not.toHaveAttribute(
        "aria-readonly",
      );
    });

    it("should update aria-readonly on the radiogroup when readonly flips after mount", async () => {
      const { rerender } = render(RadioButtonGroupReadonly, {
        selected: "1",
        readonly: false,
      });

      expect(screen.getByRole("radiogroup")).not.toHaveAttribute(
        "aria-readonly",
      );

      await rerender({ selected: "1", readonly: true });
      await tick();

      expect(screen.getByRole("radiogroup")).toHaveAttribute(
        "aria-readonly",
        "true",
      );
    });

    it("should not forward a child RadioButton's on:change when the group is readonly", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(RadioButtonReadonlyChange);

      const pro = screen.getByRole("radio", { name: "Pro" });
      await fireEvent.change(pro);

      expect(consoleLog).not.toHaveBeenCalledWith("radio-change", "2");
    });

    it("should allow selection when readonly is false", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(RadioButtonGroupReadonly, { selected: "1", readonly: false });

      const pro = screen.getByRole("radio", { name: "Pro" });
      await user.click(pro);

      expect(pro).toBeChecked();
      expect(consoleLog).toHaveBeenCalledWith("change", "2");
    });

    it("should not change selection when readonly flips to true after mount", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { rerender } = render(RadioButtonGroupReadonly, {
        selected: "1",
        readonly: false,
      });

      await rerender({ selected: "1", readonly: true });
      await tick();

      const pro = screen.getByRole("radio", { name: "Pro" });
      await user.click(pro);

      // jsdom doesn't restore the previously checked radio in a group after
      // a cancelled click the way real browsers do; covered by the e2e test.
      expect(pro).not.toBeChecked();
      expect(consoleLog).not.toHaveBeenCalledWith("change", "2");
    });

    it("should not propagate external selected updates to children when readonly", async () => {
      const { component } = render(RadioButtonGroupReadonly, {
        selected: "1",
        readonly: true,
      });

      expect(screen.getByRole("radio", { name: "Free" })).toBeChecked();

      component.selected = "2";
      await tick();

      expect(screen.getByRole("radio", { name: "Free" })).toBeChecked();
      expect(screen.getByRole("radio", { name: "Pro" })).not.toBeChecked();
    });
  });

  describe("readonly (standalone)", () => {
    it("prevents checking on click when readonly", async () => {
      render(RadioButton, { props: { readonly: true, id: "readonly-radio" } });

      const radio = screen.getByRole("radio");
      await user.click(radio);

      expect(radio).not.toBeChecked();
    });

    it("allows checking when not readonly", async () => {
      render(RadioButton, { props: { readonly: false, id: "readonly-radio" } });

      const radio = screen.getByRole("radio");
      await user.click(radio);

      expect(radio).toBeChecked();
    });

    it("does not set aria-readonly on the radio (unsupported by role radio)", () => {
      render(RadioButton, { props: { readonly: true, id: "readonly-radio" } });

      expect(screen.getByRole("radio")).not.toHaveAttribute("aria-readonly");
    });

    it("describes the field as read-only for screen readers", () => {
      const { container } = render(RadioButton, {
        props: { readonly: true, id: "readonly-radio" },
      });

      const radio = screen.getByRole("radio");
      expect(radio).toHaveAttribute(
        "aria-describedby",
        "readonly-readonly-radio",
      );

      const description = container.querySelector("#readonly-readonly-radio");
      expect(description).toHaveTextContent("Read-only");
      expect(description).toHaveClass("bx--visually-hidden");
    });

    it("supports overriding the read-only assistive text", () => {
      const { container } = render(RadioButton, {
        props: {
          readonly: true,
          id: "readonly-radio",
          readonlyText: "Custom read-only text",
        },
      });

      expect(
        container.querySelector("#readonly-readonly-radio"),
      ).toHaveTextContent("Custom read-only text");
    });

    it("applies the readonly wrapper class", () => {
      render(RadioButton, { props: { readonly: true } });

      const wrapper = screen
        .getByRole("radio")
        .closest(".bx--radio-button-wrapper");
      expect(wrapper).toHaveClass("bx--radio-button-wrapper--readonly");
    });

    it("leaves the read-only description to a read-only group's fieldset", () => {
      render(RadioButtonGroupReadonly, { readonly: true });

      for (const radio of screen.getAllByRole("radio")) {
        expect(radio).not.toHaveAttribute("aria-describedby");
        expect(radio.closest(".bx--radio-button-wrapper")).toHaveClass(
          "bx--radio-button-wrapper--readonly",
        );
      }
    });
  });

  describe("Generics", () => {
    it("should support custom string literal types with generics", () => {
      type CustomValue = "option1" | "option2" | "option3";

      type ComponentType = RadioButtonComponent<CustomValue>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["value"]>().toEqualTypeOf<CustomValue | undefined>();
    });

    it("should default to string | number when generic is not specified", () => {
      type ComponentType = RadioButtonComponent;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["value"]>().toEqualTypeOf<
        string | number | undefined
      >();
    });
  });
});
