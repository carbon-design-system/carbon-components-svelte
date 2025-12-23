import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../setup-tests";
import CheckboxGroup from "./Checkbox.group.test.svelte";
import CheckboxReadonly from "./Checkbox.readonly.test.svelte";
import CheckboxSkeleton from "./Checkbox.skeleton.test.svelte";
import CheckboxSlot from "./Checkbox.slot.test.svelte";
import Checkbox from "./Checkbox.test.svelte";
import CheckboxGroupEvents from "./CheckboxGroupEvents.test.svelte";
import CheckboxGroupReactive from "./CheckboxGroupReactive.test.svelte";
import CheckboxReactiveBind from "./CheckboxReactiveBind.test.svelte";
import MultipleCheckboxes from "./MultipleCheckboxes.test.svelte";
import MultipleCheckboxesObject from "./MultipleCheckboxesObject.test.svelte";

describe("Checkbox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with default props", () => {
    render(Checkbox);

    const checkbox = screen.getByTestId("checkbox");
    expect(checkbox).toBeInTheDocument();

    const input = screen.getByRole("checkbox");
    expect(input).not.toBeChecked();
    expect(input).not.toBeDisabled();
    expect(input).not.toHaveAttribute("indeterminate");

    const labelText = screen.getByText("Checkbox label");
    const label = labelText.closest("label");
    assert(label);
    expect(label).toHaveTextContent("Checkbox label");
    const hiddenElement = label.querySelector(".bx--visually-hidden");
    expect(hiddenElement).not.toBeInTheDocument();
  });

  it("renders checked state", () => {
    render(Checkbox, { checked: true });

    const input = screen.getByRole("checkbox");
    expect(input).toBeChecked();
  });

  it("emits events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Checkbox);

    const input = screen.getByRole("checkbox");
    await user.click(input);
    expect(consoleLog).toHaveBeenCalledWith("check");
    expect(consoleLog).toHaveBeenCalledWith("click");
    expect(consoleLog).toHaveBeenCalledTimes(2);
  });

  it("emits exactly one check event per click", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Checkbox);

    const input = screen.getByRole("checkbox");

    consoleLog.mockClear();
    await user.click(input);
    const checkCalls1 = consoleLog.mock.calls.filter(
      (call) => call[0] === "check",
    );
    expect(checkCalls1).toHaveLength(1);

    consoleLog.mockClear();
    await user.click(input);
    const checkCalls2 = consoleLog.mock.calls.filter(
      (call) => call[0] === "check",
    );
    expect(checkCalls2).toHaveLength(1);

    consoleLog.mockClear();
    await user.click(input);
    const checkCalls3 = consoleLog.mock.calls.filter(
      (call) => call[0] === "check",
    );
    expect(checkCalls3).toHaveLength(1);
  });

  it("emits exactly one check event when checked is changed externally via bind", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { component } = render(CheckboxReactiveBind);

    consoleLog.mockClear();
    component.setChecked(true);
    await tick();

    expect(consoleLog).toHaveBeenCalledWith("check");
    expect(consoleLog).toHaveBeenCalledTimes(1);

    consoleLog.mockClear();
    component.setChecked(false);
    await tick();

    expect(consoleLog).toHaveBeenCalledWith("check");
    expect(consoleLog).toHaveBeenCalledTimes(1);
  });

  it("does not emit duplicate events on rapid clicks", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Checkbox);

    const input = screen.getByRole("checkbox");

    await user.click(input);
    await user.click(input);
    await user.click(input);

    const checkCalls = consoleLog.mock.calls.filter(
      (call) => call[0] === "check",
    );
    expect(checkCalls).toHaveLength(3);
  });

  it("renders indeterminate state", () => {
    render(Checkbox, { indeterminate: true });

    const input = screen.getByRole("checkbox");
    assert(input instanceof HTMLInputElement);
    expect(input.indeterminate).toBe(true);
  });

  it("renders disabled state", () => {
    render(Checkbox, { disabled: true });

    const input = screen.getByRole("checkbox");
    expect(input).toBeDisabled();
  });

  it("renders with hidden label", () => {
    render(Checkbox, { hideLabel: true });

    const labelText = screen.getByText("Checkbox label");
    const label = labelText.closest("label");
    assert(label);
    const hiddenElement = label.querySelector(".bx--visually-hidden");
    expect(hiddenElement).toBeInTheDocument();
  });

  it("renders with custom label text", () => {
    render(Checkbox, { labelText: "Custom label" });

    const label = screen.getByText("Custom label");
    expect(label).toHaveTextContent("Custom label");
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
    const consoleLog = vi.spyOn(console, "log");
    render(CheckboxGroup);

    const checkbox1 = screen.getByRole("checkbox", { name: "Option 1" });
    const checkbox2 = screen.getByRole("checkbox", { name: "Option 2" });
    const checkbox3 = screen.getByRole("checkbox", { name: "Option 3" });

    expect(checkbox1).not.toBeChecked();
    expect(checkbox2).toBeChecked();
    expect(checkbox3).not.toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith(["option-2"]);

    await user.click(checkbox1);
    expect(checkbox1).toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith(["option-2", "option-1"]);

    await user.click(checkbox2);
    expect(checkbox2).not.toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith(["option-2"]);

    await user.click(checkbox3);
    expect(checkbox3).toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith(["option-1", "option-3"]);
  });

  it("emits exactly one check event per click in checkbox groups", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(CheckboxGroupEvents);

    const checkbox1 = screen.getByRole("checkbox", { name: "Option 1" });
    const checkbox2 = screen.getByRole("checkbox", { name: "Option 2" });
    const checkbox3 = screen.getByRole("checkbox", { name: "Option 3" });

    consoleLog.mockClear();
    await user.click(checkbox1);
    const checkCalls1 = consoleLog.mock.calls.filter(
      (call) => call[0] === "check" && call[1] === "option-1",
    );
    expect(checkCalls1).toHaveLength(1);
    expect(checkCalls1[0][3]).toBe(1);

    consoleLog.mockClear();
    await user.click(checkbox2);
    const checkCalls2 = consoleLog.mock.calls.filter(
      (call) => call[0] === "check" && call[1] === "option-2",
    );
    expect(checkCalls2).toHaveLength(1);

    consoleLog.mockClear();
    await user.click(checkbox3);
    const checkCalls3 = consoleLog.mock.calls.filter(
      (call) => call[0] === "check" && call[1] === "option-3",
    );
    expect(checkCalls3).toHaveLength(1);
    expect(checkCalls3[0][3]).toBe(1);
  });

  it("handles rapid group checkbox interactions without duplicate events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(CheckboxGroupEvents);

    const checkbox1 = screen.getByRole("checkbox", { name: "Option 1" });
    const checkbox2 = screen.getByRole("checkbox", { name: "Option 2" });

    consoleLog.mockClear();
    await user.click(checkbox1);
    await user.click(checkbox2);
    await user.click(checkbox1);

    const checkCalls1 = consoleLog.mock.calls.filter(
      (call) => call[0] === "check" && call[1] === "option-1",
    );
    const checkCalls2 = consoleLog.mock.calls.filter(
      (call) => call[0] === "check" && call[1] === "option-2",
    );

    expect(checkCalls1).toHaveLength(2);
    expect(checkCalls2).toHaveLength(1);
  });

  it("emits check event when group is updated externally", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { component } = render(CheckboxGroupReactive);

    const checkbox1 = screen.getByRole("checkbox", { name: "Option 1" });

    consoleLog.mockClear();
    component.setGroup(["option-2", "option-1"]);
    await tick();

    expect(checkbox1).toBeChecked();
    const groupValue = screen.getByTestId("group-value");
    expect(groupValue.textContent).toContain("option-1");
  });

  it("supports custom label slot", () => {
    render(CheckboxSlot);

    const customLabel = screen.getByTestId("custom-label");
    expect(customLabel).toBeInTheDocument();
    expect(customLabel).toHaveTextContent("Custom label content");
  });

  it("renders multiple checkboxes with default values", () => {
    render(MultipleCheckboxes);

    expect(screen.getByTestId("checkbox-0")).toBeInTheDocument();
    expect(screen.getByTestId("checkbox-1")).toBeInTheDocument();
    expect(screen.getByTestId("checkbox-2")).toBeInTheDocument();

    const appleCheckbox = screen.getByRole("checkbox", { name: "Apple" });
    const bananaCheckbox = screen.getByRole("checkbox", { name: "Banana" });
    const coconutCheckbox = screen.getByRole("checkbox", { name: "Coconut" });

    expect(appleCheckbox).toBeChecked();
    expect(bananaCheckbox).toBeChecked();
    expect(coconutCheckbox).not.toBeChecked();

    expect(screen.getByTestId("selected-values")).toHaveTextContent(
      '["Apple","Banana"]',
    );
  });

  it("handles checkbox selection changes", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(MultipleCheckboxes);

    const coconutCheckbox = screen.getByRole("checkbox", { name: "Coconut" });

    await user.click(coconutCheckbox);

    expect(coconutCheckbox).toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith("group changed:", [
      "Apple",
      "Banana",
      "Coconut",
    ]);
    expect(screen.getByTestId("selected-values")).toHaveTextContent(
      '["Apple","Banana","Coconut"]',
    );
  });

  it("handles button click to set specific value", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(MultipleCheckboxes);

    await user.click(screen.getByText(/Set to/));

    expect(consoleLog).toHaveBeenCalledWith("set to banana");
    expect(consoleLog).toHaveBeenCalledWith("group changed:", ["Banana"]);

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

  it("handles deselection of checkboxes", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(MultipleCheckboxes);

    const bananaCheckbox = screen.getByRole("checkbox", { name: "Banana" });

    await user.click(bananaCheckbox);

    expect(bananaCheckbox).not.toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith("group changed:", ["Apple"]);
    expect(screen.getByTestId("selected-values")).toHaveTextContent(
      '["Apple"]',
    );
  });

  it("renders multiple checkboxes bound to object properties", () => {
    render(MultipleCheckboxesObject);

    expect(screen.getByTestId("checkbox-a")).toBeInTheDocument();
    expect(screen.getByTestId("checkbox-b")).toBeInTheDocument();

    const checkboxA = screen.getByRole("checkbox", { name: "A" });
    const checkboxB = screen.getByRole("checkbox", { name: "B" });

    expect(checkboxA).not.toBeChecked();
    expect(checkboxB).not.toBeChecked();

    expect(screen.getByTestId("object-values")).toHaveTextContent(
      '{"a":false,"b":false}',
    );
  });

  it("handles checkbox selection changes with object binding", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(MultipleCheckboxesObject);

    const checkboxA = screen.getByRole("checkbox", { name: "A" });

    await user.click(checkboxA);

    expect(checkboxA).toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith("object changed:", {
      a: true,
      b: false,
    });
    expect(screen.getByTestId("object-values")).toHaveTextContent(
      '{"a":true,"b":false}',
    );
  });

  it("handles multiple checkbox selections with object binding", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(MultipleCheckboxesObject);

    const checkboxA = screen.getByRole("checkbox", { name: "A" });
    const checkboxB = screen.getByRole("checkbox", { name: "B" });

    await user.click(checkboxA);
    expect(checkboxA).toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith("object changed:", {
      a: true,
      b: false,
    });

    await user.click(checkboxB);
    expect(checkboxB).toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith("object changed:", {
      a: true,
      b: true,
    });

    expect(screen.getByTestId("object-values")).toHaveTextContent(
      '{"a":true,"b":true}',
    );
  });

  it("handles checkbox deselection with object binding", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(MultipleCheckboxesObject, {
      props: {
        obj: { a: true, b: true },
      },
    });

    const checkboxA = screen.getByRole("checkbox", { name: "A" });
    const checkboxB = screen.getByRole("checkbox", { name: "B" });

    expect(checkboxA).toBeChecked();
    expect(checkboxB).toBeChecked();

    await user.click(checkboxA);
    expect(checkboxA).not.toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith("object changed:", {
      a: false,
      b: true,
    });

    await user.click(checkboxB);
    expect(checkboxB).not.toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith("object changed:", {
      a: false,
      b: false,
    });

    expect(screen.getByTestId("object-values")).toHaveTextContent(
      '{"a":false,"b":false}',
    );
  });

  it("accepts custom initial object state", () => {
    render(MultipleCheckboxesObject, {
      props: {
        obj: { a: true, b: false },
      },
    });

    const checkboxA = screen.getByRole("checkbox", { name: "A" });
    const checkboxB = screen.getByRole("checkbox", { name: "B" });

    expect(checkboxA).toBeChecked();
    expect(checkboxB).not.toBeChecked();

    expect(screen.getByTestId("object-values")).toHaveTextContent(
      '{"a":true,"b":false}',
    );
  });

  it("renders readonly state with aria-readonly attribute", () => {
    render(CheckboxReadonly, { readonly: true });

    const input = screen.getByRole("checkbox");
    expect(input).toHaveAttribute("aria-readonly", "true");
  });

  it("prevents state change when readonly and unchecked", async () => {
    render(CheckboxReadonly, { checked: false, readonly: true });

    const input = screen.getByRole("checkbox");
    expect(input).not.toBeChecked();

    await user.click(input);
    expect(input).not.toBeChecked();
  });

  it("prevents state change when readonly and checked", async () => {
    render(CheckboxReadonly, { checked: true, readonly: true });

    const input = screen.getByRole("checkbox");
    expect(input).toBeChecked();

    await user.click(input);
    expect(input).toBeChecked();
  });

  it("allows state change when not readonly", async () => {
    render(CheckboxReadonly, { checked: false, readonly: false });

    const input = screen.getByRole("checkbox");
    expect(input).not.toBeChecked();

    await user.click(input);
    expect(input).toBeChecked();
  });

  it("should render helper text when provided", () => {
    render(Checkbox, { helperText: "Helper text message" });
    const helperElement = screen.getByText("Helper text message");
    expect(helperElement).toHaveTextContent("Helper text message");
    expect(helperElement).toHaveClass("bx--form__helper-text");
  });

  it("should not render helper text by default", () => {
    render(Checkbox);
    const helperElement = screen.queryByText("Helper text message");
    expect(helperElement).not.toBeInTheDocument();
  });
});
