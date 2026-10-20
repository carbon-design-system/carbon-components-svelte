import { render, screen } from "@testing-library/svelte";
import TooltipDefinitionDispatchGuard from "../TooltipDefinition/TooltipDefinitionDispatchGuard.test.svelte";
import TooltipIconDispatchGuard from "../TooltipIcon/TooltipIconDispatchGuard.test.svelte";
import {
  absorbUnhandledRejection,
  flushRejectionQueue,
  isConsumerBoom,
} from "../utils/absorb-unhandled-rejection";
import { user } from "../utils/user";

describe.each([
  ["TooltipIcon", TooltipIconDispatchGuard, () => screen.getByRole("button")],
  [
    "TooltipDefinition",
    TooltipDefinitionDispatchGuard,
    () => screen.getByText("Tooltip trigger"),
  ],
])("%s dispatch guard", (_name, Fixture, getTrigger) => {
  it("does not prevent the dispatch itself from firing exactly once when on:open throws", async () => {
    const onOpen = vi.fn(() => {
      throw new Error("consumer boom");
    });
    const onClose = vi.fn();
    const trap = absorbUnhandledRejection(isConsumerBoom);

    render(Fixture, { props: { open: false, onOpen, onClose } });

    const trigger = getTrigger();

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

    render(Fixture, { props: { open: false, onOpen, onClose } });

    const trigger = getTrigger();

    await user.hover(trigger);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    await user.unhover(trigger);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
