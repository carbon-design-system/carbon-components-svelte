import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import ToastNotificationClose from "./ToastNotification.close.test.svelte";
import ToastNotification from "./ToastNotification.test.svelte";
import ToastNotificationCustom from "./ToastNotificationCustom.test.svelte";

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
    expect(title).not.toHaveClass("bx--toast-notification__title");
    expect(title.tagName).toBe("STRONG");

    const subtitle = screen.getByText("Custom subtitle content.");
    expect(subtitle).not.toHaveClass("bx--toast-notification__subtitle");
    expect(subtitle.tagName).toBe("STRONG");

    const caption = screen.getByText("Custom caption content.");
    expect(caption).not.toHaveClass("bx--toast-notification__caption");
    expect(caption.tagName).toBe("STRONG");
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
});
