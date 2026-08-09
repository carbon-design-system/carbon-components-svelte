import { fireEvent, render, screen } from "@testing-library/svelte";
import {
  absorbUnhandledRejection,
  flushRejectionQueue,
  isConsumerBoom,
} from "../utils/absorb-unhandled-rejection";
import TooltipDispatchGuard from "./TooltipDispatchGuard.test.svelte";

describe("Tooltip dispatch guard", () => {
  it("updates the previous-open guard before dispatching, so a throwing on:open handler does not prevent the dispatch itself from firing exactly once", async () => {
    const onOpen = vi.fn(() => {
      throw new Error("consumer boom");
    });
    const onClose = vi.fn();
    const trap = absorbUnhandledRejection(isConsumerBoom);

    vi.useFakeTimers();
    render(TooltipDispatchGuard, {
      props: { open: false, onOpen, onClose },
    });

    const trigger = screen.getByRole("button");

    try {
      await fireEvent.mouseEnter(trigger);
      await vi.advanceTimersByTimeAsync(100);
    } catch {
      // Framework-version-dependent: some Svelte versions surface this
      // synchronously here, others only via absorbUnhandledRejection below.
    }
    // Real timers so `flushRejectionQueue`'s setImmediate can actually fire;
    // fake timers leave it (and thus this whole race) hanging.
    vi.useRealTimers();
    await Promise.race([trap.wait, flushRejectionQueue()]);
    trap.dispose();

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("dispatches open then close in order across a full cycle", async () => {
    vi.useFakeTimers();
    const onOpen = vi.fn();
    const onClose = vi.fn();

    render(TooltipDispatchGuard, {
      props: { open: false, onOpen, onClose },
    });

    const trigger = screen.getByRole("button");
    await fireEvent.mouseEnter(trigger);
    await vi.advanceTimersByTimeAsync(100);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    const tooltip = screen.getByRole("dialog");
    await fireEvent.keyDown(tooltip, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
