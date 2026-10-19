import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import CheckboxGroupReadonly from "./CheckboxGroup.readonly.test.svelte";
import CheckboxGroupComponent from "./CheckboxGroupComponent.test.svelte";
import CheckboxGroupStaticSelected from "./CheckboxGroupStaticSelected.test.svelte";
import CheckboxReadonlyChange from "./CheckboxReadonlyChange.test.svelte";

describe("CheckboxGroup", () => {
  it("should handle selected values", () => {
    render(CheckboxGroupComponent, { props: { selected: ["1", "3"] } });

    expect(screen.getByRole("checkbox", { name: "Option 1" })).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Option 2" }),
    ).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Option 3" })).toBeChecked();
  });

  it("does not dispatch change event on initial render with a static selected array", () => {
    const onChange = vi.fn();
    render(CheckboxGroupStaticSelected, { onChange });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("dispatches one change event after interacting with a static selected array", async () => {
    const onChange = vi.fn();
    render(CheckboxGroupStaticSelected, { onChange });

    const smsCheckbox = screen.getByRole("checkbox", { name: "SMS" });
    await user.click(smsCheckbox);

    expect(onChange.mock.calls).toEqual([[["email", "sms"]]]);
  });

  it("should handle disabled state", () => {
    render(CheckboxGroupComponent, { props: { disabled: true } });

    const fieldset = screen.getByRole("group");
    expect(fieldset).toBeDisabled();

    // Native `<fieldset disabled>` propagates to nested inputs; individual
    // checkboxes should not carry their own `disabled` attribute.
    for (const checkbox of screen.getAllByRole("checkbox")) {
      expect(checkbox).toBeDisabled();
      expect(checkbox).not.toHaveAttribute("disabled");
    }
  });

  it.each([
    [
      "required",
      { required: true },
      (checkbox: HTMLElement) => expect(checkbox).toBeRequired(),
    ],
    [
      "custom name",
      { name: "custom-group" },
      (checkbox: HTMLElement) =>
        expect(checkbox).toHaveAttribute("name", "custom-group"),
    ],
  ])("should handle %s", (_, props, expectChild) => {
    render(CheckboxGroupComponent, { props });

    for (const checkbox of screen.getAllByRole("checkbox")) {
      expectChild(checkbox);
    }
  });

  it("should handle custom id", () => {
    render(CheckboxGroupComponent, {
      props: { id: "custom-id" },
    });

    const formItem = document.getElementById("custom-id");
    expect(formItem).toBeInTheDocument();
  });

  it("should handle change event on selection", async () => {
    const onChange = vi.fn();
    render(CheckboxGroupComponent, { onChange });

    const checkbox2 = screen.getByRole("checkbox", { name: "Option 2" });
    await user.click(checkbox2);

    expect(checkbox2).toBeChecked();
    expect(onChange).toHaveBeenCalledWith(["2"]);
  });

  it("should handle legend slot", () => {
    render(CheckboxGroupComponent, { props: { useSlot: true } });

    expect(screen.getByText("Custom Legend")).toBeInTheDocument();
  });

  it("should apply custom class", () => {
    render(CheckboxGroupComponent, {
      props: { customClass: "custom-group" },
    });

    const fieldset = screen.getByRole("group");
    const formItem = fieldset.closest(".bx--form-item");
    assert(formItem);
    expect(formItem).toHaveClass("custom-group");
  });

  it("should propagate external selected updates to child checkboxes", async () => {
    const { component } = render(CheckboxGroupComponent, {
      props: { selected: ["1"] },
    });

    expect(screen.getByRole("checkbox", { name: "Option 1" })).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Option 2" }),
    ).not.toBeChecked();

    component.selected = ["2", "3"];
    await tick();

    expect(
      screen.getByRole("checkbox", { name: "Option 1" }),
    ).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Option 2" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Option 3" })).toBeChecked();
  });

  it("should update selected value on checkbox clicks", async () => {
    const { component } = render(CheckboxGroupComponent);

    const checkbox1 = screen.getByRole("checkbox", { name: "Option 1" });
    await user.click(checkbox1);
    expect(component.selected).toEqual(["1"]);

    const checkbox3 = screen.getByRole("checkbox", { name: "Option 3" });
    await user.click(checkbox3);
    expect(component.selected).toEqual(["1", "3"]);

    await user.click(checkbox1);
    expect(component.selected).toEqual(["3"]);
  });

  it("should render helper text when provided", () => {
    render(CheckboxGroupComponent, {
      props: { helperText: "Helper text message" },
    });
    const helperElement = screen.getByText("Helper text message");
    expect(helperElement).toHaveTextContent("Helper text message");
    expect(helperElement).toHaveClass("bx--form__helper-text");
  });

  it("should not render helper text by default", () => {
    const { container } = render(CheckboxGroupComponent);
    expect(container.querySelector(".bx--form__helper-text")).toBeNull();
  });

  // The contract in tests/form-field-contract covers the messages and their
  // wiring; these are the styling hooks it doesn't model.
  it("marks the invalid state on the fieldset for styling", () => {
    render(CheckboxGroupComponent, {
      props: { invalid: true, invalidText: "Select at least one option" },
    });

    const fieldset = screen.getByRole("group");
    expect(fieldset).toHaveClass("bx--checkbox-group--invalid");
    expect(fieldset).toHaveAttribute("data-invalid", "true");
  });

  it("marks the warning state on the fieldset for styling", () => {
    render(CheckboxGroupComponent, {
      props: { warn: true, warnText: "Heads up" },
    });

    const fieldset = screen.getByRole("group");
    expect(fieldset).toHaveClass("bx--checkbox-group--warning");
    expect(fieldset).not.toHaveAttribute("data-invalid");
  });

  it.each([
    [
      "invalid",
      { invalid: true, invalidText: "Select at least one option" },
      "bx--checkbox-wrapper--invalid",
    ],
    [
      "warn",
      { warn: true, warnText: "Heads up" },
      "bx--checkbox-wrapper--warning",
    ],
  ])(
    "propagates group %s state to child checkboxes that don't set their own",
    (state, props, wrapperClass) => {
      render(CheckboxGroupComponent, { props });

      const option1 = screen.getByRole("checkbox", { name: "Option 1" });
      expect(option1.closest(".bx--checkbox-wrapper")).toHaveClass(
        wrapperClass,
      );
      if (state === "invalid") {
        expect(option1).toHaveAttribute("aria-invalid", "true");
      }
    },
  );

  it("keeps a disabled group's invalid state off its child checkboxes", () => {
    render(CheckboxGroupComponent, {
      props: {
        disabled: true,
        invalid: true,
        invalidText: "Select at least one option",
      },
    });

    const option1 = screen.getByRole("checkbox", { name: "Option 1" });
    expect(option1).not.toHaveAttribute("aria-invalid");
    expect(option1.closest(".bx--checkbox-wrapper")).not.toHaveClass(
      "bx--checkbox-wrapper--invalid",
    );
  });

  it("lays out in a row with orientation horizontal", () => {
    render(CheckboxGroupComponent, { props: { orientation: "horizontal" } });

    expect(screen.getByRole("group")).toHaveClass(
      "bx--checkbox-group--horizontal",
    );
  });

  describe("readonly (group)", () => {
    it("should apply readonly class on the fieldset", () => {
      const { container } = render(CheckboxGroupReadonly, {
        readonly: true,
      });

      expect(
        container.querySelector(".bx--checkbox-group--readonly"),
      ).toBeTruthy();
    });

    it("describes the group as read-only for screen readers that ignore aria-readonly", () => {
      render(CheckboxGroupReadonly, { id: "readonly-group", readonly: true });

      const fieldset = screen.getByRole("group");
      expect(fieldset).toHaveAttribute(
        "aria-describedby",
        "readonly-readonly-group",
      );

      const description = document.getElementById("readonly-readonly-group");
      expect(description).toHaveTextContent("Read-only");
      expect(description).toHaveClass("bx--visually-hidden");
    });

    it("supports overriding the group's read-only assistive text", () => {
      render(CheckboxGroupReadonly, {
        id: "readonly-group",
        readonly: true,
        readonlyText: "Custom read-only text",
      });

      expect(
        document.getElementById("readonly-readonly-group"),
      ).toHaveTextContent("Custom read-only text");
    });

    it("should not change selection when clicking another checkbox", async () => {
      const onChange = vi.fn();
      render(CheckboxGroupReadonly, {
        selected: ["1"],
        readonly: true,
        onChange,
      });

      const option2 = screen.getByRole("checkbox", { name: "Option 2" });
      await user.click(option2);

      expect(option2).not.toBeChecked();
      expect(screen.getByRole("checkbox", { name: "Option 1" })).toBeChecked();
      expect(onChange).not.toHaveBeenCalledWith(["1", "2"]);
    });

    it("should not forward a child Checkbox's on:change when the group is readonly", async () => {
      const onChange = vi.fn();
      render(CheckboxReadonlyChange, { onChange });

      const option2 = screen.getByRole("checkbox", { name: "Option 2" });
      await fireEvent.change(option2);

      expect(onChange).not.toHaveBeenCalled();
    });

    it("should not change selection when readonly flips to true after mount", async () => {
      const onChange = vi.fn();
      const { rerender } = render(CheckboxGroupReadonly, {
        selected: ["1"],
        readonly: false,
        onChange,
      });

      await rerender({ selected: ["1"], readonly: true });
      await tick();

      const option2 = screen.getByRole("checkbox", { name: "Option 2" });
      await user.click(option2);

      expect(screen.getByRole("checkbox", { name: "Option 1" })).toBeChecked();
      expect(option2).not.toBeChecked();
      expect(onChange).not.toHaveBeenCalledWith(["1", "2"]);
    });

    it("should not propagate external selected updates to children when readonly", async () => {
      const { component } = render(CheckboxGroupReadonly, {
        selected: ["1"],
        readonly: true,
      });

      expect(screen.getByRole("checkbox", { name: "Option 1" })).toBeChecked();

      component.selected = ["2"];
      await tick();

      expect(screen.getByRole("checkbox", { name: "Option 1" })).toBeChecked();
      expect(
        screen.getByRole("checkbox", { name: "Option 2" }),
      ).not.toBeChecked();
    });

    it("should set aria-readonly on children when the group is readonly", () => {
      render(CheckboxGroupReadonly, { selected: ["1"], readonly: true });

      for (const checkbox of screen.getAllByRole("checkbox")) {
        expect(checkbox).toHaveAttribute("aria-readonly", "true");
      }
    });
  });
});
