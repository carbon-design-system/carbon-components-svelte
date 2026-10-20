import { render, screen } from "@testing-library/svelte";
import ToastNotification from "carbon-components-svelte/Notification/ToastNotification.svelte";
import ToastNotificationTest from "./ToastNotification.test.svelte";
import ToastNotificationCaptionSlotTest from "./ToastNotificationCaptionSlot.test.svelte";
import ToastNotificationReusableTest from "./ToastNotificationReusable.test.svelte";
import ToastNotificationSubtitleSlotTest from "./ToastNotificationSubtitleSlot.test.svelte";
import ToastNotificationTitleSlotTest from "./ToastNotificationTitleSlot.test.svelte";

describe("ToastNotification", () => {
  beforeEach(() => {
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

  it("does not listen for visibilitychange with the default timeout", () => {
    const add = vi.spyOn(document, "addEventListener");
    render(ToastNotification);

    expect(
      add.mock.calls.filter(([type]) => type === "visibilitychange"),
    ).toHaveLength(0);
    add.mockRestore();
  });

  const parts = [
    ["title", "Test Title"],
    ["subtitle", "Test Subtitle"],
    ["caption", "Test Caption"],
  ] as const;

  it.each(parts)("should render %s when prop is provided", (part, text) => {
    render(ToastNotificationTest, { props: { [part]: text } });

    const element = document.querySelector(`.bx--toast-notification__${part}`);
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent(text);
  });

  it.each(parts)("should NOT render %s element when prop is empty", (part) => {
    render(ToastNotificationTest, { props: { [part]: "" } });

    expect(
      document.querySelector(`.bx--toast-notification__${part}`),
    ).not.toBeInTheDocument();
  });

  it.each([
    ["title", ToastNotificationTitleSlotTest, "Slot title"],
    ["subtitle", ToastNotificationSubtitleSlotTest, "Slot subtitle"],
    ["caption", ToastNotificationCaptionSlotTest, "Slot caption"],
  ] as const)(
    "should render %s element when slot is used",
    (part, Fixture, text) => {
      render(Fixture);

      const element = document.querySelector(
        `.bx--toast-notification__${part}`,
      );
      expect(element).toBeInTheDocument();
      expect(element).toHaveTextContent(text);
    },
  );

  it("should hide close button when hideCloseButton is true", () => {
    render(ToastNotificationTest, {
      props: { hideCloseButton: true },
    });

    const closeButton = screen.queryByLabelText("Close notification");
    expect(closeButton).not.toBeInTheDocument();
  });

  it("should render with full width", () => {
    render(ToastNotificationTest, {
      props: { fullWidth: true },
    });

    const notification = document.querySelector(".bx--toast-notification");
    expect(notification).toHaveStyle({ width: "100%" });
  });

  it("should render the status icon as decorative (aria-hidden)", () => {
    render(ToastNotificationTest, { props: { kind: "error" } });

    const icon = document.querySelector(".bx--toast-notification__icon");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).not.toHaveAttribute("role", "img");
    expect(icon?.querySelector("title")).toBeNull();
  });

  it("should support bind:open", async () => {
    const { rerender } = render(ToastNotificationReusableTest, {
      props: { open: true },
    });

    expect(
      document.querySelector(".bx--toast-notification"),
    ).toBeInTheDocument();

    await rerender({ open: false });

    expect(
      document.querySelector(".bx--toast-notification"),
    ).not.toBeInTheDocument();
  });
});
