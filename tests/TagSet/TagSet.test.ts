import { render, screen, waitFor, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import TagSetCustomTooltipFixture from "./TagSet.customTooltip.test.svelte";
import TagSetFixture from "./TagSet.test.svelte";

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
  expect.assert(wrapper instanceof HTMLElement);
  stubWidth(wrapper, availableWidth);

  const tags = Array.from(
    container.querySelectorAll(".bx--tag-set__space > .bx--tag"),
  );
  for (const el of tags) stubWidth(el, tagWidth);

  const trigger = container.querySelector(
    ".bx--tag-set-overflow__popover-trigger",
  );
  expect.assert(trigger instanceof HTMLElement);
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

  it("dispatches close:tag with the tag and its index", async () => {
    const onTagClose = vi.fn();
    const { container } = render(TagSetFixture, {
      dismissible: true,
      onTagClose,
    });

    const closeButtons = within(container).getAllByTitle("Clear filter");
    expect(closeButtons).toHaveLength(4);
    await user.click(closeButtons[1]);

    expect(onTagClose).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        tag: expect.objectContaining({ label: "Tag 2" }),
        index: 1,
      }),
    );
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
    expect.assert(visibleRow instanceof HTMLElement);
    for (const tag of within(visibleRow).getAllByText(/^Tag \d$/)) {
      expect(tag.closest(".bx--tag")).toHaveClass("bx--tag--lg");
    }
  });

  it("applies a custom gap between tags", () => {
    const { container } = render(TagSetFixture, { gap: "2rem" });

    const row = container.querySelector(".bx--tag-set__space");
    expect(row).toHaveStyle({ gap: "2rem" });
  });
});
