import { render, screen } from "@testing-library/svelte";
import {
  absorbUnhandledRejection,
  flushRejectionQueue,
  isConsumerBoom,
} from "../utils/absorb-unhandled-rejection";
import { getBoundText } from "../utils/get-bound-text";
import {
  mockSnippetOverflowHeight,
  waitForSnippetMeasurement,
} from "../utils/mock-snippet-overflow-height";
import { user } from "../utils/user";
import CodeSnippetDispatchGuard from "./CodeSnippetDispatchGuard.test.svelte";

describe("CodeSnippet dispatch guard", () => {
  it("updates the previous-expanded guard before dispatching, so a throwing on:expand handler does not prevent the dispatch itself from firing exactly once", async () => {
    mockSnippetOverflowHeight();
    const onExpand = vi.fn(() => {
      throw new Error("consumer boom");
    });
    const onCollapse = vi.fn();
    const trap = absorbUnhandledRejection(isConsumerBoom);

    render(CodeSnippetDispatchGuard, {
      props: { expanded: false, onExpand, onCollapse },
    });
    await waitForSnippetMeasurement();

    const showMoreButton = await screen.findByText("Show more");

    try {
      await user.click(showMoreButton);
    } catch {
      // Framework-version-dependent: some Svelte versions surface this
      // synchronously here, others only via absorbUnhandledRejection below.
    }
    await Promise.race([trap.wait, flushRejectionQueue()]);
    trap.dispose();

    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it("leaves a bound expanded alone when the code doesn't overflow", async () => {
    mockSnippetOverflowHeight(32);
    const onCollapse = vi.fn();
    const { container } = render(CodeSnippetDispatchGuard, {
      props: { expanded: true, onCollapse },
    });
    await waitForSnippetMeasurement();

    expect(screen.queryByText("Show less")).not.toBeInTheDocument();
    expect(container.querySelector(".bx--snippet")).not.toHaveClass(
      "bx--snippet--expand",
    );
    expect(getBoundText()).toBe("true");
    expect(onCollapse).not.toHaveBeenCalled();
  });
});
