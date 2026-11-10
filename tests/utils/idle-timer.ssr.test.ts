// @vitest-environment node
import { get } from "svelte/store";
import { createIdleTimer } from "../../src/utils/idle-timer.js";

describe("createIdleTimer on the server", () => {
  it("creates and starts without a window, a timer or a listener", () => {
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    const timer = createIdleTimer({ timeout: 900_000, crossTab: true });
    const stop = timer.start();
    expect(get(timer).status).toBe("active");
    expect(timer.expiresAt()).toBeNull();
    expect(timer.remaining()).toBe(Number.POSITIVE_INFINITY);
    expect(setTimeoutSpy).not.toHaveBeenCalled();
    stop();
    timer.signOut();
    expect(get(timer).status).toBe("active");
    setTimeoutSpy.mockRestore();
  });
});
