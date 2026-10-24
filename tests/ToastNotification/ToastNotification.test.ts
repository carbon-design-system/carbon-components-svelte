import { render, screen } from "@testing-library/svelte";
import ToastNotification from "carbon-components-svelte/Notification/ToastNotification.svelte";
import { tick } from "svelte";
import ToastNotificationTest from "./ToastNotification.test.svelte";
import ToastNotificationActionsTest from "./ToastNotificationActions.test.svelte";
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
  });

  it("defaults to role status, which screen readers announce politely", () => {
    render(ToastNotification, { props: { title: "Saved" } });

    expect(screen.getByRole("status")).toHaveClass("bx--toast-notification");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("uses role alert when set, for urgent errors", () => {
    render(ToastNotificationTest, { props: { role: "alert" } });

    expect(screen.getByRole("alert")).toHaveClass("bx--toast-notification");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
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

  it("renders the actions slot as a tertiary button under the text", () => {
    render(ToastNotificationActionsTest);

    const button = screen.getByRole("button", { name: "Retry" });
    const actions = button.parentElement;
    expect(actions).toHaveClass("bx--toast-notification__actions");
    expect(actions?.previousElementSibling).toHaveClass(
      "bx--toast-notification__caption",
    );
    expect(button).toHaveClass(
      "bx--toast-notification__action-button",
      "bx--btn--tertiary",
      "bx--btn--sm",
    );
    expect(button).not.toHaveClass(
      "bx--inline-notification__action-button",
      "bx--btn--ghost",
    );
  });

  it("renders an action with href as a tertiary link", () => {
    render(ToastNotificationActionsTest, {
      props: { href: "https://example.com/uploads" },
    });

    const link = screen.getByRole("link", { name: "Retry" });
    expect(link).toHaveAttribute("href", "https://example.com/uploads");
    expect(link).toHaveClass(
      "bx--toast-notification__action-button",
      "bx--btn--tertiary",
    );
  });

  it("describes the action by the title", () => {
    render(ToastNotificationActionsTest);

    expect(
      screen.getByRole("button", {
        name: "Retry",
        description: "Upload failed",
      }),
    ).toBeInTheDocument();
  });

  it("ignores timeout when it holds an action", async () => {
    const onclose = vi.fn();
    render(ToastNotificationActionsTest, { props: { timeout: 1000, onclose } });

    vi.advanceTimersByTime(10_000);
    await tick();

    expect(onclose).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("ignores timeout while actionable", async () => {
    const onclose = vi.fn();
    const { rerender } = render(ToastNotificationTest, {
      props: {
        title: "Upload failed",
        timeout: 1000,
        actionable: true,
        onclose,
      },
    });

    vi.advanceTimersByTime(10_000);
    await tick();
    expect(onclose).not.toHaveBeenCalled();

    await rerender({ actionable: false });
    vi.advanceTimersByTime(1000);
    await tick();
    expect(onclose).toHaveBeenCalledTimes(1);
    expect(onclose.mock.calls[0][0].detail).toEqual({ timeout: true });
  });

  it("renders no actions wrapper without the actions slot", () => {
    render(ToastNotificationTest, { props: { title: "Saved" } });

    expect(
      document.querySelector(".bx--toast-notification__actions"),
    ).not.toBeInTheDocument();
  });

  it("should render with full width", () => {
    render(ToastNotificationTest, {
      props: { fullWidth: true },
    });

    const notification = document.querySelector(".bx--toast-notification");
    expect(notification).toHaveStyle({ width: "100%" });
  });

  it("names the status icon after its kind", () => {
    render(ToastNotificationTest, { props: { kind: "warning-alt" } });

    const icon = screen.getByRole("img", { name: "Warning" });
    expect(icon).toHaveClass("bx--toast-notification__icon");
    expect(icon).toHaveAttribute("role", "img");
    expect(icon).not.toHaveAttribute("aria-hidden");
    expect(icon).not.toHaveAttribute("aria-label");
    expect(icon.querySelector("title")).toHaveTextContent("Warning");
  });

  it("names the status icon with statusIconDescription", () => {
    render(ToastNotificationTest, {
      props: { kind: "warning", statusIconDescription: "Avertissement" },
    });

    expect(
      screen.getByRole("img", { name: "Avertissement" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Warning" })).toBeNull();
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
