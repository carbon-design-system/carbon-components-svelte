import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import Stepper from "./Stepper.test.svelte";
import { stepsWith } from "./helpers";

const continueButton = () => screen.getByRole("button", { name: "Continue" });

describe("Stepper", () => {
  it("renders the steps, the first step's content and Continue only", () => {
    render(Stepper);

    expect(screen.getByText("Step 1 content")).toBeVisible();
    expect(screen.getByRole("group", { name: "Cart" })).toBeInTheDocument();
    expect(continueButton()).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    expect(stepsWith("current")).toBe(1);
  });

  it("moves forward and back, marks passed steps complete and focuses the step", async () => {
    const { component } = render(Stepper);

    await user.click(continueButton());
    expect(screen.getByText("Step 2 content")).toBeVisible();
    expect(screen.getByRole("group", { name: "Delivery" })).toHaveFocus();
    expect(stepsWith("complete")).toBe(1);

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

  it.each([
    [
      "throws",
      () => {
        throw new Error("Offline");
      },
    ],
    ["rejects", () => Promise.reject(new Error("Offline"))],
  ])(
    "dispatches validate:error and stays on the step when validate %s",
    async (_case, validate) => {
      const { component } = render(Stepper, { validate });

      await user.click(continueButton());

      await vi.waitFor(() => expect(component.validateErrors).toHaveLength(1));
      expect(component.validateErrors).toEqual([
        { error: new Error("Offline"), index: 0 },
      ]);
      expect(screen.getByText("Step 1 content")).toBeVisible();
      expect(continueButton()).toBeEnabled();
    },
  );

  it.each([
    [0, "Continue"],
    [2, "Place order"],
  ])(
    "disables the button on step %s with nextDisabled",
    (currentIndex, name) => {
      render(Stepper, { currentIndex, nextDisabled: true });

      expect(screen.getByRole("button", { name })).toBeDisabled();
    },
  );

  it("dispatches submit on the last step once validate passes", async () => {
    const validate = vi.fn(() => true);
    const { component } = render(Stepper, { currentIndex: 2, validate });

    await user.click(screen.getByRole("button", { name: "Place order" }));

    expect(validate).toHaveBeenCalledWith(2);
    expect(component.submits).toBe(1);
    expect(component.errors).toEqual([]);
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
    expect(stepsWith("complete")).toBe(3);
  });

  it("waits for an async validate, showing its loading state", async () => {
    let finish = (_valid: boolean) => {};
    const validate = () =>
      new Promise<boolean>((resolve) => (finish = resolve));
    render(Stepper, { validate });

    await user.click(continueButton());
    expect(screen.getByText("Checking address")).toBeInTheDocument();

    finish(true);
    expect(await screen.findByText("Step 2 content")).toBeVisible();
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

    const confirmation = await screen.findByText("Order placed");
    expect(confirmation).toBeVisible();
    expect(confirmation.parentElement).toHaveFocus();
    // The confirmation isn't the step it replaced.
    expect(screen.queryByRole("group", { name: "Payment" })).toBeNull();
  });

  it("marks the flow submitted when a sync submit returns", async () => {
    render(Stepper, { currentIndex: 2, submit: () => {} });

    await user.click(screen.getByRole("button", { name: "Place order" }));

    expect(await screen.findByText("Order placed")).toBeVisible();
  });

  it("shows the loading state and disables Back while a submit promise is pending", async () => {
    let finish = () => {};
    const submit = () => new Promise<void>((resolve) => (finish = resolve));
    render(Stepper, { currentIndex: 2, submit });

    await user.click(screen.getByRole("button", { name: "Place order" }));
    expect(screen.getByText("Placing order")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();

    finish();
    expect(await screen.findByText("Order placed")).toBeVisible();
  });

  it("focuses an input inside a wrapper marked invalid", async () => {
    const { component } = render(Stepper, { currentIndex: 1 });
    component.validate = () => {
      component.wrapperInvalid = true;
      return false;
    };
    await tick();

    await user.click(continueButton());

    expect(screen.getByRole("textbox", { name: "Wrapped" })).toHaveFocus();
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

  it.each([
    ["busy", { submitting: true }],
    ["submitted", { submitted: true }],
  ])("ignores step clicks while %s", async (_state, props) => {
    const { component } = render(Stepper, { currentIndex: 2, ...props });

    await user.click(screen.getByRole("button", { name: /Cart/ }));

    expect(component.changes).toEqual([]);
    expect(component.currentIndex).toBe(2);
  });

  it("moves to the last step when the list gets shorter", async () => {
    const { rerender } = render(Stepper, { currentIndex: 2 });

    await rerender({ steps: ["Cart", "Delivery"] });

    expect(screen.getByText("Step 2 content")).toBeVisible();
    expect(screen.getByRole("button", { name: "Place order" })).toBeEnabled();
  });
});
