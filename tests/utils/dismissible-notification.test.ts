import { createDismissibleNotification } from "../../src/utils/dismissible-notification.js";

describe("createDismissibleNotification", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("close() dispatches a cancelable close and sets open false when not prevented", () => {
    const dispatch = vi.fn(() => true);
    const setOpen = vi.fn();
    const notification = createDismissibleNotification({
      dispatch,
      getPauseOnHover: () => false,
      setOpen,
    });

    notification.close();

    expect(dispatch).toHaveBeenCalledWith(
      "close",
      { timeout: false },
      { cancelable: true },
    );
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("close() does not set open when a listener prevents it", () => {
    const dispatch = vi.fn(() => false);
    const setOpen = vi.fn();
    const notification = createDismissibleNotification({
      dispatch,
      getPauseOnHover: () => false,
      setOpen,
    });

    notification.close();

    expect(setOpen).not.toHaveBeenCalled();
  });

  it("close() reports timeout: true only when called with closeFromTimeout === true", () => {
    const dispatch = vi.fn(() => true);
    const notification = createDismissibleNotification({
      dispatch,
      getPauseOnHover: () => false,
      setOpen: vi.fn(),
    });

    notification.close(true);
    expect(dispatch).toHaveBeenCalledWith(
      "close",
      { timeout: true },
      { cancelable: true },
    );

    // A click handler's event argument is not a timeout close.
    notification.close(new MouseEvent("click"));
    expect(dispatch).toHaveBeenLastCalledWith(
      "close",
      { timeout: false },
      { cancelable: true },
    );
  });

  it("sync() auto-closes with timeout: true after the given delay", () => {
    const dispatch = vi.fn(() => true);
    const setOpen = vi.fn();
    const notification = createDismissibleNotification({
      dispatch,
      getPauseOnHover: () => false,
      setOpen,
    });

    notification.sync(true, 100);
    expect(dispatch).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);

    expect(dispatch).toHaveBeenCalledWith(
      "close",
      { timeout: true },
      { cancelable: true },
    );
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("sync() does not schedule a close when open is false", () => {
    const dispatch = vi.fn(() => true);
    const notification = createDismissibleNotification({
      dispatch,
      getPauseOnHover: () => false,
      setOpen: vi.fn(),
    });

    notification.sync(false, 100);
    vi.advanceTimersByTime(1000);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("dispose() cancels a pending sync() timeout", () => {
    const dispatch = vi.fn(() => true);
    const notification = createDismissibleNotification({
      dispatch,
      getPauseOnHover: () => false,
      setOpen: vi.fn(),
    });

    notification.sync(true, 100);
    notification.dispose();
    vi.advanceTimersByTime(100);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("handleMouseenter pauses and handleMouseleave resumes when pauseOnHover is true", () => {
    const dispatch = vi.fn(() => true);
    const notification = createDismissibleNotification({
      dispatch,
      getPauseOnHover: () => true,
      setOpen: vi.fn(),
    });

    notification.sync(true, 100);
    vi.advanceTimersByTime(50);

    const root = document.createElement("div");
    const enterEvent = new MouseEvent("mouseenter");
    Object.defineProperty(enterEvent, "currentTarget", { value: root });
    notification.handleMouseenter();

    vi.advanceTimersByTime(1000);
    expect(dispatch).not.toHaveBeenCalled();

    const leaveEvent = new MouseEvent("mouseleave", {
      relatedTarget: document.body,
    });
    Object.defineProperty(leaveEvent, "currentTarget", { value: root });
    notification.handleMouseleave(leaveEvent);

    vi.advanceTimersByTime(50);
    expect(dispatch).toHaveBeenCalledWith(
      "close",
      { timeout: true },
      { cancelable: true },
    );
  });
});
