import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../setup-tests";
import ToastNotificationTest from "./ToastNotification.test.svelte";
import ToastNotificationCaptionSlotTest from "./ToastNotificationCaptionSlot.test.svelte";
import ToastNotificationSubtitleSlotTest from "./ToastNotificationSubtitleSlot.test.svelte";
import ToastNotificationTitleSlotTest from "./ToastNotificationTitleSlot.test.svelte";

describe("ToastNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render with default props", () => {
    render(ToastNotificationTest);

    const notification = document.querySelector(".bx--toast-notification");
    expect(notification).toBeInTheDocument();
    expect(notification).toHaveClass("bx--toast-notification--error");
    expect(notification).toHaveAttribute("role", "alert");
  });

  it("should render with all kinds", () => {
    const kinds = [
      "error",
      "info",
      "info-square",
      "success",
      "warning",
      "warning-alt",
    ] as const;

    for (const kind of kinds) {
      const { unmount } = render(ToastNotificationTest, {
        props: { kind },
      });

      const notification = document.querySelector(".bx--toast-notification");
      expect(notification).toHaveClass(`bx--toast-notification--${kind}`);
      unmount();
    }
  });

  it("should render low contrast variant", () => {
    render(ToastNotificationTest, {
      props: { lowContrast: true },
    });

    const notification = document.querySelector(".bx--toast-notification");
    expect(notification).toHaveClass("bx--toast-notification--low-contrast");
  });

  it("should render title when prop is provided", () => {
    render(ToastNotificationTest, {
      props: { title: "Test Title" },
    });

    const titleElement = document.querySelector(
      ".bx--toast-notification__title",
    );
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveTextContent("Test Title");
  });

  it("should NOT render title element when prop is empty", () => {
    render(ToastNotificationTest, {
      props: { title: "" },
    });

    const titleElement = document.querySelector(
      ".bx--toast-notification__title",
    );
    expect(titleElement).not.toBeInTheDocument();
  });

  it("should render subtitle when prop is provided", () => {
    render(ToastNotificationTest, {
      props: { subtitle: "Test Subtitle" },
    });

    const subtitleElement = document.querySelector(
      ".bx--toast-notification__subtitle",
    );
    expect(subtitleElement).toBeInTheDocument();
    expect(subtitleElement).toHaveTextContent("Test Subtitle");
  });

  it("should NOT render subtitle element when prop is empty", () => {
    render(ToastNotificationTest, {
      props: { subtitle: "" },
    });

    const subtitleElement = document.querySelector(
      ".bx--toast-notification__subtitle",
    );
    expect(subtitleElement).not.toBeInTheDocument();
  });

  it("should render caption when prop is provided", () => {
    render(ToastNotificationTest, {
      props: { caption: "Test Caption" },
    });

    const captionElement = document.querySelector(
      ".bx--toast-notification__caption",
    );
    expect(captionElement).toBeInTheDocument();
    expect(captionElement).toHaveTextContent("Test Caption");
  });

  it("should NOT render caption element when prop is empty", () => {
    render(ToastNotificationTest, {
      props: { caption: "" },
    });

    const captionElement = document.querySelector(
      ".bx--toast-notification__caption",
    );
    expect(captionElement).not.toBeInTheDocument();
  });

  it("should NOT render any text elements when all props are empty", () => {
    render(ToastNotificationTest, {
      props: { title: "", subtitle: "", caption: "" },
    });

    expect(
      document.querySelector(".bx--toast-notification__title"),
    ).not.toBeInTheDocument();
    expect(
      document.querySelector(".bx--toast-notification__subtitle"),
    ).not.toBeInTheDocument();
    expect(
      document.querySelector(".bx--toast-notification__caption"),
    ).not.toBeInTheDocument();
  });

  it("should render title element when slot is used", () => {
    render(ToastNotificationTitleSlotTest);

    const titleElement = document.querySelector(
      ".bx--toast-notification__title",
    );
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveTextContent("Slot title");
  });

  it("should render subtitle element when slot is used", () => {
    render(ToastNotificationSubtitleSlotTest);

    const subtitleElement = document.querySelector(
      ".bx--toast-notification__subtitle",
    );
    expect(subtitleElement).toBeInTheDocument();
    expect(subtitleElement).toHaveTextContent("Slot subtitle");
  });

  it("should render caption element when slot is used", () => {
    render(ToastNotificationCaptionSlotTest);

    const captionElement = document.querySelector(
      ".bx--toast-notification__caption",
    );
    expect(captionElement).toBeInTheDocument();
    expect(captionElement).toHaveTextContent("Slot caption");
  });

  it("should render close button by default", () => {
    render(ToastNotificationTest);

    const closeButton = screen.getByLabelText("Close notification");
    expect(closeButton).toBeInTheDocument();
  });

  it("should hide close button when hideCloseButton is true", () => {
    render(ToastNotificationTest, {
      props: { hideCloseButton: true },
    });

    const closeButton = screen.queryByLabelText("Close notification");
    expect(closeButton).not.toBeInTheDocument();
  });

  it("should dispatch close event when close button is clicked", async () => {
    vi.useRealTimers();
    const { component } = render(ToastNotificationTest);

    const closeHandler = vi.fn();
    component.$on("close", closeHandler);

    const closeButton = screen.getByLabelText("Close notification");
    await user.click(closeButton);
    await tick();

    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(closeHandler.mock.calls[0][0].detail).toEqual({ timeout: false });
  });

  it("should auto-close after timeout", async () => {
    const { component } = render(ToastNotificationTest, {
      props: { timeout: 1000 },
    });

    const closeHandler = vi.fn();
    component.$on("close", closeHandler);

    expect(closeHandler).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    await tick();

    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(closeHandler.mock.calls[0][0].detail).toEqual({ timeout: true });
  });

  it("should render with full width", () => {
    render(ToastNotificationTest, {
      props: { fullWidth: true },
    });

    const notification = document.querySelector(".bx--toast-notification");
    expect(notification).toHaveStyle({ width: "100%" });
  });

  it("should use custom role", () => {
    render(ToastNotificationTest, {
      props: { role: "status" },
    });

    const notification = document.querySelector(".bx--toast-notification");
    expect(notification).toHaveAttribute("role", "status");
  });

  it("should remove notification from DOM when closed", async () => {
    vi.useRealTimers();
    render(ToastNotificationTest);

    expect(
      document.querySelector(".bx--toast-notification"),
    ).toBeInTheDocument();

    const closeButton = screen.getByLabelText("Close notification");
    await user.click(closeButton);
    await tick();

    expect(
      document.querySelector(".bx--toast-notification"),
    ).not.toBeInTheDocument();
  });

  it("should prevent close when event is cancelled", async () => {
    vi.useRealTimers();
    const { component } = render(ToastNotificationTest);

    const closeHandler = vi.fn((e) => {
      e.preventDefault();
    });
    component.$on("close", closeHandler);

    const closeButton = screen.getByLabelText("Close notification");
    await user.click(closeButton);
    await tick();

    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(
      document.querySelector(".bx--toast-notification"),
    ).toBeInTheDocument();
  });
});
