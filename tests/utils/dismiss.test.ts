import { dismiss } from "../../src/utils/dismiss.js";

describe("dismiss action", () => {
  let node: HTMLElement;

  beforeEach(() => {
    node = document.createElement("div");
    document.body.appendChild(node);
  });

  afterEach(() => {
    node.remove();
  });

  test("registers a window listener only while enabled", () => {
    const handler = vi.fn();
    const action = dismiss(node, { enabled: true, type: "click", handler });

    window.dispatchEvent(new MouseEvent("click"));
    expect(handler).toHaveBeenCalledTimes(1);

    action.destroy();
  });

  test("does not register while disabled", () => {
    const handler = vi.fn();
    const action = dismiss(node, { enabled: false, type: "click", handler });

    window.dispatchEvent(new MouseEvent("click"));
    expect(handler).not.toHaveBeenCalled();

    action.destroy();
  });

  test("toggles the listener as enabled flips", () => {
    const handler = vi.fn();
    const action = dismiss(node, { enabled: false, type: "click", handler });

    window.dispatchEvent(new MouseEvent("click"));
    expect(handler).not.toHaveBeenCalled();

    action.update({ enabled: true, type: "click", handler });
    window.dispatchEvent(new MouseEvent("click"));
    expect(handler).toHaveBeenCalledTimes(1);

    action.update({ enabled: false, type: "click", handler });
    window.dispatchEvent(new MouseEvent("click"));
    expect(handler).toHaveBeenCalledTimes(1);

    action.destroy();
  });

  test("removes the listener on destroy", () => {
    const handler = vi.fn();
    const action = dismiss(node, { enabled: true, type: "click", handler });

    action.destroy();
    window.dispatchEvent(new MouseEvent("click"));
    expect(handler).not.toHaveBeenCalled();
  });

  test("shares one handler across multiple event types", () => {
    const handler = vi.fn();
    const action = dismiss(node, {
      enabled: true,
      type: ["click", "focusin"],
      handler,
    });

    window.dispatchEvent(new MouseEvent("click"));
    window.dispatchEvent(new FocusEvent("focusin"));
    expect(handler).toHaveBeenCalledTimes(2);

    action.destroy();
  });

  test("supports distinct handlers per type via listeners", () => {
    const onClick = vi.fn();
    const onKeydown = vi.fn();
    const action = dismiss(node, {
      enabled: true,
      listeners: [
        { type: "click", handler: onClick },
        { type: "keydown", handler: onKeydown },
      ],
    });

    window.dispatchEvent(new MouseEvent("click"));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onKeydown).toHaveBeenCalledTimes(1);

    action.destroy();
  });

  test("refreshes the handler in place without re-adding the listener", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const first = vi.fn();
    const second = vi.fn();

    const action = dismiss(node, {
      enabled: true,
      type: "click",
      handler: first,
    });
    const addsAfterInit = addSpy.mock.calls.filter(
      (c) => c[0] === "click",
    ).length;

    action.update({ enabled: true, type: "click", handler: second });

    const addsAfterUpdate = addSpy.mock.calls.filter(
      (c) => c[0] === "click",
    ).length;
    expect(addsAfterUpdate).toBe(addsAfterInit);

    window.dispatchEvent(new MouseEvent("click"));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);

    action.destroy();
    addSpy.mockRestore();
  });

  test("passes the passive flag through to addEventListener", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const handler = vi.fn();
    const action = dismiss(node, {
      enabled: true,
      type: "touchmove",
      handler,
      options: { passive: true },
    });

    const call = addSpy.mock.calls.find((c) => c[0] === "touchmove");
    expect(call?.[2]).toEqual({ passive: true });

    action.destroy();
    addSpy.mockRestore();
  });

  test("forwards the real event to the handler", () => {
    let received: Event | undefined;
    const action = dismiss(node, {
      enabled: true,
      type: "click",
      handler: (event) => {
        received = event;
      },
    });

    const event = new MouseEvent("click");
    window.dispatchEvent(event);
    expect(received).toBe(event);

    action.destroy();
  });
});
