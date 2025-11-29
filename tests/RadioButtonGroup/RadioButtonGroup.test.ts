import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import RadioButtonGroup from "./RadioButtonGroup.test.svelte";

describe("RadioButtonGroup", () => {
  it("should render with default props", () => {
    render(RadioButtonGroup);

    expect(screen.getByRole("group")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Option 1" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Option 2" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Option 3" })).toBeInTheDocument();
  });

  it("should handle selected value", () => {
    render(RadioButtonGroup, { props: { selected: "2" } });

    expect(screen.getByRole("radio", { name: "Option 2" })).toBeChecked();
  });

  it("should handle disabled state", () => {
    render(RadioButtonGroup, { props: { disabled: true } });

    const fieldset = screen.getByRole("group");
    expect(fieldset).toBeDisabled();
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

  it("should handle legend text", () => {
    render(RadioButtonGroup, { props: { legendText: "Choose an option" } });

    expect(screen.getByText("Choose an option")).toBeInTheDocument();
  });

  it("should hide legend visually", () => {
    render(RadioButtonGroup, {
      props: { legendText: "Legend", hideLegend: true },
    });

    const legend = screen.getByText("Legend");
    expect(legend).toHaveClass("bx--visually-hidden");
  });

  it("should handle label position left", () => {
    render(RadioButtonGroup, { props: { labelPosition: "left" } });

    const fieldset = screen.getByRole("group");
    expect(fieldset).toHaveClass("bx--radio-button-group--label-left");
  });

  it("should handle label position right", () => {
    render(RadioButtonGroup, { props: { labelPosition: "right" } });

    const fieldset = screen.getByRole("group");
    expect(fieldset).toHaveClass("bx--radio-button-group--label-right");
  });

  it("should handle vertical orientation", () => {
    render(RadioButtonGroup, { props: { orientation: "vertical" } });

    const fieldset = screen.getByRole("group");
    expect(fieldset).toHaveClass("bx--radio-button-group--vertical");
  });

  it("should handle horizontal orientation", () => {
    render(RadioButtonGroup, { props: { orientation: "horizontal" } });

    const fieldset = screen.getByRole("group");
    expect(fieldset).not.toHaveClass("bx--radio-button-group--vertical");
  });

  it("should handle custom id", () => {
    render(RadioButtonGroup, {
      props: { id: "custom-id" },
    });

    const formItem = document.getElementById("custom-id");
    expect(formItem).toBeInTheDocument();
  });

  it("should handle change event", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(RadioButtonGroup);

    const radio2 = screen.getByRole("radio", { name: "Option 2" });
    await user.click(radio2);

    expect(radio2).toBeChecked();
    expect(consoleLog).toHaveBeenCalledWith("change", "2");
  });

  it("should handle legend slot", () => {
    render(RadioButtonGroup, { props: { useSlot: true } });

    expect(screen.getByText("Custom Legend")).toBeInTheDocument();
  });

  it("should apply custom class", () => {
    render(RadioButtonGroup, {
      props: { customClass: "custom-group" },
    });

    const fieldset = screen.getByRole("group");
    const formItem = fieldset.closest(".bx--form-item");
    assert(formItem);
    expect(formItem).toHaveClass("custom-group");
  });

  it("should update selected value on radio change", async () => {
    const { component } = render(RadioButtonGroup);

    const radio1 = screen.getByRole("radio", { name: "Option 1" });
    await user.click(radio1);

    expect(component.selected).toBe("1");

    const radio3 = screen.getByRole("radio", { name: "Option 3" });
    await user.click(radio3);

    expect(component.selected).toBe("3");
  });

  it("should render helper text when provided", () => {
    render(RadioButtonGroup, { props: { helperText: "Helper text message" } });
    const helperElement = screen.getByText("Helper text message");
    expect(helperElement).toHaveTextContent("Helper text message");
    expect(helperElement).toHaveClass("bx--form__helper-text");
  });

  it("should not render helper text by default", () => {
    render(RadioButtonGroup);
    const helperElement = screen.queryByText("Helper text message");
    expect(helperElement).not.toBeInTheDocument();
  });
});
