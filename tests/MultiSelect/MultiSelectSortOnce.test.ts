import { render } from "@testing-library/svelte";
import type MultiSelectComponent from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import type { ComponentProps } from "svelte";
import MultiSelect from "./MultiSelect.test.svelte";

type Item = { id: string; text: string };

/**
 * Reference re-implementation of the pre-optimization algorithm: sort each
 * partition independently, rather than partitioning a single cached sort.
 * Used to prove the two designs produce the same order, including ties.
 */
function referenceTopOrder(
  items: Item[],
  selectedIds: string[],
  sortItem: (a: Item, b: Item) => number,
) {
  const selectedIdsSet = new Set(selectedIds);
  const checked = items
    .filter((item) => selectedIdsSet.has(item.id))
    .sort(sortItem);
  const unchecked = items
    .filter((item) => !selectedIdsSet.has(item.id))
    .sort(sortItem);
  return [...checked, ...unchecked].map((item) => item.id);
}

function referenceFixedOrder(
  items: Item[],
  sortItem: (a: Item, b: Item) => number,
) {
  return [...items].sort(sortItem).map((item) => item.id);
}

describe("MultiSelect sort-once, partition-after", () => {
  it("does not call sortItem for an external selectedIds change with selectionFeedback=top", async () => {
    const calls: number[] = [];
    const sortItem: ComponentProps<MultiSelectComponent>["sortItem"] = (
      a,
      b,
    ) => {
      calls.push(1);
      return a.text.localeCompare(b.text);
    };
    const items = Array.from({ length: 20 }, (_, i) => ({
      id: String(i),
      text: `Option ${i}`,
    }));

    const { rerender } = render(MultiSelect, {
      props: { items, selectionFeedback: "top", sortItem },
    });

    calls.length = 0;
    await rerender({ selectedIds: ["5"] });
    expect(calls).toHaveLength(0);

    await rerender({ selectedIds: ["5", "12"] });
    expect(calls).toHaveLength(0);
  });

  it("matches sorting each partition independently, for shuffled input with ties", () => {
    // Duplicate `text` values create ties; a stable sort must keep `items`
    // order among them, in both the old and new designs.
    const items: Item[] = [
      { id: "0", text: "B" },
      { id: "1", text: "A" },
      { id: "2", text: "B" },
      { id: "3", text: "A" },
      { id: "4", text: "C" },
      { id: "5", text: "B" },
      { id: "6", text: "A" },
    ];
    const selectedIds = ["2", "5", "6"];
    const sortItem = (a: Item, b: Item) => a.text.localeCompare(b.text);

    const { component } = render(MultiSelect, {
      props: { items, selectedIds, selectionFeedback: "top", sortItem },
    });

    const actual = (component.sortedItems ?? [])
      .filter((entry) => !entry.isSelectAll)
      .map((entry) => entry.id);
    expect(actual).toEqual(referenceTopOrder(items, selectedIds, sortItem));
  });

  it("matches a plain independent sort for the default (non-top) partition, with ties", () => {
    const items: Item[] = [
      { id: "0", text: "B" },
      { id: "1", text: "A" },
      { id: "2", text: "B" },
      { id: "3", text: "A" },
      { id: "4", text: "C" },
    ];
    const sortItem = (a: Item, b: Item) => a.text.localeCompare(b.text);

    const { component } = render(MultiSelect, {
      props: { items, selectionFeedback: "fixed", sortItem },
    });

    const actual = (component.sortedItems ?? [])
      .filter((entry) => !entry.isSelectAll)
      .map((entry) => entry.id);
    expect(actual).toEqual(referenceFixedOrder(items, sortItem));
  });
});
