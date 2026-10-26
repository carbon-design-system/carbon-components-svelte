import { fireEvent, render, screen } from "@testing-library/svelte";
import type CheckboxComponent from "carbon-components-svelte/Checkbox/Checkbox.svelte";
import type { ComponentProps } from "svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import CheckboxGroup from "./Checkbox.group.test.svelte";
import CheckboxReadonly from "./Checkbox.readonly.test.svelte";
import CheckboxSkeleton from "./Checkbox.skeleton.test.svelte";
import CheckboxSlot from "./Checkbox.slot.test.svelte";
import Checkbox from "./Checkbox.test.svelte";
import CheckboxValidation from "./Checkbox.validation.test.svelte";
import CheckboxGroupComponent from "./CheckboxGroupComponent.test.svelte";
import CheckboxGroupEvents from "./CheckboxGroupEvents.test.svelte";
import CheckboxGroupReactive from "./CheckboxGroupReactive.test.svelte";
import CheckboxReactiveBind from "./CheckboxReactiveBind.test.svelte";
import CheckboxTitleTruncation from "./CheckboxTitleTruncation.test.svelte";
import MultipleCheckboxes from "./MultipleCheckboxes.test.svelte";
import MultipleCheckboxesObject from "./MultipleCheckboxesObject.test.svelte";

describe("Checkbox", () => {
  it("renders with default props", () => {
    render(Checkbox);

    const checkbox = screen.getByTestId("checkbox");
    expect(checkbox).toBeInTheDocument();

    const input = screen.getByRole("checkbox");
    expect(input).not.toBeChecked();
    expect(input).not.toBeDisabled();
    expect(input).not.toBePartiallyChecked();

    const labelText = screen.getByText("Checkbox label");
    const label = labelText.closest("label");
    assert(label);
    expect(label).toHaveTextContent("Checkbox label");
    const hiddenElement = label.querySelector(".bx--visually-hidden");
    expect(hiddenElement).not.toBeInTheDocument();
  });

  it("emits events", async () => {
    const onCheck = vi.fn();
    const onClick = vi.fn();
    render(Checkbox, { onCheck, onClick });

    const input = screen.getByRole("checkbox");
    await user.click(input);
    expect(onCheck).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("forwards the native change, focus and blur events", async () => {
    const onChange = vi.fn();
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(Checkbox, { onChange, onFocus, onBlur });

    await user.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onFocus).toHaveBeenCalledTimes(1);

    await user.tab();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it("sets the tabindex on the input", () => {
    render(Checkbox, { tabindex: -1 });

    expect(screen.getByRole("checkbox")).toHaveAttribute("tabindex", "-1");
  });

  it("emits exactly one check event per click", async () => {
    const onCheck = vi.fn();
    render(Checkbox, { onCheck });

    const input = screen.getByRole("checkbox");

    for (let i = 0; i < 3; i++) {
      onCheck.mockClear();
      // eslint-disable-next-line no-await-in-loop -- each click must settle before the next
      await user.click(input);
      expect(onCheck).toHaveBeenCalledTimes(1);
    }
  });

  it("emits exactly one check event when checked is changed externally via bind", async () => {
    const onCheck = vi.fn();
    const { component } = render(CheckboxReactiveBind, { onCheck });

    onCheck.mockClear();
    component.checked = true;
    await tick();

    expect(onCheck).toHaveBeenCalledTimes(1);

    onCheck.mockClear();
    component.checked = false;
    await tick();

    expect(onCheck).toHaveBeenCalledTimes(1);
  });

  it("drops the label's mixed state once a click settles the checkbox", async () => {
    const { container } = render(Checkbox, {
      labelText: "Select all",
      indeterminate: true,
    });
    const label = container.querySelector(".bx--checkbox-label");
    const input = screen.getByRole("checkbox") as HTMLInputElement;
    expect(input.indeterminate).toBe(true);
    expect(label).toHaveAttribute("data-contained-checkbox-state", "mixed");

    await user.click(input);
    expect(label).not.toHaveAttribute("data-contained-checkbox-state");
  });

  it("renders disabled state", () => {
    render(Checkbox, { disabled: true });

    const input = screen.getByRole("checkbox");
    expect(input).toBeDisabled();
  });

  it("renders skeleton state", () => {
    render(CheckboxSkeleton);

    const skeleton = screen.getByTestId("checkbox-skeleton");
    expect(skeleton).toBeInTheDocument();
    expect(
      skeleton.querySelector(".bx--checkbox-label-text.bx--skeleton"),
    ).toBeInTheDocument();
    expect(
      skeleton.querySelector("input[type='checkbox']"),
    ).not.toBeInTheDocument();
  });

  it("works with checkbox groups", async () => {
    const onChange = vi.fn();
    render(CheckboxGroup, { onChange });

    const checkbox1 = screen.getByRole("checkbox", { name: "Option 1" });
    const checkbox2 = screen.getByRole("checkbox", { name: "Option 2" });
    const checkbox3 = screen.getByRole("checkbox", { name: "Option 3" });

    expect(checkbox1).not.toBeChecked();
    expect(checkbox2).toBeChecked();
    expect(checkbox3).not.toBeChecked();
    expect(onChange).toHaveBeenCalledWith(["option-2"]);

    await user.click(checkbox1);
    expect(checkbox1).toBeChecked();
    expect(onChange).toHaveBeenCalledWith(["option-2", "option-1"]);

    await user.click(checkbox2);
    expect(checkbox2).not.toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith(["option-1"]);

    await user.click(checkbox3);
    expect(checkbox3).toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith(["option-1", "option-3"]);
  });

  it("emits exactly one check event per click in checkbox groups", async () => {
    const onCheck = vi.fn();
    render(CheckboxGroupEvents, { onCheck });

    const checkbox1 = screen.getByRole("checkbox", { name: "Option 1" });
    const checkbox2 = screen.getByRole("checkbox", { name: "Option 2" });
    const checkbox3 = screen.getByRole("checkbox", { name: "Option 3" });

    const callsFor = (value: string) =>
      onCheck.mock.calls.filter(([v]) => v === value);

    onCheck.mockClear();
    await user.click(checkbox1);
    expect(callsFor("option-1")).toHaveLength(1);
    expect(callsFor("option-1")[0][2]).toBe(1);

    onCheck.mockClear();
    await user.click(checkbox2);
    expect(callsFor("option-2")).toHaveLength(1);

    onCheck.mockClear();
    await user.click(checkbox3);
    expect(callsFor("option-3")).toHaveLength(1);
    expect(callsFor("option-3")[0][2]).toBe(1);
  });

  it("emits a check event with the new state for a checkbox in a CheckboxGroup", async () => {
    const onCheck = vi.fn();
    render(CheckboxGroupComponent, { onCheck });

    await user.click(screen.getByRole("checkbox", { name: "Option 2" }));
    expect(onCheck.mock.calls).toEqual([["2", true]]);

    await user.click(screen.getByRole("checkbox", { name: "Option 2" }));
    expect(onCheck).toHaveBeenLastCalledWith("2", false);
  });

  it("emits check event when group is updated externally", async () => {
    const onCheck = vi.fn();
    const { component } = render(CheckboxGroupReactive, { onCheck });

    const checkbox1 = screen.getByRole("checkbox", { name: "Option 1" });

    onCheck.mockClear();
    component.group = ["option-2", "option-1"];
    await tick();

    expect(checkbox1).toBeChecked();
    expect(onCheck).toHaveBeenCalledTimes(1);
    expect(onCheck).toHaveBeenCalledWith("option-1", true);
    const groupValue = screen.getByTestId("group-value");
    expect(groupValue.textContent).toContain("option-1");
  });

  it("supports custom label slot", () => {
    render(CheckboxSlot);

    const customLabel = screen.getByTestId("custom-label");
    expect(customLabel).toBeInTheDocument();
    expect(customLabel).toHaveTextContent("Custom label content");
  });

  it("handles checkbox selection changes", async () => {
    const onChange = vi.fn();
    render(MultipleCheckboxes, { onChange });

    const coconutCheckbox = screen.getByRole("checkbox", { name: "Coconut" });

    await user.click(coconutCheckbox);

    expect(coconutCheckbox).toBeChecked();
    expect(onChange).toHaveBeenCalledWith(["Apple", "Banana", "Coconut"]);
    expect(screen.getByTestId("selected-values")).toHaveTextContent(
      '["Apple","Banana","Coconut"]',
    );
  });

  it("handles button click to set specific value", async () => {
    const onChange = vi.fn();
    const onSet = vi.fn();
    render(MultipleCheckboxes, { onChange, onSet });

    await user.click(screen.getByText(/Set to/));

    expect(onSet).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith(["Banana"]);

    const appleCheckbox = screen.getByRole("checkbox", { name: "Apple" });
    const bananaCheckbox = screen.getByRole("checkbox", { name: "Banana" });
    const coconutCheckbox = screen.getByRole("checkbox", { name: "Coconut" });

    expect(appleCheckbox).not.toBeChecked();
    expect(bananaCheckbox).toBeChecked();
    expect(coconutCheckbox).not.toBeChecked();

    expect(screen.getByTestId("selected-values")).toHaveTextContent(
      '["Banana"]',
    );
  });

  it("handles multiple checkbox selections with object binding", async () => {
    const onChange = vi.fn();
    render(MultipleCheckboxesObject, { onChange });

    const checkboxA = screen.getByRole("checkbox", { name: "A" });
    const checkboxB = screen.getByRole("checkbox", { name: "B" });

    await user.click(checkboxA);
    expect(checkboxA).toBeChecked();
    expect(onChange).toHaveBeenCalledWith({ a: true, b: false });

    await user.click(checkboxB);
    expect(checkboxB).toBeChecked();
    expect(onChange).toHaveBeenCalledWith({ a: true, b: true });

    expect(screen.getByTestId("object-values")).toHaveTextContent(
      '{"a":true,"b":true}',
    );
  });

  it("renders readonly state with aria-readonly attribute", () => {
    render(CheckboxReadonly, { readonly: true });

    const input = screen.getByRole("checkbox");
    expect(input).toHaveAttribute("aria-readonly", "true");
  });

  it("marks the read-only wrapper for styling", () => {
    render(CheckboxReadonly, { readonly: true });

    expect(screen.getByTestId("checkbox")).toHaveClass(
      "bx--checkbox-wrapper--readonly",
    );
  });

  it("describes the field as read-only for screen readers that ignore aria-readonly", () => {
    const { container } = render(CheckboxReadonly, {
      id: "readonly-checkbox",
      readonly: true,
    });

    const input = screen.getByRole("checkbox");
    expect(input).toHaveAttribute(
      "aria-describedby",
      "readonly-readonly-checkbox",
    );

    const description = container.querySelector("#readonly-readonly-checkbox");
    expect(description).toHaveTextContent("Read-only");
    expect(description).toHaveClass("bx--visually-hidden");
  });

  it("supports overriding the read-only assistive text", () => {
    const { container } = render(CheckboxReadonly, {
      id: "readonly-checkbox",
      readonly: true,
      readonlyText: "Custom read-only text",
    });

    expect(
      container.querySelector("#readonly-readonly-checkbox"),
    ).toHaveTextContent("Custom read-only text");
  });

  it("omits the read-only description when decorative", () => {
    const { container } = render(CheckboxReadonly, {
      id: "readonly-checkbox",
      readonly: true,
      decorative: true,
    });

    expect(container.querySelector("#readonly-checkbox")).not.toHaveAttribute(
      "aria-describedby",
    );
    expect(
      container.querySelector("#readonly-readonly-checkbox"),
    ).not.toBeInTheDocument();
  });

  it("does not forward change event when readonly", async () => {
    const onChange = vi.fn();
    render(CheckboxReadonly, { checked: false, readonly: true, onChange });

    const input = screen.getByRole("checkbox");
    onChange.mockClear();

    await fireEvent.change(input);

    expect(onChange).not.toHaveBeenCalled();
  });

  // The contract in tests/form-field-contract covers the messages and their
  // wiring; these are the styling hooks it doesn't model.
  it("marks the invalid state for styling", () => {
    render(CheckboxValidation, { invalid: true });

    expect(screen.getByTestId("checkbox")).toHaveClass(
      "bx--checkbox-wrapper--invalid",
    );
    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "data-invalid",
      "true",
    );
  });

  it("marks the warning state for styling", () => {
    render(CheckboxValidation, { warn: true });

    const wrapper = screen.getByTestId("checkbox");
    expect(wrapper).toHaveClass("bx--checkbox-wrapper--warning");
    expect(wrapper).not.toHaveClass("bx--checkbox-wrapper--invalid");
  });

  it.each([{ disabled: true }, { readonly: true }])(
    "drops the invalid styling when %o",
    (state) => {
      render(CheckboxValidation, { invalid: true, ...state });

      expect(screen.getByTestId("checkbox")).not.toHaveClass(
        "bx--checkbox-wrapper--invalid",
      );
    },
  );

  it("should render helper text when provided", () => {
    render(Checkbox, { helperText: "Helper text message" });
    const helperElement = screen.getByText("Helper text message");
    expect(helperElement).toHaveTextContent("Helper text message");
    expect(helperElement).toHaveClass("bx--form__helper-text");
  });

  it("should not render helper text by default", () => {
    const { container } = render(Checkbox);
    expect(container.querySelector(".bx--form__helper-text")).toBeNull();
  });

  describe("title truncation", () => {
    let offsetWidthSpy: ReturnType<typeof vi.spyOn>;
    let scrollWidthSpy: ReturnType<typeof vi.spyOn>;

    function mockTruncated() {
      offsetWidthSpy = vi
        .spyOn(HTMLElement.prototype, "offsetWidth", "get")
        .mockReturnValue(10);
      scrollWidthSpy = vi
        .spyOn(HTMLElement.prototype, "scrollWidth", "get")
        .mockReturnValue(100);
    }

    afterEach(() => {
      offsetWidthSpy?.mockRestore();
      scrollWidthSpy?.mockRestore();
    });

    function getLabel() {
      const label = document
        .querySelector('[data-testid="checkbox-title"]')
        ?.querySelector("label.bx--checkbox-label");
      assert(label);
      return label;
    }

    it('keeps title="" when the label is truncated', async () => {
      mockTruncated();
      render(CheckboxTitleTruncation, {
        title: "",
        labelText: "A very long label that should be truncated",
      });
      await tick();

      expect(getLabel().getAttribute("title")).toBe("");
    });

    it("measures the label text, not the label, to decide on a title", async () => {
      // Only the text span overflows; the label itself fits.
      const isText = (el: HTMLElement) =>
        el.classList.contains("bx--checkbox-label-text");
      offsetWidthSpy = vi
        .spyOn(HTMLElement.prototype, "offsetWidth", "get")
        .mockImplementation(function (this: HTMLElement) {
          return isText(this) ? 10 : 100;
        });
      scrollWidthSpy = vi
        .spyOn(HTMLElement.prototype, "scrollWidth", "get")
        .mockReturnValue(100);
      render(CheckboxTitleTruncation, {
        labelText: "A very long label that should be truncated",
      });
      await tick();

      expect(getLabel().getAttribute("title")).toBe(
        "A very long label that should be truncated",
      );
    });

    it("keeps a provided title when truncated", async () => {
      mockTruncated();
      render(CheckboxTitleTruncation, {
        title: "Custom title",
        labelText: "A very long label that should be truncated",
      });
      await tick();

      expect(getLabel().getAttribute("title")).toBe("Custom title");
    });
  });

  describe("Generics", () => {
    it("should support custom types with generics", () => {
      type CustomValue = "option1" | "option2" | "option3";

      type ComponentType = CheckboxComponent<CustomValue>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["value"]>().toEqualTypeOf<CustomValue | undefined>();
      expectTypeOf<Props["group"]>().toEqualTypeOf<
        ReadonlyArray<CustomValue> | undefined
      >();
    });

    it("should default to any type when generic is not specified", () => {
      type ComponentType = CheckboxComponent;
      type Props = ComponentProps<ComponentType>;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Testing default any type
      expectTypeOf<Props["value"]>().toEqualTypeOf<any>();
      expectTypeOf<Props["group"]>().toEqualTypeOf<
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Testing default any type
        ReadonlyArray<any> | undefined
      >();
    });
  });
});
