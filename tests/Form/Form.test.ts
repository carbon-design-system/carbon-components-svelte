import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import FormTest from "./Form.test.svelte";

describe("Form", () => {
  it("renders with default props", () => {
    render(FormTest);
    const form = screen.getByTestId("form");
    expect(form).toBeInTheDocument();
    expect(form).toHaveClass("bx--form");
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
