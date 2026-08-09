import { render, screen } from "@testing-library/svelte";
import {
  absorbUnhandledRejection,
  flushRejectionQueue,
  isConsumerBoom,
} from "../utils/absorb-unhandled-rejection";
import { user } from "../utils/user";
import TooltipDefinitionDispatchGuard from "./TooltipDefinitionDispatchGuard.test.svelte";

describe("TooltipDefinition dispatch guard", () => {
  it("does not prevent the dispatch itself from firing exactly once when on:open throws", async () => {
    const onOpen = vi.fn(() => {
      throw new Error("consumer boom");
    });
    const onClose = vi.fn();
    const trap = absorbUnhandledRejection(isConsumerBoom);

    render(TooltipDefinitionDispatchGuard, {
      props: { open: false, onOpen, onClose },
    });

    const trigger = screen.getByText("Tooltip trigger");

    try {
      await user.hover(trigger);
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

    render(TooltipDefinitionDispatchGuard, {
      props: { open: false, onOpen, onClose },
    });

    const trigger = screen.getByText("Tooltip trigger");

    await user.hover(trigger);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    await user.unhover(trigger);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
