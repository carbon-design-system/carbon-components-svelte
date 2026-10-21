import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import FluidFormActionsTest from "./FluidForm.actions.test.svelte";
import FluidFormTest from "./FluidForm.test.svelte";

describe("FluidForm", () => {
  it("merges a consumer class with the fluid form classes", () => {
    render(FluidFormTest, { class: "custom" });
    expect(screen.getByTestId("fluid-form")).toHaveClass(
      "bx--form",
      "bx--form--fluid",
      "custom",
    );
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
  });

  describe("form submission", () => {
    it("handles form submission", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(FluidFormTest);

      const submitButton = screen.getByRole("button", { name: "Submit" });
      await user.click(submitButton);

      expect(consoleLog).toHaveBeenCalledWith("submit", expect.any(Event));
    });

    it.each([
      [true, false],
      [false, true],
    ])(
      "submit handler preventDefault=%s: event proceeds=%s",
      (preventDefault, proceeds) => {
        render(FluidFormTest, { preventDefault });

        const form = screen.getByTestId("fluid-form");
        const notCancelled = form.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );

        expect(notCancelled).toBe(proceeds);
      },
    );
  });

  describe("form reset", () => {
    it("forwards reset from a reset button", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(FluidFormTest);

      await user.click(screen.getByRole("button", { name: "Reset" }));

      expect(consoleLog).toHaveBeenCalledWith("reset", expect.any(Event));
    });
  });
});
