import { addPooledListener } from "../../src/utils/window-listener-pool.js";

describe("addPooledListener", () => {
  it("shares one real listener across consumers until the last unregisters", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const a = vi.fn();
    const b = vi.fn();

    const unlistenA = addPooledListener("scroll", a, { passive: true });
    const unlistenB = addPooledListener("scroll", b, { passive: true });

    expect(addSpy.mock.calls.filter((c) => c[0] === "scroll").length).toBe(1);

    window.dispatchEvent(new Event("scroll"));
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);

    unlistenA();
    expect(removeSpy.mock.calls.filter((c) => c[0] === "scroll").length).toBe(
      0,
    );

    unlistenB();
    expect(removeSpy.mock.calls.filter((c) => c[0] === "scroll").length).toBe(
      1,
    );

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it("keeps distinct options in separate pools", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const bubble = vi.fn();
    const capture = vi.fn();

    const unlistenBubble = addPooledListener("click", bubble);
    const unlistenCapture = addPooledListener("click", capture, {
      capture: true,
    });

    expect(addSpy.mock.calls.filter((c) => c[0] === "click").length).toBe(2);

    unlistenBubble();
    unlistenCapture();
    addSpy.mockRestore();
  });

  it("calls consumers in registration order", () => {
    const order: number[] = [];
    const unlisten = [1, 2, 3].map((n) =>
      addPooledListener("click", () => order.push(n)),
    );

    window.dispatchEvent(new MouseEvent("click"));
    expect(order).toEqual([1, 2, 3]);

    for (const u of unlisten) u();
  });

  it("unregister during dispatch skips the removed consumer", () => {
    const calls: string[] = [];
    let unlistenInner: () => void = () => {};
    const unlistenOuter = addPooledListener("click", () => {
      calls.push("outer");
      unlistenInner();
    });
    unlistenInner = addPooledListener("click", () => calls.push("inner"));

    window.dispatchEvent(new MouseEvent("click"));
    expect(calls).toEqual(["outer"]);

    unlistenOuter();
  });

  it("consumer added mid-dispatch waits for the next event", () => {
    const calls: string[] = [];
    let unlistenAdded: (() => void) | undefined;

    const unlistenFirst = addPooledListener("click", () => {
      calls.push("first");
      if (unlistenAdded) return;
      unlistenAdded = addPooledListener("click", () => calls.push("added"));
    });

    window.dispatchEvent(new MouseEvent("click"));
    expect(calls).toEqual(["first"]);

    window.dispatchEvent(new MouseEvent("click"));
    expect(calls).toEqual(["first", "first", "added"]);

    unlistenFirst();
    unlistenAdded?.();
  });
});
