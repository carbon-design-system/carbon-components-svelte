import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import CheckboxGroupComponent from "./CheckboxGroupComponent.test.svelte";

describe("CheckboxGroup", () => {
  it("should render with default props", () => {
    render(CheckboxGroupComponent);

    expect(screen.getByRole("group")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Option 1" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Option 2" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Option 3" }),
    ).toBeInTheDocument();
  });

  it("should handle selected values", () => {
    render(CheckboxGroupComponent, { props: { selected: ["1", "3"] } });

    expect(screen.getByRole("checkbox", { name: "Option 1" })).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Option 2" }),
    ).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Option 3" })).toBeChecked();
  });

  it("should handle disabled state", () => {
    render(CheckboxGroupComponent, { props: { disabled: true } });

    const fieldset = screen.getByRole("group");
    expect(fieldset).toBeDisabled();
  });

  it("should handle required state", () => {
    render(CheckboxGroupComponent, { props: { required: true } });

    const checkboxes = screen.getAllByRole("checkbox");
    for (const checkbox of checkboxes) {
      expect(checkbox).toBeRequired();
    }
  });

  it("should handle custom name", () => {
    render(CheckboxGroupComponent, { props: { name: "custom-group" } });

    const checkboxes = screen.getAllByRole("checkbox");
    for (const checkbox of checkboxes) {
      expect(checkbox).toHaveAttribute("name", "custom-group");
    }
  });

  it("should handle legend text", () => {
    render(CheckboxGroupComponent, {
      props: { legendText: "Choose options" },
    });

    expect(screen.getByText("Choose options")).toBeInTheDocument();
  });

  it("should hide legend visually", () => {
    render(CheckboxGroupComponent, {
      props: { legendText: "Legend", hideLegend: true },
    });

    const legend = screen.getByText("Legend");
    expect(legend).toHaveClass("bx--visually-hidden");
  });

  it("should handle custom id", () => {
    render(CheckboxGroupComponent, {
      props: { id: "custom-id" },
    });

    const formItem = document.getElementById("custom-id");
    expect(formItem).toBeInTheDocument();
  });

  it("should handle change event on selection", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(CheckboxGroupComponent);

    const checkbox2 = screen.getByRole("checkbox", { name: "Option 2" });
    await user.click(checkbox2);

    expect(checkbox2).toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith("change", ["2"]);
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

  it("should update selected value on checkbox clicks", async () => {
    const { component } = render(CheckboxGroupComponent);

    const checkbox1 = screen.getByRole("checkbox", { name: "Option 1" });
    await user.click(checkbox1);
    expect(component.selected).toEqual(["1"]);

    const checkbox3 = screen.getByRole("checkbox", { name: "Option 3" });
    await user.click(checkbox3);
    expect(component.selected).toEqual(["1", "3"]);

    // Deselect checkbox1
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
    render(CheckboxGroupComponent);
    const helperElement = screen.queryByText("Helper text message");
    expect(helperElement).not.toBeInTheDocument();
  });

  it("should support multiple selections", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(CheckboxGroupComponent);

    const checkbox1 = screen.getByRole("checkbox", { name: "Option 1" });
    const checkbox2 = screen.getByRole("checkbox", { name: "Option 2" });
    const checkbox3 = screen.getByRole("checkbox", { name: "Option 3" });

    await user.click(checkbox1);
    await user.click(checkbox2);
    await user.click(checkbox3);

    expect(checkbox1).toBeChecked();
    expect(checkbox2).toBeChecked();
    expect(checkbox3).toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith("change", ["1", "2", "3"]);
  });

  it("should support deselection", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(CheckboxGroupComponent, {
      props: { selected: ["1", "2", "3"] },
    });

    const checkbox2 = screen.getByRole("checkbox", { name: "Option 2" });
    await user.click(checkbox2);

    expect(checkbox2).not.toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith("change", ["1", "3"]);
  });

  it("should pre-select checkboxes from initial selected prop", () => {
    render(CheckboxGroupComponent, {
      props: { selected: ["2"] },
    });

    expect(
      screen.getByRole("checkbox", { name: "Option 1" }),
    ).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Option 2" })).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Option 3" }),
    ).not.toBeChecked();
  });
});
