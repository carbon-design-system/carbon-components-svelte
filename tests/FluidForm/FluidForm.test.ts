import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import FluidFormActionsTest from "./FluidForm.actions.test.svelte";
import FluidFormTest from "./FluidForm.test.svelte";

describe("FluidForm", () => {
  it("renders with default props", () => {
    render(FluidFormTest);
    const form = screen.getByTestId("fluid-form");
    expect(form).toBeInTheDocument();
    expect(form).toHaveClass("bx--form--fluid");
  });

  it("exposes ref to the underlying form element", () => {
    const { component } = render(FluidFormTest);
    const form = screen.getByTestId("fluid-form");
    expect(component.ref).toBe(form);
    expect(component.ref?.tagName).toBe("FORM");
  });

  describe("actions", () => {
    it("calls each action with the form element", () => {
      const action = vi.fn(() => ({ destroy: vi.fn() }));
      render(FluidFormActionsTest, { props: { actions: [action] } });
      const form = screen.getByTestId("fluid-form");
      expect(action).toHaveBeenCalledTimes(1);
      expect(action).toHaveBeenCalledWith(form);
    });

    it("invokes destroy on unmount", () => {
      const destroy = vi.fn();
      const action = vi.fn(() => ({ destroy }));
      const { unmount } = render(FluidFormActionsTest, {
        props: { actions: [action] },
      });
      expect(destroy).not.toHaveBeenCalled();
      unmount();
      expect(destroy).toHaveBeenCalledTimes(1);
    });

    it("passes tuple parameters to actions", () => {
      const action = vi.fn(() => ({ destroy: vi.fn() }));
      const parameter = { submit: vi.fn() };
      render(FluidFormActionsTest, {
        props: { actions: [[action, parameter]] },
      });
      const form = screen.getByTestId("fluid-form");
      expect(action).toHaveBeenCalledWith(form, parameter);
    });
  });

  it("renders form elements correctly", () => {
    render(FluidFormTest);

    // Check form group
    const formGroup = screen.getByRole("group");
    expect(formGroup).toBeInTheDocument();
    expect(formGroup).toHaveTextContent("Checkboxes");

    // Check checkboxes
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[2]).toBeDisabled();

    // Check submit button
    const submitButton = screen.getByRole("button", { name: "Submit" });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute("type", "submit");
  });

  describe("form submission", () => {
    it("handles form submission", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(FluidFormTest);

      const submitButton = screen.getByRole("button", { name: "Submit" });
      await user.click(submitButton);

      expect(consoleLog).toHaveBeenCalledWith("submit", expect.any(Event));
    });

    it("prevents default submission when preventDefault is true", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const preventDefaultSpy = vi.fn();

      render(FluidFormTest, { preventDefault: true });

      const submitButton = screen.getByRole("button", { name: "Submit" });
      await user.click(submitButton);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(consoleLog).toHaveBeenCalled();
    });
  });
});
