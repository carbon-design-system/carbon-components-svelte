import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import CopyButton from "./CopyButton.test.svelte";

describe("CopyButton", () => {
  const getCopyButton = (label: string) =>
    screen.getByRole("button", { name: label });

  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.resolve() },
      writable: true,
    });
  });

  it("renders and functions correctly", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(CopyButton);

    const button = getCopyButton("Basic");
    expect(button).toHaveAttribute("aria-live", "polite");

    await user.click(button);
    expect(consoleLog).toHaveBeenCalledWith("copied");

    const feedback = document.querySelector(".bx--copy-btn__feedback");
    expect(feedback).toHaveTextContent("Copied!");
  });

  it("supports custom feedback text and timeout", async () => {
    render(CopyButton);

    const button = getCopyButton("Custom feedback");
    await user.click(button);

    const feedback = document.querySelector(".bx--copy-btn__feedback");
    expect(feedback).toHaveTextContent("Copied to clipboard");

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(button).toHaveClass("bx--copy-btn--fade-out");
  });

  it("supports custom copy function", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const clipboard = vi.spyOn(navigator.clipboard, "writeText");
    render(CopyButton);

    const button = getCopyButton("Custom copy function");
    await user.click(button);
    expect(consoleLog).toHaveBeenCalledWith(
      "Custom copy: Custom copy function",
    );
    expect(clipboard).not.toHaveBeenCalled();
  });

  it("handles clipboard API errors", async () => {
    const consoleLog = vi.spyOn(console, "log");
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject("Clipboard error") },
      writable: true,
    });

    render(CopyButton);

    const button = getCopyButton("Basic");
    await user.click(button);
    expect(consoleLog).toHaveBeenCalledWith("Clipboard error");
  });
});
