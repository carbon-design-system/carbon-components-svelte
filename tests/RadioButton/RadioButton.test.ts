import { render, screen } from "@testing-library/svelte";
import type RadioButtonComponent from "carbon-components-svelte/RadioButton/RadioButton.svelte";
import type { ComponentProps } from "svelte";
import { user } from "../utils/user";
import RadioButton from "./RadioButton.test.svelte";
import RadioButtonCustom from "./RadioButtonCustom.test.svelte";

describe("RadioButton", () => {
  it("should render with default props", () => {
    render(RadioButton);

    const input = screen.getByRole("radio", { name: "Option 1" });
    expect(input).toHaveAttribute("name", "test-group");
    expect(input).toHaveAttribute("value", "");
    expect(input).not.toBeChecked();
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

  it("should handle custom slots", () => {
    render(RadioButtonCustom);

    expect(screen.getByText("Custom Label Text")).toBeInTheDocument();
  });

  it("should handle change event", async () => {
    const onChange = vi.fn();
    render(RadioButton, { props: { onChange } });

    const input = screen.getByRole("radio");
    await user.click(input);

    expect(input).toBeChecked();
    expect(onChange).toHaveBeenCalled();
  });

  it("should handle focus and blur events", async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(RadioButton, { props: { onFocus, onBlur } });

    const input = screen.getByRole("radio");
    await user.tab();
    expect(input).toHaveFocus();
    expect(onFocus).toHaveBeenCalled();

    await user.tab();
    expect(input).not.toHaveFocus();
    expect(onBlur).toHaveBeenCalled();
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

    it("describes the field as read-only for screen readers", async () => {
      const { container, rerender } = render(RadioButton, {
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

      await rerender({ readonlyText: "Custom read-only text" });

      expect(description).toHaveTextContent("Custom read-only text");
    });

    it("applies the readonly wrapper class", () => {
      render(RadioButton, { props: { readonly: true } });

      const wrapper = screen
        .getByRole("radio")
        .closest(".bx--radio-button-wrapper");
      expect(wrapper).toHaveClass("bx--radio-button-wrapper--readonly");
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
