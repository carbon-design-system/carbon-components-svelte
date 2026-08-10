import { createSubmenuHoverIntent } from "../../src/utils/submenuHoverIntent.js";

describe("createSubmenuHoverIntent", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("open() applies true immediately", () => {
    const setOpen = vi.fn();
    const intent = createSubmenuHoverIntent(setOpen, {
      openDelay: 150,
      closeDelay: 150,
    });
    intent.open();
    expect(setOpen).toHaveBeenCalledWith(true);
  });

  test("scheduleOpen() applies true after openDelay", () => {
    const setOpen = vi.fn();
    const intent = createSubmenuHoverIntent(setOpen, {
      openDelay: 150,
      closeDelay: 150,
    });
    intent.scheduleOpen();
    expect(setOpen).not.toHaveBeenCalled();
    vi.advanceTimersByTime(150);
    expect(setOpen).toHaveBeenCalledWith(true);
  });

  test("scheduleClose() applies false after closeDelay", () => {
    const setOpen = vi.fn();
    const intent = createSubmenuHoverIntent(setOpen, {
      openDelay: 150,
      closeDelay: 150,
    });
    intent.scheduleClose();
    expect(setOpen).not.toHaveBeenCalled();
    vi.advanceTimersByTime(150);
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  test("scheduleClose() cancels a pending scheduleOpen()", () => {
    const setOpen = vi.fn();
    const intent = createSubmenuHoverIntent(setOpen, {
      openDelay: 150,
      closeDelay: 150,
    });
    intent.scheduleOpen();
    intent.scheduleClose();
    vi.advanceTimersByTime(150);
    expect(setOpen).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  test("scheduleOpen() cancels a pending scheduleClose()", () => {
    const setOpen = vi.fn();
    const intent = createSubmenuHoverIntent(setOpen, {
      openDelay: 150,
      closeDelay: 150,
    });
    intent.scheduleClose();
    intent.scheduleOpen();
    vi.advanceTimersByTime(150);
    expect(setOpen).toHaveBeenCalledTimes(1);
    expect(setOpen).toHaveBeenCalledWith(true);
  });

  test("cancelClose() discards a pending close without affecting open", () => {
    const setOpen = vi.fn();
    const intent = createSubmenuHoverIntent(setOpen, {
      openDelay: 150,
      closeDelay: 150,
    });
    intent.scheduleClose();
    intent.cancelClose();
    vi.advanceTimersByTime(150);
    expect(setOpen).not.toHaveBeenCalled();
  });

  test("cancel() discards any pending open or close", () => {
    const setOpen = vi.fn();
    const intent = createSubmenuHoverIntent(setOpen, {
      openDelay: 150,
      closeDelay: 150,
    });
    intent.scheduleOpen();
    intent.cancel();
    vi.advanceTimersByTime(150);
    expect(setOpen).not.toHaveBeenCalled();
  });
});
