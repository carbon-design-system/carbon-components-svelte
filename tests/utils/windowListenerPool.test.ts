import { addPooledListener } from "../../src/utils/windowListenerPool.js";

describe("addPooledListener", () => {
  test("registers immediately and shares one listener across consumers", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const a = vi.fn();
    const b = vi.fn();

    const unlistenA = addPooledListener("scroll", a, { passive: true });
    const unlistenB = addPooledListener("scroll", b, { passive: true });

    expect(addSpy.mock.calls.filter((c) => c[0] === "scroll").length).toBe(1);

    window.dispatchEvent(new Event("scroll"));
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);

    unlistenA();
    unlistenB();
    addSpy.mockRestore();
  });

  test("removes the real listener only after the last consumer unregisters", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const handler = vi.fn();

    const unlistenA = addPooledListener("resize", handler);
    const unlistenB = addPooledListener("resize", handler);

    unlistenA();
    expect(removeSpy.mock.calls.filter((c) => c[0] === "resize").length).toBe(
      0,
    );

    unlistenB();
    expect(removeSpy.mock.calls.filter((c) => c[0] === "resize").length).toBe(
      1,
    );

    removeSpy.mockRestore();
  });

  test("keeps distinct options in separate pools", () => {
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
});
