import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../setup-tests";
import InlineNotificationClose from "./InlineNotification.close.test.svelte";
import InlineNotification from "./InlineNotification.test.svelte";
import InlineNotificationActionHref from "./InlineNotificationActionHref.test.svelte";
import InlineNotificationCustom from "./InlineNotificationCustom.test.svelte";
import InlineNotificationReusable from "./InlineNotificationReusable.test.svelte";

describe("InlineNotification", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should render with default props", () => {
    render(InlineNotification);

    expect(screen.getByRole("alert")).toHaveClass(
      "bx--inline-notification--error",
    );
    expect(screen.getByText("Error:")).toBeInTheDocument();
    expect(
      screen.getByText("An internal server error occurred."),
    ).toBeInTheDocument();
  });

  it("should handle different kinds", () => {
    const kinds = [
      "error",
      "info",
      "info-square",
      "success",
      "warning",
      "warning-alt",
    ] as const;
    for (const kind of kinds) {
      const { container } = render(InlineNotification, {
        props: { kind },
      });

      expect(
        container.querySelector(`.bx--inline-notification--${kind}`),
      ).toBeInTheDocument();
      container.remove();
    }
  });

  it("should handle low contrast variant", () => {
    render(InlineNotification, {
      props: { lowContrast: true },
    });

    expect(screen.getByRole("alert")).toHaveClass(
      "bx--inline-notification--low-contrast",
    );
  });

  it("should handle close button click", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(InlineNotification);

    await user.click(screen.getByRole("button"));

    expect(consoleLog).toHaveBeenCalledWith("close", { timeout: false });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("should hide close button", () => {
    render(InlineNotification, {
      props: { hideCloseButton: true },
    });

    expect(
      screen.queryByLabelText("Close notification"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveClass(
      "bx--inline-notification--hide-close-button",
    );
  });

  it("should handle custom icon descriptions", () => {
    render(InlineNotification, {
      props: {
        statusIconDescription: "Custom status",
        closeButtonDescription: "Custom close",
      },
    });

    expect(screen.getByText("Custom status")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Custom close",
    );
  });

  it("should handle custom role", () => {
    render(InlineNotification, {
      props: { role: "status" },
    });

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("should handle timeout", async () => {
    vi.useFakeTimers();
    const consoleLog = vi.spyOn(console, "log");
    render(InlineNotification, { props: { timeout: 1000 } });

    expect(screen.getByRole("alert")).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(1000);

    expect(consoleLog).toHaveBeenCalledWith("close", { timeout: true });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("should handle custom slots", () => {
    render(InlineNotificationCustom);

    const title = screen.getByText("Custom Title:");
    expect(title).not.toHaveClass("bx--inline-notification__title");
    expect(title.tagName).toBe("STRONG");

    const subtitle = screen.getByText("Custom subtitle content.");
    expect(subtitle).not.toHaveClass("bx--inline-notification__subtitle");
    expect(subtitle.tagName).toBe("STRONG");
  });

  it("should render action button", () => {
    render(InlineNotificationCustom);

    expect(
      screen.getByRole("button", { name: "Learn more" }),
    ).toBeInTheDocument();
  });

  it("should cleanup timeout on unmount", () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");

    const { unmount } = render(InlineNotification, {
      props: { timeout: 1_000 },
    });

    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("should prevent default close behavior", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(InlineNotificationClose);

    await user.click(screen.getByRole("button"));
    expect(consoleLog).toHaveBeenCalledWith("close", { timeout: false });
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("should render action button with href as link", () => {
    render(InlineNotificationActionHref);

    const link = screen.getByRole("link", { name: "View release notes" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://example.com/releases");
    expect(link).toHaveClass("bx--inline-notification__action-button");
  });

  describe("reusable notification", () => {
    it("should default to open=true for backward compatibility", () => {
      render(InlineNotification);

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("should be controllable via open prop", async () => {
      const { rerender } = render(InlineNotificationReusable, {
        props: { open: false },
      });

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();

      rerender({ open: true });
      await tick();
      expect(screen.getByRole("alert")).toBeInTheDocument();

      rerender({ open: false });
      await tick();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("should be reusable - can close and reopen with same message", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { rerender } = render(InlineNotificationReusable, {
        props: { open: true },
      });

      expect(screen.getByRole("alert")).toBeInTheDocument();

      // Close via button
      await user.click(screen.getByRole("button"));
      expect(consoleLog).toHaveBeenCalledWith("close", { timeout: false });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();

      // Reopen
      rerender({ open: true });
      await tick();
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Error:")).toBeInTheDocument();
      expect(
        screen.getByText("An internal server error occurred."),
      ).toBeInTheDocument();
    });

    it("should handle timeout with controlled open prop", async () => {
      vi.useFakeTimers();
      const consoleLog = vi.spyOn(console, "log");
      const { rerender } = render(InlineNotificationReusable, {
        props: { open: true, timeout: 1000 },
      });

      expect(screen.getByRole("alert")).toBeInTheDocument();
      await vi.advanceTimersByTimeAsync(1000);

      expect(consoleLog).toHaveBeenCalledWith("close", { timeout: true });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();

      // Reopen after timeout - should start new timeout
      rerender({ open: true });
      await tick();
      expect(screen.getByRole("alert")).toBeInTheDocument();

      await vi.advanceTimersByTimeAsync(1000);
      expect(consoleLog).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();

      vi.useRealTimers();
    });

    it("should update message when reopened", async () => {
      const { rerender } = render(InlineNotificationReusable, {
        props: { open: true },
      });

      expect(screen.getByText("Error:")).toBeInTheDocument();

      // Close
      await user.click(screen.getByRole("button"));
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();

      // Reopen with new message
      rerender({
        open: true,
        title: "Success:",
        subtitle: "Operation completed successfully.",
      });
      await tick();
      expect(screen.getByText("Success:")).toBeInTheDocument();
      expect(
        screen.getByText("Operation completed successfully."),
      ).toBeInTheDocument();
    });
  });
});
