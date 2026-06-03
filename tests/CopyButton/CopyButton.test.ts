import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import CopyButton from "./CopyButton.test.svelte";
import CopyButtonDoubleClick from "./CopyButtonDoubleClick.test.svelte";
import CopyButtonInModal from "./CopyButtonInModal.test.svelte";

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

    const feedback = button.querySelector(".bx--copy-btn__feedback");
    expect(feedback).toHaveTextContent("Copied!");
  });

  it("supports custom feedback text and timeout", async () => {
    render(CopyButton);

    const button = getCopyButton("Custom feedback");
    await user.click(button);

    const feedback = button.querySelector(".bx--copy-btn__feedback");
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

  it("should not copy again while feedback is active", async () => {
    const copy = vi.fn();
    render(CopyButtonDoubleClick, {
      props: { copy },
    });

    const button = getCopyButton("Copy");
    await user.dblClick(button);

    expect(copy).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Copy events: 1")).toBeInTheDocument();
  });

  describe("Portal tooltip", () => {
    afterEach(() => {
      const existingPortals = document.querySelectorAll(
        "[data-floating-portal]",
      );
      for (const portal of existingPortals) {
        portal.remove();
      }
    });

    it("should add portal-active class when portalTooltip is true", () => {
      render(CopyButton, {
        props: { portalTooltip: true },
      });

      const button = getCopyButton("Basic");
      expect(button).toHaveClass("bx--copy-btn--portal-active");
    });

    it("should render feedback in FloatingPortal on click when portalTooltip is true", async () => {
      render(CopyButton, {
        props: { portalTooltip: true },
      });

      const button = getCopyButton("Basic");
      await user.click(button);

      const portal = document.querySelector("[data-floating-portal]");
      expect(portal).toBeInTheDocument();
      expect(portal?.parentElement).toBe(document.body);
      expect(
        portal?.querySelector(".bx--tooltip-portal__content"),
      ).toHaveTextContent("Copied!");
    });

    it("should not use portal when portalTooltip is false", () => {
      render(CopyButton, {
        props: { portalTooltip: false },
      });

      const button = getCopyButton("Basic");
      expect(button).not.toHaveClass("bx--copy-btn--portal-active");
      expect(
        button.querySelector(".bx--copy-btn__feedback"),
      ).toBeInTheDocument();
    });

    it("should use portal when inside Modal (portalTooltip not passed)", async () => {
      render(CopyButtonInModal, {
        props: { modalOpen: true },
      });

      const button = getCopyButton("Copy");
      expect(button).toHaveClass("bx--copy-btn--portal-active");

      await user.click(button);
      const portal = document.querySelector("[data-floating-portal]");
      expect(portal).toBeInTheDocument();
      expect(portal?.parentElement).toBe(document.body);
    });

    it("should not use portal when inside Modal with portalTooltip=false", () => {
      render(CopyButtonInModal, {
        props: { modalOpen: true, portalTooltip: false },
      });

      const button = getCopyButton("Copy");
      expect(button).not.toHaveClass("bx--copy-btn--portal-active");
      expect(
        button.querySelector(".bx--copy-btn__feedback"),
      ).toBeInTheDocument();
    });

    // Regression: observer must re-attach when portalTooltip flips after mount.
    // Previously, the observer was registered once in onMount; toggling
    // portalTooltip from false -> true left no observer, so closing the modal
    // did not dismiss the open portal tooltip.
    it("should dismiss portal feedback when modal closes after portalTooltip toggled on", async () => {
      const { rerender } = render(CopyButtonInModal, {
        props: { modalOpen: true, portalTooltip: false },
      });

      rerender({ modalOpen: true, portalTooltip: true });

      const button = getCopyButton("Copy");
      await user.click(button);
      expect(
        document.querySelector("[data-floating-portal]"),
      ).toBeInTheDocument();

      rerender({ modalOpen: false, portalTooltip: true });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(
        document.querySelector("[data-floating-portal]"),
      ).not.toBeInTheDocument();
    });
  });
});
