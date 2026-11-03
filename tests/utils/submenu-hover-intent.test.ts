// @vitest-environment node
import { createSubmenuHoverIntent } from "../../src/utils/submenu-hover-intent.js";

describe("createSubmenuHoverIntent", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("open() applies true immediately", () => {
    const setOpen = vi.fn();
    const intent = createSubmenuHoverIntent(setOpen, {
      openDelay: 150,
      closeDelay: 150,
    });
    intent.open();
    expect(setOpen).toHaveBeenCalledWith(true);
  });

  it("scheduleOpen() applies true after openDelay", () => {
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

  it("scheduleClose() applies false after closeDelay", () => {
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

  it("scheduleClose() cancels a pending scheduleOpen()", () => {
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

  it("scheduleOpen() cancels a pending scheduleClose()", () => {
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

  it("cancelClose() discards a pending close without affecting open", () => {
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

  it("cancel() discards any pending open or close", () => {
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

describe("createSubmenuHoverIntent pointer aim", () => {
  // A submenu on the right of x = 300, spanning y 100 to 356.
  const rect = { left: 300, right: 500, top: 100, bottom: 356 };
  const submenu = { getBoundingClientRect: () => rect } as Element;
  const options = {
    openDelay: 150,
    closeDelay: 150,
    aimPause: 100,
    getSubmenu: () => submenu,
  };

  function leave(x: number, y: number) {
    return { clientX: x, clientY: y } as MouseEvent;
  }

  function move(x: number, y: number, pointerType = "mouse") {
    window.dispatchEvent(
      Object.assign(new Event("pointermove"), {
        clientX: x,
        clientY: y,
        pointerType,
      }),
    );
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("window", new EventTarget());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("holds the close while the pointer moves toward the submenu", () => {
    const setOpen = vi.fn();
    const intent = createSubmenuHoverIntent(setOpen, options);
    intent.scheduleClose(leave(200, 140));
    move(220, 160);
    vi.advanceTimersByTime(150);
    expect(setOpen).not.toHaveBeenCalled();
    move(240, 180);
    vi.advanceTimersByTime(100);
    expect(setOpen).not.toHaveBeenCalled();
    // The pointer enters the submenu.
    intent.cancelClose();
    vi.advanceTimersByTime(500);
    expect(setOpen).not.toHaveBeenCalled();
  });

  it("closes once the pointer pauses", () => {
    const setOpen = vi.fn();
    const intent = createSubmenuHoverIntent(setOpen, options);
    intent.scheduleClose(leave(200, 140));
    move(220, 160);
    vi.advanceTimersByTime(150);
    expect(setOpen).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("closes once the pointer turns away", () => {
    const setOpen = vi.fn();
    const intent = createSubmenuHoverIntent(setOpen, options);
    intent.scheduleClose(leave(200, 140));
    move(200, 180);
    vi.advanceTimersByTime(150);
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("closes after closeDelay when called without an event", () => {
    const setOpen = vi.fn();
    const intent = createSubmenuHoverIntent(setOpen, options);
    intent.scheduleClose();
    move(220, 160);
    vi.advanceTimersByTime(150);
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("ignores touch moves", () => {
    const setOpen = vi.fn();
    const intent = createSubmenuHoverIntent(setOpen, options);
    intent.scheduleClose(leave(200, 140));
    move(220, 160, "touch");
    vi.advanceTimersByTime(150);
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("closes after closeDelay when the submenu is closed", () => {
    const setOpen = vi.fn();
    const intent = createSubmenuHoverIntent(setOpen, {
      ...options,
      getSubmenu: () => null,
    });
    intent.scheduleClose(leave(200, 140));
    move(220, 160);
    vi.advanceTimersByTime(150);
    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("holds a sibling's open while the pointer aims at another submenu", () => {
    const setParent = vi.fn();
    const setSibling = vi.fn();
    const parent = createSubmenuHoverIntent(setParent, options);
    const sibling = createSubmenuHoverIntent(setSibling, options);
    parent.scheduleClose(leave(200, 140));
    sibling.scheduleOpen();
    move(220, 160);
    vi.advanceTimersByTime(150);
    expect(setSibling).not.toHaveBeenCalled();

    // The pointer stops on the sibling: the aim ends and the sibling opens.
    vi.advanceTimersByTime(100);
    expect(setParent).toHaveBeenCalledWith(false);
    expect(setSibling).toHaveBeenCalledWith(true);
    expect(setParent.mock.invocationCallOrder[0]).toBeLessThan(
      setSibling.mock.invocationCallOrder[0],
    );
  });

  it("drops a sibling's held open when the pointer leaves the sibling", () => {
    const setSibling = vi.fn();
    const parent = createSubmenuHoverIntent(vi.fn(), options);
    const sibling = createSubmenuHoverIntent(setSibling, options);
    parent.scheduleClose(leave(200, 140));
    sibling.scheduleOpen();
    move(220, 160);
    vi.advanceTimersByTime(150);
    sibling.scheduleClose(leave(230, 170));
    parent.cancelClose();
    vi.advanceTimersByTime(500);
    expect(setSibling).not.toHaveBeenCalledWith(true);
  });

  it("removes its pointermove listener when the aim ends", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const intent = createSubmenuHoverIntent(vi.fn(), options);
    intent.scheduleClose(leave(200, 140));
    expect(add).toHaveBeenCalledTimes(1);
    expect(remove).not.toHaveBeenCalled();
    intent.cancel();
    expect(remove).toHaveBeenCalledWith(
      "pointermove",
      add.mock.calls[0][1],
      add.mock.calls[0][2],
    );
  });
});
