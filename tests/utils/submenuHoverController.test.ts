import { createSubmenuHoverController } from "../../src/utils/submenuHoverController.js";

const DELAY_MS = 150;

/** Minimal DOM-like stand-in with a stubbed rect. */
function fakeElement(rect: {
  top: number;
  left: number;
  right: number;
  bottom: number;
  height: number;
}) {
  return { getBoundingClientRect: () => rect as DOMRect };
}

describe("createSubmenuHoverController", () => {
  // Trigger flush against a submenu opening to the right (matches the
  // isInSafeTriangle fixture already validated elsewhere).
  const trigger = fakeElement({ top: 100, left: 0, right: 100, bottom: 120, height: 20 });
  const submenu = fakeElement({ top: 100, left: 100, right: 300, bottom: 300, height: 200 });

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens after the hover delay", async () => {
    const setOpen = vi.fn();
    const controller = createSubmenuHoverController({
      isDisabled: () => false,
      setOpen,
      getTrigger: () => trigger,
      getSubmenu: () => submenu,
      delayMs: DELAY_MS,
    });

    controller.scheduleOpen();
    expect(setOpen).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(DELAY_MS);
    expect(setOpen).toHaveBeenCalledWith(true);
  });

  it("does not schedule an open when disabled", async () => {
    const setOpen = vi.fn();
    const controller = createSubmenuHoverController({
      isDisabled: () => true,
      setOpen,
      getTrigger: () => trigger,
      getSubmenu: () => submenu,
      delayMs: DELAY_MS,
    });

    controller.scheduleOpen();
    await vi.advanceTimersByTimeAsync(DELAY_MS);
    expect(setOpen).not.toHaveBeenCalled();
  });

  it("open() opens immediately regardless of pending timers", () => {
    const setOpen = vi.fn();
    const controller = createSubmenuHoverController({
      isDisabled: () => false,
      setOpen,
      getTrigger: () => trigger,
      getSubmenu: () => submenu,
      delayMs: DELAY_MS,
    });

    controller.open();
    expect(setOpen).toHaveBeenCalledWith(true);
  });

  it("closes after the delay when the pointer is not in the safe triangle", async () => {
    const setOpen = vi.fn();
    const controller = createSubmenuHoverController({
      isDisabled: () => false,
      setOpen,
      getTrigger: () => trigger,
      getSubmenu: () => submenu,
      delayMs: DELAY_MS,
    });

    controller.trackPointer(105, 400); // far outside the wedge
    controller.scheduleClose();
    await vi.advanceTimersByTimeAsync(DELAY_MS);

    expect(setOpen).toHaveBeenCalledWith(false);
  });

  it("does not close when the pointer is in the safe triangle at fire time", async () => {
    const setOpen = vi.fn();
    const controller = createSubmenuHoverController({
      isDisabled: () => false,
      setOpen,
      getTrigger: () => trigger,
      getSubmenu: () => submenu,
      delayMs: DELAY_MS,
    });

    controller.trackPointer(110, 200); // inside the wedge toward the submenu's vertical center
    controller.scheduleClose();
    await vi.advanceTimersByTimeAsync(DELAY_MS);

    expect(setOpen).not.toHaveBeenCalled();
  });

  it("cancelClose prevents a pending close from firing", async () => {
    const setOpen = vi.fn();
    const controller = createSubmenuHoverController({
      isDisabled: () => false,
      setOpen,
      getTrigger: () => trigger,
      getSubmenu: () => submenu,
      delayMs: DELAY_MS,
    });

    controller.scheduleClose();
    controller.cancelClose();
    await vi.advanceTimersByTimeAsync(DELAY_MS);

    expect(setOpen).not.toHaveBeenCalled();
  });

  it("trackPointer cancels a pending close early once the pointer becomes safe", async () => {
    const setOpen = vi.fn();
    const controller = createSubmenuHoverController({
      isDisabled: () => false,
      setOpen,
      getTrigger: () => trigger,
      getSubmenu: () => submenu,
      delayMs: DELAY_MS,
    });

    controller.trackPointer(105, 400); // starts unsafe
    controller.scheduleClose();
    controller.trackPointer(110, 200); // moves into the wedge before the delay elapses
    await vi.advanceTimersByTimeAsync(DELAY_MS);

    expect(setOpen).not.toHaveBeenCalled();
  });

  it("destroy clears pending open and close timers", async () => {
    const setOpen = vi.fn();
    const controller = createSubmenuHoverController({
      isDisabled: () => false,
      setOpen,
      getTrigger: () => trigger,
      getSubmenu: () => submenu,
      delayMs: DELAY_MS,
    });

    controller.scheduleOpen();
    controller.destroy();
    await vi.advanceTimersByTimeAsync(DELAY_MS);

    expect(setOpen).not.toHaveBeenCalled();
  });
});
