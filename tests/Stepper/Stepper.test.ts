import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import Stepper from "./Stepper.test.svelte";

const continueButton = () => screen.getByRole("button", { name: "Continue" });

describe("Stepper", () => {
  it("renders the steps, the first step's content and Continue only", () => {
    render(Stepper);

    expect(screen.getByText("Step 1 content")).toBeVisible();
    expect(screen.getByRole("group", { name: "Cart" })).toBeInTheDocument();
    expect(continueButton()).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    expect(
      document.querySelectorAll(".bx--progress-step--current"),
    ).toHaveLength(1);
  });

  it("moves forward and back, marks passed steps complete and focuses the step", async () => {
    const { component } = render(Stepper);

    await user.click(continueButton());
    expect(screen.getByText("Step 2 content")).toBeVisible();
    expect(screen.getByRole("group", { name: "Delivery" })).toHaveFocus();
    expect(
      document.querySelectorAll(".bx--progress-step--complete"),
    ).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("Step 1 content")).toBeVisible();
    expect(component.changes).toEqual([1, 0]);
  });

  it("stays on the step when validate returns false", async () => {
    const validate = vi.fn(() => false);
    render(Stepper, { validate });

    await user.click(continueButton());

    expect(validate).toHaveBeenCalledWith(0);
    expect(screen.getByText("Step 1 content")).toBeVisible();
  });

  it("disables Continue with nextDisabled", () => {
    render(Stepper, { nextDisabled: true });

    expect(continueButton()).toBeDisabled();
  });

  it("dispatches submit on the last step once validate passes", async () => {
    const validate = vi.fn(() => true);
    const { component } = render(Stepper, { currentIndex: 2, validate });

    await user.click(screen.getByRole("button", { name: "Place order" }));

    expect(validate).toHaveBeenCalledWith(2);
    expect(component.submits).toBe(1);
  });

  it("shows the loading state and disables Back while submitting", () => {
    render(Stepper, { currentIndex: 2, submitting: true });

    expect(screen.getByText("Placing order")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
  });

  it("completes every step and removes the buttons once submitted", async () => {
    const { rerender } = render(Stepper, { currentIndex: 2 });

    await rerender({ submitted: true });

    expect(screen.getByText("Order placed")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Place order" })).toBeNull();
    expect(
      document.querySelectorAll(".bx--progress-step--complete"),
    ).toHaveLength(3);
  });

  it("waits for an async validate, showing its loading state", async () => {
    let finish = (_valid: boolean) => {};
    const validate = () =>
      new Promise<boolean>((resolve) => (finish = resolve));
    render(Stepper, { validate });

    await user.click(continueButton());
    expect(screen.getByText("Checking address")).toBeInTheDocument();

    finish(true);
    await vi.waitFor(() =>
      expect(screen.getByText("Step 2 content")).toBeVisible(),
    );
  });

  it("focuses the first invalid field when validate fails", async () => {
    const { component } = render(Stepper, { currentIndex: 1 });
    component.validate = () => {
      component.addressInvalid = true;
      return false;
    };
    await tick();

    await user.click(continueButton());

    expect(screen.getByRole("textbox", { name: "Address" })).toHaveFocus();
  });

  it("runs submit and marks the flow submitted once it resolves", async () => {
    render(Stepper, { currentIndex: 2, submit: () => Promise.resolve() });

    await user.click(screen.getByRole("button", { name: "Place order" }));

    await vi.waitFor(() =>
      expect(screen.getByText("Order placed")).toBeVisible(),
    );
    // The confirmation isn't the step it replaced.
    expect(screen.queryByRole("group", { name: "Payment" })).toBeNull();
  });

  it("reports a failed submit and focuses the submit button", async () => {
    const error = new Error("Card declined");
    const { component } = render(Stepper, {
      currentIndex: 2,
      submit: () => Promise.reject(error),
    });

    await user.click(screen.getByRole("button", { name: "Place order" }));

    await vi.waitFor(() => expect(component.errors).toEqual([error]));
    expect(screen.getByRole("button", { name: "Place order" })).toHaveFocus();
    expect(screen.queryByText("Order placed")).toBeNull();
  });

  it("goes back to a completed step when it is clicked", async () => {
    const { component } = render(Stepper, { currentIndex: 2 });

    await user.click(screen.getByRole("button", { name: /Cart/ }));

    expect(screen.getByText("Step 1 content")).toBeVisible();
    expect(component.changes).toEqual([0]);
  });

  it("moves to the last step when the list gets shorter", async () => {
    const { rerender } = render(Stepper, { currentIndex: 2 });

    await rerender({ steps: ["Cart", "Delivery"] });

    expect(screen.getByText("Step 2 content")).toBeVisible();
    expect(screen.getByRole("button", { name: "Place order" })).toBeEnabled();
  });
});
