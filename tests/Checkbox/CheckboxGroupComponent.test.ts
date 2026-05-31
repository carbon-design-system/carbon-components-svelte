import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import CheckboxGroupReadonly from "./CheckboxGroup.readonly.test.svelte";
import CheckboxGroupComponent from "./CheckboxGroupComponent.test.svelte";
import CheckboxGroupStaticSelected from "./CheckboxGroupStaticSelected.test.svelte";
import CheckboxReadonlyChange from "./CheckboxReadonlyChange.test.svelte";

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

  it("does not dispatch change event on initial render", () => {
    const consoleLog = vi.spyOn(console, "log");
    render(CheckboxGroupComponent);

    expect(consoleLog.mock.calls.some(([event]) => event === "change")).toBe(
      false,
    );
  });

  it("does not dispatch change event on initial render with selected values", () => {
    const consoleLog = vi.spyOn(console, "log");
    render(CheckboxGroupComponent, { props: { selected: ["2"] } });

    expect(consoleLog.mock.calls.some(([event]) => event === "change")).toBe(
      false,
    );
  });

  it("does not dispatch change event on initial render with a static selected array", () => {
    const consoleLog = vi.spyOn(console, "log");
    render(CheckboxGroupStaticSelected);

    expect(consoleLog.mock.calls.some(([event]) => event === "change")).toBe(
      false,
    );
  });

  it("dispatches one change event after interacting with a static selected array", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(CheckboxGroupStaticSelected);

    const smsCheckbox = screen.getByRole("checkbox", { name: "SMS" });
    await user.click(smsCheckbox);

    const changeCalls = consoleLog.mock.calls.filter(
      ([event]) => event === "change",
    );
    expect(changeCalls).toEqual([["change", ["email", "sms"]]]);
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

  it("associates helper text with the fieldset via aria-describedby", () => {
    render(CheckboxGroupComponent, {
      props: { helperText: "Helper text message" },
    });

    const fieldset = screen.getByRole("group");
    const helperId = fieldset.getAttribute("aria-describedby");
    assert(helperId);

    const helper = document.getElementById(helperId);
    expect(helper).toHaveTextContent("Helper text message");
  });

  it("does not set aria-describedby on the fieldset when helper text is absent", () => {
    render(CheckboxGroupComponent);

    const fieldset = screen.getByRole("group");
    expect(fieldset).not.toHaveAttribute("aria-describedby");
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

  describe("readonly (group)", () => {
    it("should apply readonly class on the fieldset", () => {
      const { container } = render(CheckboxGroupReadonly, {
        readonly: true,
      });

      expect(
        container.querySelector(".bx--checkbox-group--readonly"),
      ).toBeTruthy();
    });

    it("should not change selection when clicking another checkbox", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(CheckboxGroupReadonly, { selected: ["1"], readonly: true });

      const option2 = screen.getByRole("checkbox", { name: "Option 2" });
      await user.click(option2);

      expect(option2).not.toBeChecked();
      expect(screen.getByRole("checkbox", { name: "Option 1" })).toBeChecked();
      expect(consoleLog).not.toHaveBeenCalledWith("change", ["1", "2"]);
    });

    it("should not forward a child Checkbox's on:change when the group is readonly", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(CheckboxReadonlyChange);

      const option2 = screen.getByRole("checkbox", { name: "Option 2" });
      await fireEvent.change(option2);

      expect(consoleLog).not.toHaveBeenCalledWith("checkbox-change", "2");
    });

    it("should allow selection when readonly is false", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(CheckboxGroupReadonly, { selected: ["1"], readonly: false });

      const option2 = screen.getByRole("checkbox", { name: "Option 2" });
      await user.click(option2);

      expect(option2).toBeChecked();
      expect(consoleLog).toHaveBeenCalledWith("change", ["1", "2"]);
    });

    it("should not change selection when readonly flips to true after mount", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { rerender } = render(CheckboxGroupReadonly, {
        selected: ["1"],
        readonly: false,
      });

      await rerender({ selected: ["1"], readonly: true });
      await tick();

      const option2 = screen.getByRole("checkbox", { name: "Option 2" });
      await user.click(option2);

      expect(screen.getByRole("checkbox", { name: "Option 1" })).toBeChecked();
      expect(option2).not.toBeChecked();
      expect(consoleLog).not.toHaveBeenCalledWith("change", ["1", "2"]);
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
