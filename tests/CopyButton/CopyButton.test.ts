import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
import { openTooltips } from "../utils/open-tooltips";
import { user } from "../utils/user";
import CopyButton from "./CopyButton.test.svelte";
import CopyButtonAsync from "./CopyButtonAsync.test.svelte";
import CopyButtonInModal from "./CopyButtonInModal.test.svelte";
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
    Reflect.deleteProperty(document, "execCommand");
    for (const portal of document.querySelectorAll("[data-floating-portal]")) {
      portal.remove();
    }
  });

  it("renders and functions correctly", async () => {
    const onCopy = vi.fn();
    render(CopyButton, { props: { onCopy } });

    const button = getCopyButton("Basic");

    await user.click(button);
    expect(onCopy).toHaveBeenCalledTimes(1);

    // Feedback is portalled by default; it shares the hover tooltip surface.
    expect(openTooltips()[0]).toHaveTextContent("Copied!");
  });

  it("supports custom feedback text and timeout (inline caret)", async () => {
    // The fade-out animation is specific to the inline caret; portalled
    // feedback closes the tooltip directly on timeout.
    render(CopyButton, { props: { portalTooltip: false } });

    const button = getCopyButton("Custom feedback");
    await user.click(button);

    expect(button).not.toHaveClass("bx--copy-btn--portal-active");
    const feedback = button.querySelector(".bx--copy-btn__feedback");
    expect(feedback).toHaveTextContent("Copied to clipboard");

    await flushMacrotask();
    expect(button).toHaveClass("bx--copy-btn--fade-out");
  });

  it("supports custom copy function", async () => {
    const onCustomCopy = vi.fn();
    const clipboard = vi.spyOn(navigator.clipboard, "writeText");
    render(CopyButton, { props: { onCustomCopy } });

    const button = getCopyButton("Custom copy function");
    await user.click(button);
    expect(onCustomCopy).toHaveBeenCalledWith("Custom copy function");
    expect(clipboard).not.toHaveBeenCalled();
  });

  it("handles clipboard API errors", async () => {
    const onCopyError = vi.fn();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject("Clipboard error") },
      writable: true,
    });
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue(false),
    });

    render(CopyButton, { props: { onCopyError } });

    const button = getCopyButton("Basic");
    await user.click(button);
    expect(onCopyError).toHaveBeenCalledWith({
      error: expect.any(Error),
    });
    expect(button).toHaveClass("bx--copy-btn--fade-in");

    expect(openTooltips()[0]).toHaveTextContent("Failed to copy");
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
    expect(openTooltips()[0]).toHaveTextContent("Copied!");
  });

  it("async copy failure shows error feedback and dispatches copy:error", async () => {
    const error = new Error("copy failed");
    const copy = vi.fn().mockRejectedValue(error);
    const onCopyError = vi.fn();

    render(CopyButtonAsync, {
      props: { copy, onCopyError },
    });

    const button = getCopyButton("Async copy");
    await user.click(button);

    expect(onCopyError).toHaveBeenCalledWith({ error });
    expect(button).toHaveClass("bx--copy-btn--fade-in");

    expect(openTooltips()[0]).toHaveTextContent("Failed to copy");

    // Error feedback holds the button until timeout/dismiss.
    await user.click(button);
    expect(copy).toHaveBeenCalledTimes(1);
  });

  describe("status announcement", () => {
    it("announces the feedback text in a status region", async () => {
      render(CopyButtonPortalTooltipTimeout);

      const status = screen.getByRole("status");
      expect(status).toHaveAttribute("aria-live", "polite");
      expect(status).toHaveTextContent("");

      await user.click(getCopyButton("Copy"));
      expect(status).toHaveTextContent("Copied!");

      // Cleared on close so the next copy is announced again.
      await waitFor(() => expect(status).toHaveTextContent(""));
    });

    it("announces the feedback text with the inline caret", async () => {
      render(CopyButtonPortalTooltipTimeout, {
        props: { portalTooltip: false },
      });

      await user.click(getCopyButton("Copy"));
      expect(screen.getByRole("status")).toHaveTextContent("Copied!");
    });

    it("announces errorFeedback when copying fails", async () => {
      const copy = vi.fn().mockRejectedValue(new Error("copy failed"));
      render(CopyButtonAsync, { props: { copy } });

      await user.click(getCopyButton("Async copy"));
      expect(screen.getByRole("status")).toHaveTextContent("Failed to copy");
    });
  });

  it("forwards mouseenter events to parent handlers", () => {
    const onMouseEnter = vi.fn();
    render(CopyButtonAsync, { props: { onMouseEnter } });

    const button = getCopyButton("Async copy");
    fireEvent.mouseEnter(button);

    expect(onMouseEnter).toHaveBeenCalledTimes(1);
  });

  it("should not copy again while feedback is active", async () => {
    const copy = vi.fn();
    const onCopy = vi.fn();
    render(CopyButtonAsync, { props: { copy, onCopy } });

    const button = getCopyButton("Async copy");
    await user.dblClick(button);

    expect(copy).toHaveBeenCalledTimes(1);
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it("should not copy again while async copy is in flight", async () => {
    let resolveCopy: () => void = () => {};
    const copy = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveCopy = resolve;
        }),
    );

    const onCopy = vi.fn();
    render(CopyButtonAsync, { props: { copy, onCopy } });

    const button = getCopyButton("Async copy");
    fireEvent.click(button);
    await Promise.resolve();
    fireEvent.click(button);

    expect(copy).toHaveBeenCalledTimes(1);
    expect(onCopy).not.toHaveBeenCalled();

    resolveCopy();
    await waitFor(() => {
      expect(onCopy).toHaveBeenCalledTimes(1);
    });
  });

  describe("hover and focus tooltip", () => {
    it("opens the description on keyboard focus and closes on blur", async () => {
      render(CopyButton);

      await user.tab();
      expect(getCopyButton("Basic")).toHaveFocus();
      expect(openTooltips()).toHaveLength(1);
      expect(openTooltips()[0]).toHaveTextContent("Basic");

      await user.click(document.body);
      expect(openTooltips()).toHaveLength(0);
    });

    it("hides the focused tooltip while the inline caret shows feedback", async () => {
      render(CopyButtonPortalTooltipTimeout, {
        props: { portalTooltip: false },
      });

      const button = getCopyButton("Copy");
      await user.click(button);

      expect(button).toHaveFocus();
      expect(button.querySelector(".bx--copy-btn__feedback")).toHaveTextContent(
        "Copied!",
      );
      expect(openTooltips()).toHaveLength(0);
    });
  });

  describe("Escape", () => {
    const modal = () => document.querySelector(".bx--modal");

    it("hides the focused tooltip on the first Escape and closes the Modal on the second", async () => {
      render(CopyButtonInModal, { props: { modalOpen: true } });
      const button = getCopyButton("Copy");

      button.focus();
      await waitFor(() => expect(openTooltips()).toHaveLength(1));

      await user.keyboard("{Escape}");
      expect(openTooltips()).toHaveLength(0);
      expect(button).toHaveFocus();
      expect(modal()).toHaveClass("is-visible");

      await user.keyboard("{Escape}");
      expect(modal()).not.toHaveClass("is-visible");
    });

    it("hides the copy feedback without closing the Modal", async () => {
      render(CopyButtonInModal, { props: { modalOpen: true } });

      await user.click(getCopyButton("Copy"));
      expect(openTooltips()[0]).toHaveTextContent("Copied!");

      await user.keyboard("{Escape}");
      expect(openTooltips()).toHaveLength(0);
      expect(modal()).toHaveClass("is-visible");
    });

    it("hides a hovered tooltip while focus is elsewhere, until the next pointer enter", async () => {
      render(CopyButton);
      const button = getCopyButton("Basic");

      const other = getCopyButton("Custom copy function");
      other.focus();
      await user.hover(button);
      await waitFor(() => expect(openTooltips()[0]).toHaveTextContent("Basic"));

      await user.keyboard("{Escape}");
      expect(openTooltips()).toHaveLength(0);
      expect(other).toHaveFocus();

      await user.unhover(button);
      await user.hover(button);
      await waitFor(() => expect(openTooltips()[0]).toHaveTextContent("Basic"));
    });

    it.each([{ init: { isComposing: true } }, { init: { keyCode: 229 } }])(
      "ignores Escape during IME composition ($init)",
      async ({ init }) => {
        render(CopyButtonInModal, { props: { modalOpen: true } });
        const button = getCopyButton("Copy");

        button.focus();
        await waitFor(() => expect(openTooltips()).toHaveLength(1));

        await fireEvent.keyDown(button, { key: "Escape", ...init });
        expect(openTooltips()).toHaveLength(1);
      },
    );
  });

  describe("Portal tooltip", () => {
    it("should add portal-active class and render feedback in FloatingPortal on click when portalTooltip is true", async () => {
      render(CopyButton, {
        props: { portalTooltip: true },
      });

      const button = getCopyButton("Basic");
      expect(button).toHaveClass("bx--copy-btn--portal-active");

      await user.click(button);

      const portal = document.querySelector("[data-floating-portal]");
      expect(portal).toBeInTheDocument();
      expect(portal?.parentElement).toBe(document.body);
      expect(
        portal?.querySelector(".bx--tooltip-portal__content"),
      ).toHaveTextContent("Copied!");
    });

    it("portals feedback for a custom tooltipPosition even with portalTooltip=false", async () => {
      render(CopyButtonPortalTooltipTimeout, {
        props: { portalTooltip: false, tooltipPosition: "top" },
      });

      const button = getCopyButton("Copy");
      expect(button).toHaveClass("bx--copy-btn--portal-active");

      await user.click(button);

      expect(button.querySelector(".bx--copy-btn__feedback")).toBeNull();
      expect(openTooltips()[0]).toHaveTextContent("Copied!");
    });

    it("places feedback by tooltipAlign over tooltipPosition", async () => {
      render(CopyButtonPortalTooltipTimeout, {
        props: {
          portalTooltip: false,
          tooltipPosition: "bottom",
          tooltipAlign: "top-start",
        },
      });

      const button = getCopyButton("Copy");
      expect(button).toHaveClass("bx--copy-btn--portal-active");

      await user.click(button);

      const portal = document.querySelector("[data-floating-portal]");
      expect(portal).toHaveAttribute("data-floating-direction", "top");
      expect(portal).toHaveAttribute("data-floating-intrinsic-align", "start");
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

    it("should dismiss portal feedback when modal closes", async () => {
      const { rerender } = render(CopyButtonInModal, {
        props: { modalOpen: true },
      });

      await user.click(getCopyButton("Copy"));
      expect(
        document.querySelector("[data-floating-portal]"),
      ).toBeInTheDocument();

      await rerender({ modalOpen: false });
      await flushMacrotask();

      expect(
        document.querySelector("[data-floating-portal]"),
      ).not.toBeInTheDocument();
    });

    it("should not reopen feedback when an in-flight copy resolves after the modal closes", async () => {
      let resolveCopy!: () => void;
      const copy = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveCopy = resolve;
          }),
      );
      const { rerender } = render(CopyButtonInModal, {
        props: { modalOpen: true, copy },
      });

      await user.click(getCopyButton("Copy"));
      await rerender({ modalOpen: false, copy });
      await flushMacrotask();

      resolveCopy();
      await flushMacrotask();

      expect(
        document.querySelector("[data-floating-portal]"),
      ).not.toBeInTheDocument();
    });
  });
});
