import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import InlineNotificationTest from "../InlineNotification/InlineNotification.test.svelte";
import ToastNotificationTest from "../ToastNotification/ToastNotification.test.svelte";
import { user } from "../utils/user";

describe.each([
  {
    name: "ToastNotification",
    Fixture: ToastNotificationTest,
    root: ".bx--toast-notification",
  },
  {
    name: "InlineNotification",
    Fixture: InlineNotificationTest,
    root: ".bx--inline-notification",
  },
])("$name dismiss", ({ Fixture, root }) => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should dispatch close event when close button is clicked", async () => {
    vi.useRealTimers();
    const closeHandler = vi.fn();
    render(Fixture, { props: { onclose: closeHandler } });

    const closeButton = screen.getByLabelText("Close notification");
    await user.click(closeButton);
    await tick();

    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(closeHandler.mock.calls[0][0].detail).toEqual({
      timeout: false,
      trigger: "close-button",
    });
    expect(document.querySelector(root)).not.toBeInTheDocument();
  });

  it("should auto-close after timeout", async () => {
    const closeHandler = vi.fn();
    render(Fixture, { props: { timeout: 1000, onclose: closeHandler } });

    expect(closeHandler).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    await tick();

    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(closeHandler.mock.calls[0][0].detail).toEqual({
      timeout: true,
      trigger: "timeout",
    });
  });

  it("should pause timeout on hover when pauseOnHover is true", async () => {
    const closeHandler = vi.fn();
    render(Fixture, {
      props: { timeout: 1000, pauseOnHover: true, onclose: closeHandler },
    });

    const notification = document.querySelector(root);
    assert(notification);

    vi.advanceTimersByTime(400);
    await fireEvent.mouseEnter(notification);

    vi.advanceTimersByTime(1000);
    await tick();
    expect(closeHandler).not.toHaveBeenCalled();

    await fireEvent.mouseLeave(notification);
    vi.advanceTimersByTime(599);
    await tick();
    expect(closeHandler).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    await tick();
    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(closeHandler.mock.calls[0][0].detail).toEqual({
      timeout: true,
      trigger: "timeout",
    });
  });

  it("should not pause timeout on hover when pauseOnHover is false", async () => {
    const closeHandler = vi.fn();
    render(Fixture, {
      props: { timeout: 1000, pauseOnHover: false, onclose: closeHandler },
    });

    const notification = document.querySelector(root);
    assert(notification);

    vi.advanceTimersByTime(400);
    await fireEvent.mouseEnter(notification);

    vi.advanceTimersByTime(600);
    await tick();

    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(closeHandler.mock.calls[0][0].detail).toEqual({
      timeout: true,
      trigger: "timeout",
    });
  });

  it("should pause timeout while focus is inside and resume after focus leaves", async () => {
    const closeHandler = vi.fn();
    render(Fixture, {
      props: { timeout: 1000, pauseOnHover: true, onclose: closeHandler },
    });

    const closeButton = screen.getByRole("button", {
      name: "Close notification",
    });

    vi.advanceTimersByTime(400);
    closeButton.focus();

    vi.advanceTimersByTime(1000);
    await tick();
    expect(closeHandler).not.toHaveBeenCalled();

    closeButton.blur();
    vi.advanceTimersByTime(599);
    await tick();
    expect(closeHandler).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    await tick();
    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(closeHandler.mock.calls[0][0].detail).toEqual({
      timeout: true,
      trigger: "timeout",
    });
  });

  it("should not pause timeout on focus when pauseOnHover is false", async () => {
    const closeHandler = vi.fn();
    render(Fixture, {
      props: { timeout: 1000, pauseOnHover: false, onclose: closeHandler },
    });

    const closeButton = screen.getByRole("button", {
      name: "Close notification",
    });

    vi.advanceTimersByTime(400);
    closeButton.focus();

    vi.advanceTimersByTime(600);
    await tick();

    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(closeHandler.mock.calls[0][0].detail).toEqual({
      timeout: true,
      trigger: "timeout",
    });
  });

  it("should prevent close when event is cancelled", async () => {
    vi.useRealTimers();
    const closeHandler = vi.fn((e) => {
      e.preventDefault();
    });
    render(Fixture, { props: { onclose: closeHandler } });

    const closeButton = screen.getByLabelText("Close notification");
    await user.click(closeButton);
    await tick();

    expect(closeHandler).toHaveBeenCalledTimes(1);
    expect(document.querySelector(root)).toBeInTheDocument();
  });

  describe("Escape", () => {
    beforeEach(() => {
      vi.useRealTimers();
    });

    it("closes on Escape while focus is on the close button", async () => {
      const closeHandler = vi.fn();
      const onKeydown = vi.fn();
      document.addEventListener("keydown", onKeydown);
      render(Fixture, { props: { onclose: closeHandler } });

      screen.getByLabelText("Close notification").focus();
      await user.keyboard("{Escape}");
      await tick();
      document.removeEventListener("keydown", onKeydown);

      expect(closeHandler).toHaveBeenCalledTimes(1);
      expect(closeHandler.mock.calls[0][0].detail).toEqual({
        timeout: false,
        trigger: "escape-key",
      });
      expect(document.querySelector(root)).not.toBeInTheDocument();
      expect(onKeydown).not.toHaveBeenCalled();
    });

    it("stays open on Escape when the close event is cancelled", async () => {
      const closeHandler = vi.fn((e) => e.preventDefault());
      render(Fixture, { props: { onclose: closeHandler } });

      screen.getByLabelText("Close notification").focus();
      await user.keyboard("{Escape}");
      await tick();

      expect(closeHandler).toHaveBeenCalledTimes(1);
      expect(document.querySelector(root)).toBeInTheDocument();
    });

    it("stays open on Escape with hideCloseButton", async () => {
      const closeHandler = vi.fn();
      render(Fixture, {
        props: { hideCloseButton: true, title: "Saved", onclose: closeHandler },
      });

      const notification = document.querySelector<HTMLElement>(root)!;
      notification.tabIndex = -1;
      notification.focus();
      await user.keyboard("{Escape}");
      await tick();

      expect(closeHandler).not.toHaveBeenCalled();
      expect(document.querySelector(root)).toBeInTheDocument();
    });

    it("stays open on Escape with closeOnEscape false", async () => {
      const closeHandler = vi.fn();
      render(Fixture, {
        props: { closeOnEscape: false, onclose: closeHandler },
      });

      screen.getByLabelText("Close notification").focus();
      await user.keyboard("{Escape}");
      await tick();

      expect(closeHandler).not.toHaveBeenCalled();
      expect(document.querySelector(root)).toBeInTheDocument();
    });

    it("ignores Escape when focus is outside", async () => {
      const closeHandler = vi.fn();
      render(Fixture, { props: { onclose: closeHandler } });

      await user.keyboard("{Escape}");

      expect(closeHandler).not.toHaveBeenCalled();
    });
  });
});
