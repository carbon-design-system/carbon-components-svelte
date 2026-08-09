import { render, screen } from "@testing-library/svelte";
import {
  absorbUnhandledRejection,
  flushRejectionQueue,
  isConsumerBoom,
} from "../utils/absorb-unhandled-rejection";
import { user } from "../utils/user";
import ToggletipDispatchGuard from "./ToggletipDispatchGuard.test.svelte";

describe("Toggletip dispatch guard", () => {
  it("updates the previous-open guard before dispatching, so a throwing on:open handler does not prevent the dispatch itself from firing exactly once", async () => {
    const onOpen = vi.fn(() => {
      throw new Error("consumer boom");
    });
    const onClose = vi.fn();
    const trap = absorbUnhandledRejection(isConsumerBoom);

    render(ToggletipDispatchGuard, {
      props: { open: false, onOpen, onClose },
    });

    const trigger = screen.getByRole("button", { name: "Information" });

    try {
      await user.click(trigger);
    } catch {
      // Framework-version-dependent: some Svelte versions surface this
      // synchronously here, others only via absorbUnhandledRejection below.
    }
    await Promise.race([trap.wait, flushRejectionQueue()]);
    trap.dispose();

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("dispatches open then close in order across a full cycle", async () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();

    render(ToggletipDispatchGuard, {
      props: { open: false, onOpen, onClose },
    });

    const trigger = screen.getByRole("button", { name: "Information" });

    await user.click(trigger);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    await user.click(trigger);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
