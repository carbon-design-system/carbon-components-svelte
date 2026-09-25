import { blurOnMouseClose } from "../../src/utils/blur-on-mouse-close.js";

function makeTrigger() {
  return { blur: vi.fn() };
}

function clickEvent(detail: number) {
  return { detail } as unknown as MouseEvent;
}

describe("blurOnMouseClose", () => {
  it("blurs on a mouse-driven close (was open, detail !== 0)", () => {
    const trigger = makeTrigger();
    blurOnMouseClose(true, clickEvent(1), trigger);
    expect(trigger.blur).toHaveBeenCalledTimes(1);
  });

  it("does not blur on a keyboard-driven close (detail === 0)", () => {
    const trigger = makeTrigger();
    blurOnMouseClose(true, clickEvent(0), trigger);
    expect(trigger.blur).not.toHaveBeenCalled();
  });

  it("does not blur when it was not open (an open, not a close)", () => {
    const trigger = makeTrigger();
    blurOnMouseClose(false, clickEvent(1), trigger);
    expect(trigger.blur).not.toHaveBeenCalled();
  });

  it("tolerates a null trigger", () => {
    expect(() => blurOnMouseClose(true, clickEvent(1), null)).not.toThrow();
  });
});
