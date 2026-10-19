import { dismiss } from "../../src/utils/dismiss.js";

/** Registration is deferred by a macrotask; flush it before dispatching test events. */
const flush = () => new Promise((resolve) => setTimeout(resolve));

describe("dismiss action", () => {
  let node: HTMLElement;

  beforeEach(() => {
    node = document.createElement("div");
    document.body.appendChild(node);
  });

  afterEach(() => {
    node.remove();
  });

  it("does not fire for the click that enables it (same dispatch)", async () => {
    const handler = vi.fn();
    const action = dismiss(node, { enabled: true, type: "click", handler });

    // No flush: dispatch immediately, simulating the enabling click still
    // completing its own dispatch before the deferred registration runs.
    window.dispatchEvent(new MouseEvent("click"));
    expect(handler).not.toHaveBeenCalled();

    await flush();
    window.dispatchEvent(new MouseEvent("click"));
    expect(handler).toHaveBeenCalledTimes(1);

    action.destroy();
  });

  it("toggles the listener as enabled flips", async () => {
    const handler = vi.fn();
    const action = dismiss(node, { enabled: false, type: "click", handler });
    await flush();

    window.dispatchEvent(new MouseEvent("click"));
    expect(handler).not.toHaveBeenCalled();

    action.update({ enabled: true, type: "click", handler });
    await flush();
    window.dispatchEvent(new MouseEvent("click"));
    expect(handler).toHaveBeenCalledTimes(1);

    action.update({ enabled: false, type: "click", handler });
    await flush();
    window.dispatchEvent(new MouseEvent("click"));
    expect(handler).toHaveBeenCalledTimes(1);

    action.destroy();
  });

  it("removes the listener on destroy", async () => {
    const handler = vi.fn();
    const action = dismiss(node, { enabled: true, type: "click", handler });
    await flush();

    action.destroy();
    window.dispatchEvent(new MouseEvent("click"));
    expect(handler).not.toHaveBeenCalled();
  });

  it("does not register after destroy races the deferred registration", async () => {
    const handler = vi.fn();
    const action = dismiss(node, { enabled: true, type: "click", handler });
    action.destroy();
    await flush();

    window.dispatchEvent(new MouseEvent("click"));
    expect(handler).not.toHaveBeenCalled();
  });

  it("shares one handler across multiple event types", async () => {
    const handler = vi.fn();
    const action = dismiss(node, {
      enabled: true,
      type: ["click", "focusin"],
      handler,
    });
    await flush();

    window.dispatchEvent(new MouseEvent("click"));
    window.dispatchEvent(new FocusEvent("focusin"));
    expect(handler).toHaveBeenCalledTimes(2);

    action.destroy();
  });

  it("supports distinct handlers per type via listeners", async () => {
    const onClick = vi.fn();
    const onKeydown = vi.fn();
    const action = dismiss(node, {
      enabled: true,
      listeners: [
        { type: "click", handler: onClick },
        { type: "keydown", handler: onKeydown },
      ],
    });
    await flush();

    window.dispatchEvent(new MouseEvent("click"));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onKeydown).toHaveBeenCalledTimes(1);

    action.destroy();
  });

  it("refreshes the handler in place without re-adding the listener", async () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const first = vi.fn();
    const second = vi.fn();

    const action = dismiss(node, {
      enabled: true,
      type: "click",
      handler: first,
    });
    await flush();
    const addsAfterInit = addSpy.mock.calls.filter(
      (c) => c[0] === "click",
    ).length;

    action.update({ enabled: true, type: "click", handler: second });
    await flush();

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

  it("passes the passive flag through to addEventListener", async () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const handler = vi.fn();
    const action = dismiss(node, {
      enabled: true,
      type: "touchmove",
      handler,
      options: { passive: true },
    });
    await flush();

    const call = addSpy.mock.calls.find((c) => c[0] === "touchmove");
    expect(call?.[2]).toEqual({ passive: true });

    action.destroy();
    addSpy.mockRestore();
  });

  it("forwards the real event to the handler", async () => {
    let received: Event | undefined;
    const action = dismiss(node, {
      enabled: true,
      type: "click",
      handler: (event) => {
        received = event;
      },
    });
    await flush();

    const event = new MouseEvent("click");
    window.dispatchEvent(event);
    expect(received).toBe(event);

    action.destroy();
  });
});

describe("dismiss keyboard listeners", () => {
  let node: HTMLElement;

  beforeEach(() => {
    node = document.createElement("div");
    document.body.appendChild(node);
  });

  afterEach(() => {
    node.remove();
  });

  it("register immediately, before the deferred pointer listeners", async () => {
    const onKeydown = vi.fn();
    const onClick = vi.fn();
    const action = dismiss(node, {
      enabled: true,
      listeners: [
        { type: "click", handler: onClick },
        { type: "keydown", handler: onKeydown },
      ],
    });

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    window.dispatchEvent(new MouseEvent("click"));
    expect(onKeydown).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();

    await flush();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    window.dispatchEvent(new MouseEvent("click"));
    expect(onKeydown).toHaveBeenCalledTimes(2);
    expect(onClick).toHaveBeenCalledTimes(1);

    action.destroy();
  });

  it("register immediately when enabled by an update", () => {
    const handler = vi.fn();
    const action = dismiss(node, { enabled: false, type: "keydown", handler });

    action.update({ enabled: true, type: "keydown", handler });
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(handler).toHaveBeenCalledTimes(1);

    action.update({ enabled: false, type: "keydown", handler });
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(handler).toHaveBeenCalledTimes(1);

    action.destroy();
  });

  it("keeps one registration per listener across updates while deferred", async () => {
    const handler = vi.fn();
    const params = {
      enabled: true,
      listeners: [
        { type: "click", handler },
        { type: "keydown", handler },
      ],
    };
    const action = dismiss(node, params);
    action.update({ ...params });
    action.update({ ...params });
    await flush();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    window.dispatchEvent(new MouseEvent("click"));
    expect(handler).toHaveBeenCalledTimes(2);

    action.destroy();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    window.dispatchEvent(new MouseEvent("click"));
    expect(handler).toHaveBeenCalledTimes(2);
  });
});
