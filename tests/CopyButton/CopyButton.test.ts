import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { user } from "../utils/user";
import CopyButton from "./CopyButton.test.svelte";
import CopyButtonAsync from "./CopyButtonAsync.test.svelte";
import CopyButtonAsyncDoubleClick from "./CopyButtonAsyncDoubleClick.test.svelte";
import CopyButtonDoubleClick from "./CopyButtonDoubleClick.test.svelte";
import CopyButtonInModal from "./CopyButtonInModal.test.svelte";
import CopyButtonMouseEnter from "./CopyButtonMouseEnter.test.svelte";
import CopyButtonPortalTooltipTimeout from "./CopyButtonPortalTooltipTimeout.test.svelte";

describe("CopyButton", () => {
  const getCopyButton = (label: string) =>
    screen.getByRole("button", { name: label });

  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.resolve() },
      writable: true,
    });
  });

  afterEach(() => {
    for (const portal of document.querySelectorAll("[data-floating-portal]")) {
      portal.remove();
    }
  });

  it("renders and functions correctly", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(CopyButton);

    const button = getCopyButton("Basic");
    expect(button).toHaveAttribute("aria-live", "polite");

    await user.click(button);
    expect(consoleLog).toHaveBeenCalledWith("copied");

    // Feedback is portalled by default; it shares the hover tooltip surface.
    const portal = document.querySelector("[data-floating-portal]");
    expect(
      portal?.querySelector(".bx--tooltip-portal__content"),
    ).toHaveTextContent("Copied!");
  });

  it("supports custom feedback text and timeout (inline caret)", async () => {
    // The fade-out animation is specific to the inline caret; portalled
    // feedback closes the tooltip directly on timeout.
    render(CopyButton, { props: { portalTooltip: false } });

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
    const onCopyError = vi.fn();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject("Clipboard error") },
      writable: true,
    });

    render(CopyButton, { props: { onCopyError } });

    const button = getCopyButton("Basic");
    await user.click(button);
    expect(onCopyError).toHaveBeenCalledWith({ error: "Clipboard error" });
    expect(button).not.toHaveClass("bx--copy-btn--fade-in");
    // No "Copied!" feedback on error. (A hover/focus description tooltip may
    // still portal because clicking focuses the button — that is not feedback.)
    expect(button.querySelector(".bx--copy-btn__feedback")).toBeNull();
    expect(screen.queryByText("Copied!")).toBeNull();
  });

  it("async copy delays feedback until resolved", async () => {
    let resolveCopy: () => void = () => {};
    const copy = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveCopy = resolve;
        }),
    );

    render(CopyButtonAsync, { props: { copy } });

    const button = getCopyButton("Async copy");
    fireEvent.click(button);
    await Promise.resolve();

    expect(copy).toHaveBeenCalledTimes(1);
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).not.toHaveClass("bx--copy-btn--fade-in");

    resolveCopy();
    await waitFor(() => {
      expect(button).toHaveClass("bx--copy-btn--fade-in");
    });

    expect(button).not.toHaveAttribute("aria-busy");
    const portal = document.querySelector("[data-floating-portal]");
    expect(
      portal?.querySelector(".bx--tooltip-portal__content"),
    ).toHaveTextContent("Copied!");
  });

  it("async copy failure does not show feedback and dispatches copy:error", async () => {
    const error = new Error("copy failed");
    const copy = vi.fn().mockRejectedValue(error);
    const onCopyError = vi.fn();

    render(CopyButtonAsync, {
      props: { copy, onCopyError },
    });

    const button = getCopyButton("Async copy");
    await user.click(button);

    expect(onCopyError).toHaveBeenCalledWith({ error });
    expect(button).not.toHaveClass("bx--copy-btn--fade-in");

    await user.click(button);
    expect(copy).toHaveBeenCalledTimes(2);
  });

  it("dispatches copy event after async copy resolves", async () => {
    const order: string[] = [];
    let resolveCopy: () => void = () => {};
    const copy = vi.fn(async () => {
      order.push("copyStart");
      await new Promise<void>((resolve) => {
        resolveCopy = resolve;
      });
      order.push("copyEnd");
    });

    render(CopyButtonAsync, {
      props: {
        copy,
        onCopy: () => {
          order.push("copyEvent");
        },
      },
    });

    const button = getCopyButton("Async copy");
    fireEvent.click(button);
    await Promise.resolve();

    expect(order).toEqual(["copyStart"]);

    resolveCopy();
    await waitFor(() => {
      expect(order).toEqual(["copyStart", "copyEnd", "copyEvent"]);
    });
  });

  it("forwards mouseenter events to parent handlers", () => {
    const onMouseEnter = vi.fn();
    render(CopyButtonMouseEnter, { props: { onMouseEnter } });

    const button = getCopyButton("Hover test");
    fireEvent.mouseEnter(button);

    expect(onMouseEnter).toHaveBeenCalledTimes(1);
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

  it("should not copy again while async copy is in flight", async () => {
    let resolveCopy: () => void = () => {};
    const copy = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveCopy = resolve;
        }),
    );

    render(CopyButtonAsyncDoubleClick, { props: { copy } });

    const button = getCopyButton("Async double click");
    fireEvent.click(button);
    await Promise.resolve();
    fireEvent.click(button);

    expect(copy).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Copy events: 0")).toBeInTheDocument();

    resolveCopy();
    await waitFor(() => {
      expect(screen.getByText("Copy events: 1")).toBeInTheDocument();
    });
  });

  describe("Portal tooltip", () => {
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

    describe("feedback timeout", () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      // Regression: portalled feedback hides the inline element, so the
      // hide-feedback animation (and animationend) never runs; feedbackTimeout
      // must close the portal directly or the tooltip stays open.
      it("should dismiss portal feedback after feedbackTimeout", async () => {
        render(CopyButtonPortalTooltipTimeout);

        const button = getCopyButton("Copy");
        await fireEvent.click(button);
        await Promise.resolve();

        expect(
          document.querySelector("[data-floating-portal]"),
        ).toBeInTheDocument();

        await vi.advanceTimersByTimeAsync(100);

        expect(
          document.querySelector("[data-floating-portal]"),
        ).not.toBeInTheDocument();

        await fireEvent.click(button);
        await Promise.resolve();
        expect(
          document.querySelector("[data-floating-portal]"),
        ).toBeInTheDocument();
      });
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
