import { render, screen, waitFor, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import TagSetCustomTooltipFixture from "./TagSet.customTooltip.test.svelte";
import TagSetFixture from "./TagSet.test.svelte";
import TagSetSelectableFixture from "./TagSetSelectable.test.svelte";

/** Stub `offsetWidth` on an element (jsdom has no real layout). */
function stubWidth(el: Element, width: number) {
  Object.defineProperty(el, "offsetWidth", {
    configurable: true,
    value: width,
  });
}

/**
 * Give the wrapper a fixed `availableWidth`, every slotted tag a fixed
 * width, and the "+N" trigger a 40px width, so the next
 * ResizeObserver -> rafThrottle pass recomputes which tags overflow.
 */
function stubMeasurements(
  container: HTMLElement,
  availableWidth: number,
  tagWidth: number,
) {
  const wrapper = container.querySelector(".bx--tag-set");
  assert(wrapper instanceof HTMLElement);
  stubWidth(wrapper, availableWidth);

  const tags = Array.from(
    container.querySelectorAll(".bx--tag-set__space > .bx--tag"),
  );
  for (const el of tags) stubWidth(el, tagWidth);

  const trigger = container.querySelector(
    ".bx--tag-set-overflow__popover-trigger",
  );
  assert(trigger instanceof HTMLElement);
  stubWidth(trigger, 40);
}

/** Labels of tags actually shown (not pulled out via `data-overflow`). */
function visibleTagLabels(container: HTMLElement): string[] {
  return Array.from(
    container.querySelectorAll(
      '.bx--tag-set__space > .bx--tag:not([data-overflow="true"])',
    ),
  ).map((el) => el.textContent?.trim() ?? "");
}

describe("TagSet", () => {
  it("orders registered tags with a linear number of DOM comparisons", async () => {
    const labels = Array.from({ length: 60 }, (_, i) => `Tag ${i}`);
    const spy = vi.spyOn(Node.prototype, "compareDocumentPosition");

    const { container } = render(TagSetFixture, { labels });
    await tick();
    await tick();

    expect(visibleTagLabels(container)).toHaveLength(60);
    // Re-sorting the whole list for each registration costs ~n^2 / 2 = 1,800.
    expect(spy.mock.calls.length).toBeLessThan(labels.length * 3);
    spy.mockRestore();
  });

  it("does not read layout on mount before the tags have registered", async () => {
    const widthSpy = vi.spyOn(HTMLElement.prototype, "offsetWidth", "get");

    render(TagSetFixture);

    // Tags register in a batched microtask, so nothing is measurable yet.
    expect(widthSpy).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(widthSpy).toHaveBeenCalled();
    });
    widthSpy.mockRestore();
  });

  it("renders every tag and no overflow indicator when everything fits", () => {
    const { container } = render(TagSetFixture);

    expect(visibleTagLabels(container)).toEqual([
      "Tag 1",
      "Tag 2",
      "Tag 3",
      "Tag 4",
    ]);
    expect(
      container.querySelector(".bx--tag-set-overflow--empty"),
    ).not.toBeNull();
  });

  it("shows a +N overflow indicator once tags exceed the available width", async () => {
    const { container } = render(TagSetFixture);

    stubMeasurements(container, 110, 50);

    await waitFor(() => {
      expect(screen.getByText("+3")).toBeInTheDocument();
    });
    expect(visibleTagLabels(container)).toEqual(["Tag 1"]);
    expect(container.querySelector(".bx--tag-set-overflow--empty")).toBeNull();
  });

  it.each([
    ["a noun by default", undefined, "+3 more tags"],
    [
      "a custom overflowLabel",
      (count: number) => `${count} weitere Tags`,
      "3 weitere Tags",
    ],
  ])("names the +N indicator with %s", async (_, overflowLabel, name) => {
    const { container } = render(TagSetFixture, { overflowLabel });

    stubMeasurements(container, 110, 50);

    expect(await screen.findByRole("button", { name })).toBeInTheDocument();
  });

  it("caps a multiline set at maxVisible and collapses the rest", async () => {
    const { container } = render(TagSetFixture, {
      multiline: true,
      maxVisible: 2,
    });

    expect(await screen.findByText("+2")).toBeInTheDocument();
    expect(visibleTagLabels(container)).toEqual(["Tag 1", "Tag 2"]);
  });

  it("subtracts measurementOffset from the available width", async () => {
    const { container } = render(TagSetFixture, { measurementOffset: 100 });

    stubMeasurements(container, 210, 50);

    // 210 - 100 = 110 fits one 50px tag plus the 40px indicator.
    expect(await screen.findByText("+3")).toBeInTheDocument();
    expect(visibleTagLabels(container)).toEqual(["Tag 1"]);
  });

  it("measures containingElement instead of its own wrapper", async () => {
    const { container } = render(TagSetFixture, { measureOuter: true });

    stubMeasurements(container, 1000, 50);
    stubWidth(screen.getByTestId("outer"), 110);

    expect(await screen.findByText("+3")).toBeInTheDocument();
    expect(visibleTagLabels(container)).toEqual(["Tag 1"]);
  });

  it.each(["start", "center", "end"] as const)(
    "aligns the tag row to %s",
    (align) => {
      const { container } = render(TagSetFixture, { align });

      expect(container.querySelector(".bx--tag-set__space")).toHaveClass(
        `bx--stack-justify-${align}`,
      );
    },
  );

  it("lists a tag added mid-list in DOM order in the overflow tooltip", async () => {
    const { container, rerender } = render(TagSetFixture, {
      labels: ["Tag 1", "Tag 2", "Tag 3"],
      maxVisible: 1,
    });
    stubMeasurements(container, 1000, 50);
    await screen.findByText("+2");

    await rerender({ labels: ["Tag 1", "Tag 2", "New", "Tag 3"] });
    await user.hover(await screen.findByText("+3"));

    expect(await screen.findByText("Tag 2, New, Tag 3")).toBeInTheDocument();
  });

  it.each([
    [["A", "D", "C", "B"], "A", "D, C, B"],
    [["D", "A", "B", "C"], "D", "A, B, C"],
  ])("follows a keyed reorder to %j", async (labels, visible, hidden) => {
    const { container, rerender } = render(TagSetFixture, {
      labels: ["A", "B", "C", "D"],
      maxVisible: 1,
    });
    stubMeasurements(container, 1000, 50);
    await screen.findByText("+3");

    await rerender({ labels });
    await user.hover(screen.getByText("+3"));

    expect(await screen.findByText(hidden)).toBeInTheDocument();
    expect(visibleTagLabels(container)).toEqual([visible]);
  });

  it("shows the hidden labels as a plain-text tooltip, not more tags", async () => {
    const { container } = render(TagSetFixture);

    stubMeasurements(container, 110, 50);
    await waitFor(() => {
      expect(screen.getByText("+3")).toBeInTheDocument();
    });

    const trigger = screen.getByText("+3");
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByText("Tag 2, Tag 3, Tag 4")).toBeInTheDocument();
    });
    // No extra Tag pills rendered for the hidden labels.
    expect(
      container.querySelectorAll('[role="tooltip"] .bx--tag'),
    ).toHaveLength(0);
  });

  it("includes the closed tag's value in close:tag", async () => {
    const onTagClose = vi.fn();
    const { container } = render(TagSetFixture, {
      dismissible: true,
      values: ["t1", "t2", "t3", "t4"],
      onTagClose,
    });

    const closeButtons = within(container).getAllByRole("button", {
      name: /^Clear filter/,
    });
    expect(closeButtons).toHaveLength(4);
    await user.click(closeButtons[2]);

    expect(onTagClose).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        tag: expect.objectContaining({ label: "Tag 3", value: "t3" }),
        index: 2,
      }),
    );
  });

  it("announces a removed tag in a polite live region", async () => {
    const { container } = render(TagSetFixture, {
      dismissible: true,
      removeOnClose: true,
    });

    const liveRegion = container.querySelector("[aria-live='polite']");
    expect.assert(liveRegion instanceof HTMLElement);
    expect(liveRegion).toHaveClass("bx--visually-hidden");
    expect(liveRegion).toHaveTextContent("");

    const closeButtons = within(container).getAllByTitle("Clear filter");
    await user.click(closeButtons[0]);

    await waitFor(() => {
      expect(liveRegion).toHaveTextContent("Filter Tag 1 removed");
    });
  });

  it("does not announce a removal when the consumer keeps the tag", async () => {
    const { container } = render(TagSetFixture, { dismissible: true });

    const liveRegion = container.querySelector("[aria-live='polite']");
    expect.assert(liveRegion instanceof HTMLElement);

    const closeButtons = within(container).getAllByTitle("Clear filter");
    await user.click(closeButtons[0]);
    await tick();

    expect(liveRegion).toHaveTextContent("");
  });

  it("dispatches click:overflow when the indicator is clicked", async () => {
    const onOverflowClick = vi.fn();
    const { container } = render(TagSetFixture, { onOverflowClick });

    stubMeasurements(container, 110, 50);

    const trigger = await screen.findByText("+3");
    await user.click(trigger);

    expect(onOverflowClick).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ detail: { count: 3 } }),
    );
  });

  it("overrides the tooltip content via the overflowTooltip slot", async () => {
    const { container } = render(TagSetCustomTooltipFixture);

    stubMeasurements(container, 110, 50);
    const trigger = await screen.findByText("+3");
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByText("3 hidden")).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: "View all" })).toBeInTheDocument();
    // The default plain-text tooltip is fully replaced, not appended to.
    expect(screen.queryByText(/^Tag 2, Tag 3, Tag 4$/)).not.toBeInTheDocument();
  });

  it("dispatches overflow:change with the current overflow count when it changes", async () => {
    const onOverflowChange = vi.fn();
    const { container } = render(TagSetFixture, { onOverflowChange });
    await tick();

    // No dispatch yet: the count starts at 0 and hasn't changed.
    expect(onOverflowChange).not.toHaveBeenCalled();

    stubMeasurements(container, 110, 50);

    await waitFor(() => {
      expect(onOverflowChange).toHaveBeenCalledWith({ count: 3 });
    });
  });

  it("applies its size to slotted tags that don't set their own", () => {
    const { container } = render(TagSetFixture, { size: "lg" });

    const visibleRow = container.querySelector(".bx--tag-set__space");
    assert(visibleRow instanceof HTMLElement);
    for (const tag of within(visibleRow).getAllByText(/^Tag \d$/)) {
      expect(tag.closest(".bx--tag")).toHaveClass("bx--tag--lg");
    }
  });

  it('renders slotted tags at the default size for Carbon v11\'s "md"', () => {
    const { container } = render(TagSetFixture, { size: "md" });

    const tags = container.querySelectorAll(".bx--tag");
    expect(tags.length).toBeGreaterThan(0);
    for (const tag of tags) {
      expect(tag.className).not.toMatch(/bx--tag--(sm|lg)/);
    }
  });

  it("applies a custom gap between tags", () => {
    const { container } = render(TagSetFixture, { gap: "2rem" });

    const row = container.querySelector(".bx--tag-set__space");
    expect(row).toHaveStyle({ gap: "2rem" });
  });

  it("sizes slotted SelectableTags from the set unless they set their own", () => {
    render(TagSetSelectableFixture, { size: "sm" });

    expect(screen.getByRole("button", { name: "Tag 1" })).toHaveClass(
      "bx--tag--sm",
    );
    const own = screen.getByRole("button", { name: "Tag 3" });
    expect(own).toHaveClass("bx--tag--lg");
    expect(own).not.toHaveClass("bx--tag--sm");
  });

  it("collapses SelectableTags that no longer fit into the +N indicator", async () => {
    const { container } = render(TagSetSelectableFixture);

    stubMeasurements(container, 110, 50);

    await waitFor(() => {
      expect(screen.getByText("+3")).toBeInTheDocument();
    });
    expect(visibleTagLabels(container)).toEqual(["Tag 1"]);
  });

  describe("shared ResizeObserver", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("shares one ResizeObserver across instances", async () => {
      let created = 0;
      const Base = globalThis.ResizeObserver;
      vi.stubGlobal(
        "ResizeObserver",
        class extends Base {
          constructor(callback: ResizeObserverCallback) {
            super(callback);
            created++;
          }
        },
      );
      for (let i = 0; i < 3; i++) {
        render(TagSetFixture);
      }
      await tick();
      expect(created).toBe(1);
    });

    it("re-measures when the observer reports the wrapper resized and stops on unmount", async () => {
      let deliver: ResizeObserverCallback = () => {};
      const observed = new Set<Element>();
      vi.stubGlobal(
        "ResizeObserver",
        class {
          constructor(callback: ResizeObserverCallback) {
            deliver = callback;
          }
          observe(element: Element) {
            observed.add(element);
          }
          unobserve(element: Element) {
            observed.delete(element);
          }
          disconnect() {}
        },
      );
      const { container, unmount } = render(TagSetFixture);
      await tick();

      const wrapper = container.querySelector(".bx--tag-set");
      assert(wrapper instanceof HTMLElement);
      expect(observed.has(wrapper)).toBe(true);

      stubMeasurements(container, 110, 50);
      deliver(
        [{ target: wrapper }] as unknown as ResizeObserverEntry[],
        {} as ResizeObserver,
      );

      await waitFor(() => {
        expect(screen.getByText("+3")).toBeInTheDocument();
      });

      unmount();
      expect(observed.size).toBe(0);
    });
  });
});
