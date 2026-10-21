import { render, screen } from "@testing-library/svelte";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import FluidFormActionsTest from "./FluidForm.actions.test.svelte";
import FluidFormTest from "./FluidForm.test.svelte";

describe("FluidForm", () => {
  it("merges a consumer class with the fluid form classes", () => {
    render(FluidFormTest, { class: "custom" });
    expect(getForm()).toHaveClass("bx--form", "bx--form--fluid", "custom");
  });

  it("exposes ref to the underlying form element", () => {
    const { component } = render(FluidFormTest);
    const form = getForm();
    expect(component.ref).toBe(form);
    expect(component.ref?.tagName).toBe("FORM");
  });

  describe("actions", () => {
    it("calls each action with the form element", () => {
      const action = vi.fn(() => ({ destroy: vi.fn() }));
      render(FluidFormActionsTest, { props: { actions: [action] } });
      const form = getForm();
      expect(action).toHaveBeenCalledTimes(1);
      expect(action).toHaveBeenCalledWith(form);
    });
  });

  describe("form submission", () => {
    it("handles form submission", async () => {
      const onsubmit = vi.fn();
      render(FluidFormTest, { onsubmit });

      const submitButton = screen.getByRole("button", { name: "Submit" });
      await user.click(submitButton);

      expect(onsubmit).toHaveBeenCalledWith(expect.any(Event));
    });

    it.each([
      [true, false],
      [false, true],
    ])(
      "submit handler preventDefault=%s: event proceeds=%s",
      (preventDefault, proceeds) => {
        render(FluidFormTest, { preventDefault });

        const form = getForm();
        const notCancelled = form.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );

        expect(notCancelled).toBe(proceeds);
      },
    );
  });

  it.each([
    ["click", MouseEvent],
    ["keydown", KeyboardEvent],
    ["mouseover", MouseEvent],
    ["mouseenter", MouseEvent],
    ["mouseleave", MouseEvent],
  ])("forwards %s", (type, EventType) => {
    const onevent = vi.fn();
    render(FluidFormTest, { onevent });

    getForm().dispatchEvent(new EventType(type));

    expect(onevent).toHaveBeenCalledExactlyOnceWith(type);
  });

  describe("form reset", () => {
    it("forwards reset from a reset button", async () => {
      const onreset = vi.fn();
      render(FluidFormTest, { onreset });

      await user.click(screen.getByRole("button", { name: "Reset" }));

      expect(onreset).toHaveBeenCalledWith(expect.any(Event));
    });
  });
});
