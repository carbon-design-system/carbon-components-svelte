import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../setup-tests";
import ToastNotificationClose from "./ToastNotification.close.test.svelte";
import ToastNotification from "./ToastNotification.test.svelte";
import ToastNotificationCustom from "./ToastNotificationCustom.test.svelte";
import ToastNotificationReusable from "./ToastNotificationReusable.test.svelte";

describe("ToastNotification", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should render with default props", () => {
    render(ToastNotification);

    expect(screen.getByRole("alert")).toHaveClass(
      "bx--toast-notification--error",
    );
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(
      screen.getByText("An internal server error occurred."),
    ).toBeInTheDocument();
    expect(screen.getByText("2024-03-21 12:00:00")).toBeInTheDocument();
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
      const { container } = render(ToastNotification, {
        props: { kind },
      });

      expect(
        container.querySelector(`.bx--toast-notification--${kind}`),
      ).toBeInTheDocument();
      container.remove();
    }
  });

  it("should handle low contrast variant", () => {
    render(ToastNotification, {
      props: { lowContrast: true },
    });

    expect(screen.getByRole("alert")).toHaveClass(
      "bx--toast-notification--low-contrast",
    );
  });

  it("should handle close button click", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ToastNotification);

    await user.click(screen.getByRole("button"));

    expect(consoleLog).toHaveBeenCalledWith("close", { timeout: false });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("should hide close button", () => {
    render(ToastNotification, {
      props: { hideCloseButton: true },
    });

    expect(
      screen.queryByLabelText("Close notification"),
    ).not.toBeInTheDocument();
  });

  it("should handle custom icon descriptions", () => {
    render(ToastNotification, {
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
    render(ToastNotification, {
      props: { role: "status" },
    });

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("should handle timeout", async () => {
    vi.useFakeTimers();
    const consoleLog = vi.spyOn(console, "log");

    render(ToastNotification, { props: { timeout: 1000 } });

    expect(screen.getByRole("alert")).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(1000);

    expect(consoleLog).toHaveBeenCalledWith("close", { timeout: true });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("should handle custom slots", () => {
    render(ToastNotificationCustom);

    const title = screen.getByText("Custom Title:");
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe("STRONG");

    const subtitle = screen.getByText("Custom subtitle content.");
    expect(subtitle).toBeInTheDocument();
    expect(subtitle.tagName).toBe("STRONG");

    const caption = screen.getByText("Custom caption content.");
    expect(caption).toBeInTheDocument();
    expect(caption.tagName).toBe("STRONG");
  });

  it("supports custom titleChildren slot", () => {
    render(ToastNotificationCustom);

    const customTitle = screen.getByText("Custom Title:");
    expect(customTitle).toBeInTheDocument();
  });

  it("supports custom subtitleChildren slot", () => {
    render(ToastNotificationCustom);

    const customSubtitle = screen.getByText("Custom subtitle content.");
    expect(customSubtitle).toBeInTheDocument();
  });

  it("supports custom captionChildren slot", () => {
    render(ToastNotificationCustom);

    const customCaption = screen.getByText("Custom caption content.");
    expect(customCaption).toBeInTheDocument();
  });

  it("should handle full width", () => {
    render(ToastNotification, { props: { fullWidth: true } });

    const notification = screen.getByRole("alert");
    expect(notification).toHaveStyle({ width: "100%" });
  });

  it("should cleanup timeout on unmount", () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");

    const { unmount } = render(ToastNotification, {
      props: { timeout: 1000 },
    });

    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("should prevent default close behavior", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ToastNotificationClose);

    await user.click(screen.getByRole("button"));
    expect(consoleLog).toHaveBeenCalledWith("close", { timeout: false });
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  describe("reusable notification", () => {
    it("should default to open=true for backward compatibility", () => {
      render(ToastNotification);

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("should be controllable via open prop", async () => {
      const { rerender } = render(ToastNotificationReusable, {
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
      const { rerender } = render(ToastNotificationReusable, {
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
      expect(screen.getByText("Error")).toBeInTheDocument();
      expect(
        screen.getByText("An internal server error occurred."),
      ).toBeInTheDocument();
    });

    it("should handle timeout with controlled open prop", async () => {
      vi.useFakeTimers();
      const consoleLog = vi.spyOn(console, "log");
      const { rerender } = render(ToastNotificationReusable, {
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
      const { rerender } = render(ToastNotificationReusable, {
        props: { open: true },
      });

      expect(screen.getByText("Error")).toBeInTheDocument();

      // Close
      await user.click(screen.getByRole("button"));
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();

      // Reopen with new message
      rerender({
        open: true,
        title: "Success",
        subtitle: "Operation completed successfully.",
      });
      await tick();
      expect(screen.getByText("Success")).toBeInTheDocument();
      expect(
        screen.getByText("Operation completed successfully."),
      ).toBeInTheDocument();
    });
  });
});
