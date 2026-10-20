import { render, screen } from "@testing-library/svelte";
import InlineNotification from "carbon-components-svelte/Notification/InlineNotification.svelte";
import InlineNotificationTest from "./InlineNotification.test.svelte";
import InlineNotificationActionHrefTest from "./InlineNotificationActionHref.test.svelte";
import InlineNotificationCustomTest from "./InlineNotificationCustom.test.svelte";
import InlineNotificationReusableTest from "./InlineNotificationReusable.test.svelte";
import InlineNotificationSubtitleSlotTest from "./InlineNotificationSubtitleSlot.test.svelte";
import InlineNotificationTitleSlotTest from "./InlineNotificationTitleSlot.test.svelte";

describe("InlineNotification", () => {
  beforeEach(() => {
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

  it("does not listen for visibilitychange with the default timeout", () => {
    const add = vi.spyOn(document, "addEventListener");
    render(InlineNotification);

    expect(
      add.mock.calls.filter(([type]) => type === "visibilitychange"),
    ).toHaveLength(0);
    add.mockRestore();
  });

  const parts = [
    ["title", "Test Title"],
    ["subtitle", "Test Subtitle"],
  ] as const;

  it.each(parts)("should render %s when prop is provided", (part, text) => {
    render(InlineNotificationTest, { props: { [part]: text } });

    const element = document.querySelector(`.bx--inline-notification__${part}`);
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent(text);
  });

  it.each(parts)("should NOT render %s element when prop is empty", (part) => {
    render(InlineNotificationTest, { props: { [part]: "" } });

    expect(
      document.querySelector(`.bx--inline-notification__${part}`),
    ).not.toBeInTheDocument();
  });

  it.each([
    ["title", InlineNotificationTitleSlotTest, "Slot title"],
    ["subtitle", InlineNotificationSubtitleSlotTest, "Slot subtitle"],
  ] as const)(
    "should render %s element when slot is used",
    (part, Fixture, text) => {
      render(Fixture);

      const element = document.querySelector(
        `.bx--inline-notification__${part}`,
      );
      expect(element).toBeInTheDocument();
      expect(element).toHaveTextContent(text);
    },
  );

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

  it("should use custom role", () => {
    render(InlineNotificationTest, {
      props: { role: "status" },
    });

    const notification = document.querySelector(".bx--inline-notification");
    expect(notification).toHaveAttribute("role", "status");
  });

  it("should render the status icon as decorative (aria-hidden)", () => {
    render(InlineNotificationTest, { props: { kind: "error" } });

    const icon = document.querySelector(".bx--inline-notification__icon");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).not.toHaveAttribute("role", "img");
    expect(icon?.querySelector("title")).toBeNull();
  });

  it("should render the actions slot", () => {
    render(InlineNotificationCustomTest);

    expect(
      screen.getByRole("button", { name: "Learn more" }),
    ).toBeInTheDocument();
  });

  it("should render action button with href", () => {
    render(InlineNotificationActionHrefTest);

    const link = screen.getByRole("link", { name: "View release notes" });
    expect(link).toHaveAttribute("href", "https://example.com/releases");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("should support bind:open", async () => {
    const { rerender } = render(InlineNotificationReusableTest, {
      props: { open: true },
    });

    expect(
      document.querySelector(".bx--inline-notification"),
    ).toBeInTheDocument();

    await rerender({ open: false });

    expect(
      document.querySelector(".bx--inline-notification"),
    ).not.toBeInTheDocument();
  });
});
