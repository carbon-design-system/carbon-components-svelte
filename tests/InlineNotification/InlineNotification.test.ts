import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import InlineNotification from "./InlineNotification.test.svelte";
import InlineNotificationCustom from "./InlineNotificationCustom.test.svelte";
import InlineNotificationClose from "./InlineNotification.close.test.svelte";

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
    (
      [
        "error",
        "info",
        "info-square",
        "success",
        "warning",
        "warning-alt",
      ] as const
    ).forEach((kind) => {
      const { container } = render(InlineNotification, {
        props: { kind },
      });

      expect(
        container.querySelector(`.bx--inline-notification--${kind}`),
      ).toBeInTheDocument();
      container.remove();
    });
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
});
