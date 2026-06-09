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

describe("dismiss listener pooling", () => {
  const clickAdds = (spy: ReturnType<typeof vi.spyOn>) =>
    spy.mock.calls.filter((c: unknown[]) => c[0] === "click").length;

  test("many open consumers share one window listener", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const handlers = Array.from({ length: 5 }, () => vi.fn());
    const actions = handlers.map((handler) =>
      dismiss(document.createElement("div"), {
        enabled: true,
        type: "click",
        handler,
      }),
    );

    expect(clickAdds(addSpy)).toBe(1);

    window.dispatchEvent(new MouseEvent("click"));
    for (const h of handlers) expect(h).toHaveBeenCalledTimes(1);

    // Listener stays until the last consumer is destroyed.
    for (const a of actions.slice(0, -1)) a.destroy();
    expect(removeSpy.mock.calls.filter((c) => c[0] === "click").length).toBe(0);
    actions[actions.length - 1].destroy();
    expect(removeSpy.mock.calls.filter((c) => c[0] === "click").length).toBe(1);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  test("calls consumers in registration order", () => {
    const order: number[] = [];
    const a = dismiss(document.createElement("div"), {
      enabled: true,
      type: "click",
      handler: () => order.push(1),
    });
    const b = dismiss(document.createElement("div"), {
      enabled: true,
      type: "click",
      handler: () => order.push(2),
    });
    const c = dismiss(document.createElement("div"), {
      enabled: true,
      type: "click",
      handler: () => order.push(3),
    });

    window.dispatchEvent(new MouseEvent("click"));
    expect(order).toEqual([1, 2, 3]);

    a.destroy();
    b.destroy();
    c.destroy();
  });

  test("unregister during dispatch skips removed consumer", () => {
    const calls: string[] = [];
    let inner: ReturnType<typeof dismiss>;
    const outer = dismiss(document.createElement("div"), {
      enabled: true,
      type: "click",
      handler: () => {
        calls.push("outer");
        inner.destroy();
      },
    });
    inner = dismiss(document.createElement("div"), {
      enabled: true,
      type: "click",
      handler: () => calls.push("inner"),
    });

    window.dispatchEvent(new MouseEvent("click"));
    expect(calls).toEqual(["outer"]);

    outer.destroy();
  });

  test("consumer added mid-dispatch waits for the next event", () => {
    const calls: string[] = [];
    let added: ReturnType<typeof dismiss> | undefined;

    const first = dismiss(document.createElement("div"), {
      enabled: true,
      type: "click",
      handler: () => {
        calls.push("first");
        if (added) return;
        added = dismiss(document.createElement("div"), {
          enabled: true,
          type: "click",
          handler: () => calls.push("added"),
        });
      },
    });

    window.dispatchEvent(new MouseEvent("click"));
    expect(calls).toEqual(["first"]);

    window.dispatchEvent(new MouseEvent("click"));
    expect(calls).toEqual(["first", "first", "added"]);

    first.destroy();
    added?.destroy();
  });

  test("capture and bubble get separate listeners", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const bubble = vi.fn();
    const capture = vi.fn();

    const a = dismiss(document.createElement("div"), {
      enabled: true,
      type: "click",
      handler: bubble,
    });
    const b = dismiss(document.createElement("div"), {
      enabled: true,
      type: "click",
      handler: capture,
      options: { capture: true },
    });

    expect(clickAdds(addSpy)).toBe(2);

    a.destroy();
    b.destroy();
    addSpy.mockRestore();
  });
});
