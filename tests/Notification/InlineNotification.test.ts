import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../setup-tests";
import InlineNotificationTest from "./InlineNotification.test.svelte";
import InlineNotificationSubtitleSlotTest from "./InlineNotificationSubtitleSlot.test.svelte";
import InlineNotificationTitleSlotTest from "./InlineNotificationTitleSlot.test.svelte";

describe("InlineNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render with default props", () => {
    render(InlineNotificationTest);

    const notification = document.querySelector(".bx--inline-notification");
    expect(notification).toBeInTheDocument();
    expect(notification).toHaveClass("bx--inline-notification--error");
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
      const { unmount } = render(InlineNotificationTest, {
        props: { kind },
      });

      const notification = document.querySelector(".bx--inline-notification");
      expect(notification).toHaveClass(`bx--inline-notification--${kind}`);
      unmount();
    }
  });

  it("should render low contrast variant", () => {
    render(InlineNotificationTest, {
      props: { lowContrast: true },
    });

    const notification = document.querySelector(".bx--inline-notification");
    expect(notification).toHaveClass("bx--inline-notification--low-contrast");
  });

  it("should render title when prop is provided", () => {
    render(InlineNotificationTest, {
      props: { title: "Test Title" },
    });

    const titleElement = document.querySelector(
      ".bx--inline-notification__title",
    );
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveTextContent("Test Title");
  });

  it("should NOT render title element when prop is empty", () => {
    render(InlineNotificationTest, {
      props: { title: "" },
    });

    const titleElement = document.querySelector(
      ".bx--inline-notification__title",
    );
    expect(titleElement).not.toBeInTheDocument();
  });

  it("should render subtitle when prop is provided", () => {
    render(InlineNotificationTest, {
      props: { subtitle: "Test Subtitle" },
    });

    const subtitleElement = document.querySelector(
      ".bx--inline-notification__subtitle",
    );
    expect(subtitleElement).toBeInTheDocument();
    expect(subtitleElement).toHaveTextContent("Test Subtitle");
  });

  it("should NOT render subtitle element when prop is empty", () => {
    render(InlineNotificationTest, {
      props: { subtitle: "" },
    });

    const subtitleElement = document.querySelector(
      ".bx--inline-notification__subtitle",
    );
    expect(subtitleElement).not.toBeInTheDocument();
  });

  it("should NOT render any text elements when all props are empty", () => {
    render(InlineNotificationTest, {
      props: { title: "", subtitle: "" },
    });

    expect(
      document.querySelector(".bx--inline-notification__title"),
    ).not.toBeInTheDocument();
    expect(
      document.querySelector(".bx--inline-notification__subtitle"),
    ).not.toBeInTheDocument();
  });

  it("should render title element when slot is used", () => {
    render(InlineNotificationTitleSlotTest);

    const titleElement = document.querySelector(
      ".bx--inline-notification__title",
    );
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveTextContent("Slot title");
  });

  it("should render subtitle element when slot is used", () => {
    render(InlineNotificationSubtitleSlotTest);

    const subtitleElement = document.querySelector(
      ".bx--inline-notification__subtitle",
    );
    expect(subtitleElement).toBeInTheDocument();
    expect(subtitleElement).toHaveTextContent("Slot subtitle");
  });

  it("should render close button by default", () => {
    render(InlineNotificationTest);

    const closeButton = screen.getByLabelText("Close notification");
    expect(closeButton).toBeInTheDocument();
  });

  it("should hide close button when hideCloseButton is true", () => {
    render(InlineNotificationTest, {
      props: { hideCloseButton: true },
    });

    const closeButton = screen.queryByLabelText("Close notification");
    expect(closeButton).not.toBeInTheDocument();

    const notification = document.querySelector(".bx--inline-notification");
    expect(notification).toHaveClass(
      "bx--inline-notification--hide-close-button",
    );
  });

  it("should dispatch close event when close button is clicked", async () => {
    vi.useRealTimers();
    const closeHandler = vi.fn();
    render(InlineNotificationTest, { props: { onclose: closeHandler } });

    const closeButton = screen.getByLabelText("Close notification");
    await user.click(closeButton);
    await tick();

    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(closeHandler.mock.calls[0][0].detail).toEqual({ timeout: false });
  });

  it("should auto-close after timeout", async () => {
    const closeHandler = vi.fn();
    render(InlineNotificationTest, {
      props: { timeout: 1000, onclose: closeHandler },
    });

    expect(closeHandler).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    await tick();

    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(closeHandler.mock.calls[0][0].detail).toEqual({ timeout: true });
  });

  it("should use custom role", () => {
    render(InlineNotificationTest, {
      props: { role: "status" },
    });

    const notification = document.querySelector(".bx--inline-notification");
    expect(notification).toHaveAttribute("role", "status");
  });

  it("should remove notification from DOM when closed", async () => {
    vi.useRealTimers();
    render(InlineNotificationTest);

    expect(
      document.querySelector(".bx--inline-notification"),
    ).toBeInTheDocument();

    const closeButton = screen.getByLabelText("Close notification");
    await user.click(closeButton);
    await tick();

    expect(
      document.querySelector(".bx--inline-notification"),
    ).not.toBeInTheDocument();
  });

  it("should prevent close when event is cancelled", async () => {
    vi.useRealTimers();
    const closeHandler = vi.fn((e) => {
      e.preventDefault();
    });
    render(InlineNotificationTest, { props: { onclose: closeHandler } });

    const closeButton = screen.getByLabelText("Close notification");
    await user.click(closeButton);
    await tick();

    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(
      document.querySelector(".bx--inline-notification"),
    ).toBeInTheDocument();
  });
});
