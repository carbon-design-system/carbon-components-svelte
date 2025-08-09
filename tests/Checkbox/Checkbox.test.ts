import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import CheckboxGroup from "./Checkbox.group.test.svelte";
import CheckboxSkeleton from "./Checkbox.skeleton.test.svelte";
import CheckboxSlot from "./Checkbox.slot.test.svelte";
import Checkbox from "./Checkbox.test.svelte";
import MultipleCheckboxes from "./MultipleCheckboxes.test.svelte";

describe("Checkbox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with default props", () => {
    render(Checkbox);

    const checkbox = screen.getByTestId("checkbox");
    expect(checkbox).toBeInTheDocument();

    const input = checkbox.querySelector("input[type='checkbox']");
    assert(input);
    expect(input).not.toBeChecked();
    expect(input).not.toBeDisabled();
    expect(input).not.toHaveAttribute("indeterminate");

    const label = checkbox.querySelector("label");
    assert(label);
    expect(label).toHaveTextContent("Checkbox label");
    const hiddenElement = label.querySelector(".bx--visually-hidden");
    expect(hiddenElement).not.toBeInTheDocument();
  });

  it("renders checked state", () => {
    render(Checkbox, { checked: true });

    const input = screen
      .getByTestId("checkbox")
      .querySelector("input[type='checkbox']");
    assert(input);
    expect(input).toBeChecked();
  });

  it("emits events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Checkbox);

    const input = screen
      .getByTestId("checkbox")
      .querySelector("input[type='checkbox']");
    assert(input);
    await user.click(input);
    expect(consoleLog).toHaveBeenCalledWith("check");
    expect(consoleLog).toHaveBeenCalledWith("click");
    expect(consoleLog).toHaveBeenCalledTimes(2);
  });

  it("renders indeterminate state", () => {
    render(Checkbox, { indeterminate: true });

    const input = screen
      .getByTestId("checkbox")
      .querySelector("input[type='checkbox']");
    assert(input);
    assert(input instanceof HTMLInputElement);
    expect(input.indeterminate).toBe(true);
  });

  it("renders disabled state", () => {
    render(Checkbox, { disabled: true });

    const input = screen
      .getByTestId("checkbox")
      .querySelector("input[type='checkbox']");
    assert(input);
    expect(input).toBeDisabled();
  });

  it("renders with hidden label", () => {
    render(Checkbox, { hideLabel: true });

    const label = screen.getByTestId("checkbox").querySelector("label");
    assert(label);
    const hiddenElement = label.querySelector(".bx--visually-hidden");
    expect(hiddenElement).toBeInTheDocument();
  });

  it("renders with custom label text", () => {
    render(Checkbox, { labelText: "Custom label" });

    const label = screen.getByTestId("checkbox").querySelector("label");
    assert(label);
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

    const checkbox1 = screen
      .getByTestId("checkbox-1")
      .querySelector("input[type='checkbox']");
    const checkbox2 = screen
      .getByTestId("checkbox-2")
      .querySelector("input[type='checkbox']");
    const checkbox3 = screen
      .getByTestId("checkbox-3")
      .querySelector("input[type='checkbox']");
    assert(checkbox1);
    assert(checkbox2);
    assert(checkbox3);

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

    const appleCheckbox = screen
      .getByTestId("checkbox-0")
      .querySelector("input[type='checkbox']");
    const bananaCheckbox = screen
      .getByTestId("checkbox-1")
      .querySelector("input[type='checkbox']");
    const coconutCheckbox = screen
      .getByTestId("checkbox-2")
      .querySelector("input[type='checkbox']");

    assert(appleCheckbox);
    assert(bananaCheckbox);
    assert(coconutCheckbox);

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

    const coconutCheckbox = screen
      .getByTestId("checkbox-2")
      .querySelector("input[type='checkbox']");
    assert(coconutCheckbox);

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

    const appleCheckbox = screen
      .getByTestId("checkbox-0")
      .querySelector("input[type='checkbox']");
    const bananaCheckbox = screen
      .getByTestId("checkbox-1")
      .querySelector("input[type='checkbox']");
    const coconutCheckbox = screen
      .getByTestId("checkbox-2")
      .querySelector("input[type='checkbox']");

    assert(appleCheckbox);
    assert(bananaCheckbox);
    assert(coconutCheckbox);

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

    const bananaCheckbox = screen
      .getByTestId("checkbox-1")
      .querySelector("input[type='checkbox']");
    assert(bananaCheckbox);

    await user.click(bananaCheckbox);

    expect(bananaCheckbox).not.toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith("group changed:", ["Apple"]);
    expect(screen.getByTestId("selected-values")).toHaveTextContent(
      '["Apple"]',
    );
  });
});
