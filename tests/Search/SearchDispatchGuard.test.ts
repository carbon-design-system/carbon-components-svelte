import { fireEvent, render, screen } from "@testing-library/svelte";
import {
  absorbUnhandledRejection,
  flushRejectionQueue,
  isConsumerBoom,
} from "../utils/absorb-unhandled-rejection";
import SearchDispatchGuard from "./SearchDispatchGuard.test.svelte";

describe("Search dispatch guard", () => {
  it("updates the previous-expanded guard before dispatching, so a throwing on:expand handler does not prevent the dispatch itself from firing exactly once", async () => {
    const onExpand = vi.fn(() => {
      throw new Error("consumer boom");
    });
    const onCollapse = vi.fn();
    const trap = absorbUnhandledRejection(isConsumerBoom);

    render(SearchDispatchGuard, {
      props: { expanded: false, onExpand, onCollapse },
    });

    const input = screen.getByRole("searchbox");

    try {
      await fireEvent.focus(input);
    } catch {
      // Framework-version-dependent: some Svelte versions surface this
      // synchronously here, others only via absorbUnhandledRejection below.
    }
    await Promise.race([trap.wait, flushRejectionQueue()]);
    trap.dispose();

    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it("dispatches expand then collapse in order across a full cycle", async () => {
    const onExpand = vi.fn();
    const onCollapse = vi.fn();

    render(SearchDispatchGuard, {
      props: { expanded: false, onExpand, onCollapse },
    });

    const input = screen.getByRole("searchbox");

    await fireEvent.focus(input);
    expect(onExpand).toHaveBeenCalledTimes(1);
    expect(onCollapse).not.toHaveBeenCalled();

    await fireEvent.blur(input);
    expect(onCollapse).toHaveBeenCalledTimes(1);
  });
});
