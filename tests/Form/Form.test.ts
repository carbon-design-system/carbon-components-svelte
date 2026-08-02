import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import FormActionsTest from "./Form.actions.test.svelte";
import FormTest from "./Form.test.svelte";

describe("Form", () => {
  it("renders with default props", () => {
    render(FormTest);
    const form = screen.getByTestId("form");
    expect(form).toBeInTheDocument();
    expect(form).toHaveClass("bx--form");
  });

  describe("actions", () => {
    it("calls each action with the form element", () => {
      const action = vi.fn(() => ({ destroy: vi.fn() }));
      render(FormActionsTest, { props: { actions: [action] } });
      const form = screen.getByTestId("form");
      expect(action).toHaveBeenCalledTimes(1);
      expect(action).toHaveBeenCalledWith(form);
    });

    it("invokes destroy on unmount", () => {
      const destroy = vi.fn();
      const action = vi.fn(() => ({ destroy }));
      const { unmount } = render(FormActionsTest, {
        props: { actions: [action] },
      });
      expect(destroy).not.toHaveBeenCalled();
      unmount();
      expect(destroy).toHaveBeenCalledTimes(1);
    });

    it("passes tuple parameters to actions", () => {
      const action = vi.fn(() => ({ destroy: vi.fn() }));
      const parameter = { submit: vi.fn() };
      render(FormActionsTest, {
        props: { actions: [[action, parameter]] },
      });
      const form = screen.getByTestId("form");
      expect(action).toHaveBeenCalledWith(form, parameter);
    });

    it("preserves bind:ref alongside actions", () => {
      const action = vi.fn(() => ({ destroy: vi.fn() }));
      const { component } = render(FormActionsTest, {
        props: { actions: [action] },
      });
      const form = screen.getByTestId("form");
      expect(component.ref).toBe(form);
    });
  });

  it("renders form elements correctly", () => {
    render(FormTest);

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
      render(FormTest);

      const submitButton = screen.getByRole("button", { name: "Submit" });
      await user.click(submitButton);

      expect(consoleLog).toHaveBeenCalledWith("submit", expect.any(Event));
    });

    it("prevents default submission when preventDefault is true", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const preventDefaultSpy = vi.fn();

      render(FormTest, { preventDefault: true });

      const submitButton = screen.getByRole("button", { name: "Submit" });
      await user.click(submitButton);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
      expect(consoleLog).toHaveBeenCalled();
    });
  });
});
