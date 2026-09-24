import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import ResendCodeButton from "./ResendCodeButton.test.svelte";

const getButton = () => screen.getByRole("button");

const resendCount = (consoleLog: { mock: { calls: unknown[][] } }) =>
  consoleLog.mock.calls.filter(([event]) => event === "resend").length;

describe("ResendCodeButton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts the cooldown on mount and stays focusable", () => {
    render(ResendCodeButton);
    const button = getButton();

    expect(button).toHaveTextContent("Resend code in 30s");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveClass("bx--btn--disabled");
    expect(button).not.toBeDisabled();
  });

  it("counts down to available", async () => {
    const { component } = render(ResendCodeButton);

    await vi.advanceTimersByTimeAsync(1000);
    expect(getButton()).toHaveTextContent("Resend code in 29s");

    await vi.advanceTimersByTimeAsync(29000);
    expect(getButton()).toHaveTextContent(/^Resend code$/);
    expect(getButton()).not.toHaveAttribute("aria-disabled");
    expect(getButton()).not.toHaveClass("bx--btn--disabled");
    expect(component.remaining).toBe(0);
  });

  it("ignores clicks during the cooldown", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ResendCodeButton);

    await vi.advanceTimersByTimeAsync(10000);
    await fireEvent.click(getButton());

    expect(resendCount(consoleLog)).toBe(0);
  });

  it("dispatches resend, restarts the cooldown, and keeps focus", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ResendCodeButton, { props: { startOnMount: false } });
    const button = getButton();

    expect(button).toHaveTextContent(/^Resend code$/);
    button.focus();
    await fireEvent.click(button);

    expect(resendCount(consoleLog)).toBe(1);
    expect(button).toHaveTextContent("Resend code in 30s");
    expect(button).toHaveFocus();
  });

  it("skips the cooldown when resend is prevented", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ResendCodeButton, {
      props: { startOnMount: false, preventResend: true },
    });

    await fireEvent.click(getButton());

    expect(resendCount(consoleLog)).toBe(1);
    expect(getButton()).toHaveTextContent(/^Resend code$/);
  });

  it("has no cooldown when cooldown is 0", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ResendCodeButton, { props: { cooldown: 0 } });

    expect(getButton()).toHaveTextContent(/^Resend code$/);
    await fireEvent.click(getButton());
    await fireEvent.click(getButton());

    expect(resendCount(consoleLog)).toBe(2);
    expect(getButton()).toHaveTextContent(/^Resend code$/);
  });

  it("renders custom text", async () => {
    render(ResendCodeButton, {
      props: {
        labelText: "Reenviar código",
        cooldownText: (seconds: number) => `Reenviar en ${seconds}s`,
      },
    });

    expect(getButton()).toHaveTextContent("Reenviar en 30s");
    await vi.advanceTimersByTimeAsync(30000);
    expect(getButton()).toHaveTextContent("Reenviar código");
  });

  it("uses native disabled when disabled", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ResendCodeButton, {
      props: { disabled: true, startOnMount: false },
    });

    expect(getButton()).toBeDisabled();
    expect(getButton()).not.toHaveAttribute("aria-disabled");
    await fireEvent.click(getButton());
    expect(resendCount(consoleLog)).toBe(0);
  });

  it("resets and restarts through its methods", async () => {
    const { component } = render(ResendCodeButton);

    component.reset();
    await tick();
    expect(getButton()).toHaveTextContent(/^Resend code$/);

    component.start();
    await tick();
    expect(getButton()).toHaveTextContent("Resend code in 30s");
  });

  it("clears its timer on unmount", () => {
    const { unmount } = render(ResendCodeButton);

    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
