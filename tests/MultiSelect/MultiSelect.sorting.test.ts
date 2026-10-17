import { fireEvent, render, screen } from "@testing-library/svelte";
import type MultiSelectComponent from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import type { MultiSelectItem } from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import type { ComponentProps } from "svelte";
import { tick } from "svelte";
import { isSvelte5 } from "../utils/svelte-version";
import {
  buildItems,
  closeMenu,
  nthRenderedOptionText,
  openMenu,
  optionTexts,
  toggleOption,
} from "./helpers";
import MultiSelect from "./MultiSelect.test.svelte";

describe("MultiSelect", () => {
  describe("sorting behavior", () => {
    it("initially sorts items alphabetically", async () => {
      render(MultiSelect, {
        props: {
          items: [
            { id: "1", text: "C" },
            { id: "3", text: "A" },
            { id: "2", text: "B" },
          ],
        },
      });

      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("A");
      expect(nthRenderedOptionText(1)).toBe("B");
      expect(nthRenderedOptionText(2)).toBe("C");
    });

    it("moves selected items to top with selectionFeedback: top", async () => {
      render(MultiSelect, {
        props: {
          items: [
            { id: "3", text: "C" },
            { id: "1", text: "A" },
            { id: "2", text: "B" },
          ],
          selectionFeedback: "top",
        },
      });

      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("A");

      await toggleOption("C");
      expect(nthRenderedOptionText(0)).toBe("C");

      await toggleOption("C");
      expect(nthRenderedOptionText(0)).toBe("A");
    });

    it("does not double re-sort when toggling with selectionFeedback: top", async () => {
      let sortCallCount = 0;

      // Wrap sortItem to count how many comparisons occur per toggle.
      const sortItem = (a: { text: string }, b: { text: string }) => {
        sortCallCount++;
        return a.text.localeCompare(b.text);
      };

      render(MultiSelect, {
        props: {
          items: [
            { id: "1", text: "A" },
            { id: "2", text: "B" },
            { id: "3", text: "C" },
            { id: "4", text: "D" },
            { id: "5", text: "E" },
          ],
          selectionFeedback: "top",
          sortItem,
        },
      });

      await openMenu();
      sortCallCount = 0;

      // Toggle two items so both checked and unchecked partitions would be
      // sorted under a naive implementation.
      await toggleOption("C");
      await toggleOption("E");
      const callsForTwoToggles = sortCallCount;

      // A toggle never changes alphabetical order, only which partition an
      // entry belongs to, so `sort()` now partitions a cached, already-sorted
      // base order instead of re-sorting each partition. Zero comparator
      // calls (a stronger guarantee than "not doubled").
      expect(callsForTwoToggles).toBe(0);
    });

    it("re-sorts when selectedIds changes externally with selectionFeedback: top", async () => {
      const { rerender } = render(MultiSelect, {
        props: {
          items: [
            { id: "3", text: "C" },
            { id: "1", text: "A" },
            { id: "2", text: "B" },
          ],
          selectionFeedback: "top",
        },
      });

      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("A");

      // External selectedIds change should still trigger re-sort.
      await rerender({ selectedIds: ["3"] });
      await tick();

      expect(nthRenderedOptionText(0)).toBe("C");
    });

    it("sorts after reopen with selectionFeedback: top-after-reopen", async () => {
      render(MultiSelect, {
        props: {
          items: [
            { id: "3", text: "C" },
            { id: "1", text: "A" },
            { id: "2", text: "B" },
          ],
        },
      });

      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("A");

      await toggleOption("C");
      expect(nthRenderedOptionText(0)).toBe("A");

      await closeMenu();
      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("C");
    });

    it("maintains order with selectionFeedback: fixed", async () => {
      render(MultiSelect, {
        props: {
          items: [
            { id: "3", text: "C" },
            { id: "1", text: "A" },
            { id: "2", text: "B" },
          ],
          selectionFeedback: "fixed",
        },
      });

      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("A");

      await toggleOption("C");
      expect(nthRenderedOptionText(0)).toBe("A");

      await closeMenu();
      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("A");
    });

    describe("external selectedIds without re-sorting", () => {
      const unsortedItems = [
        { id: "3", text: "C" },
        { id: "1", text: "A" },
        { id: "2", text: "B" },
      ];

      const optionByText = (text: string) =>
        screen
          .getAllByRole("option")
          .find((option) => option.textContent?.trim() === text);

      it("checks externally selected items in place with selectionFeedback: fixed", async () => {
        const { rerender } = render(MultiSelect, {
          props: { items: unsortedItems, selectionFeedback: "fixed" },
        });

        await rerender({ selectedIds: ["2"] });
        await openMenu();

        expect(nthRenderedOptionText(0)).toBe("A");
        expect(nthRenderedOptionText(1)).toBe("B");
        expect(nthRenderedOptionText(2)).toBe("C");
        expect(optionByText("A")).toHaveAttribute("aria-selected", "false");
        expect(optionByText("B")).toHaveAttribute("aria-selected", "true");
        expect(optionByText("C")).toHaveAttribute("aria-selected", "false");
      });

      it("keeps an external selection when the user then toggles another item", async () => {
        const consoleLog = vi.spyOn(console, "log");
        const { rerender } = render(MultiSelect, {
          props: { items: unsortedItems, selectionFeedback: "fixed" },
        });

        await rerender({ selectedIds: ["2"] });
        await openMenu();
        await toggleOption("C");

        const selectCalls = consoleLog.mock.calls.filter(
          ([name]) => name === "select",
        );
        const selectedIds = selectCalls.at(-1)?.[1]?.selectedIds;
        expect(selectedIds).toHaveLength(2);
        expect(selectedIds).toEqual(expect.arrayContaining(["2", "3"]));
      });

      it("checks externally selected items while open with top-after-reopen, reordering on reopen", async () => {
        const { rerender } = render(MultiSelect, {
          props: { items: unsortedItems },
        });

        await openMenu();
        await rerender({ selectedIds: ["3"] });

        expect(nthRenderedOptionText(2)).toBe("C");
        expect(optionByText("C")).toHaveAttribute("aria-selected", "true");

        await closeMenu();
        await openMenu();
        expect(nthRenderedOptionText(0)).toBe("C");
      });

      it("syncs the select-all item with selectionFeedback: fixed", async () => {
        const { rerender } = render(MultiSelect, {
          props: {
            items: [
              { id: "all", text: "All", isSelectAll: true },
              ...unsortedItems,
            ],
            selectionFeedback: "fixed",
          },
        });

        await rerender({ selectedIds: ["1", "2", "3"] });
        await openMenu();
        expect(optionByText("All")).toHaveAttribute("aria-checked", "true");

        await rerender({ selectedIds: ["1"] });
        expect(optionByText("All")).toHaveAttribute("aria-checked", "mixed");
      });
    });

    it("recomputes sortedItems when the items prop changes", async () => {
      const { rerender } = render(MultiSelect, {
        props: {
          items: [
            { id: "1", text: "A" },
            { id: "2", text: "B" },
          ],
        },
      });

      await openMenu();
      expect(screen.getAllByRole("option")).toHaveLength(2);
      expect(nthRenderedOptionText(0)).toBe("A");
      expect(nthRenderedOptionText(1)).toBe("B");

      await rerender({
        items: [
          { id: "1", text: "A" },
          { id: "2", text: "B" },
          { id: "3", text: "C" },
        ],
      });
      await tick();

      expect(screen.getAllByRole("option")).toHaveLength(3);
      expect(nthRenderedOptionText(2)).toBe("C");

      await rerender({
        items: [
          { id: "1", text: "Alpha" },
          { id: "2", text: "B" },
          { id: "3", text: "C" },
        ],
      });
      await tick();

      expect(nthRenderedOptionText(0)).toBe("Alpha");
    });

    it("sorts numeric-aware by default (Item 2 before Item 10)", async () => {
      render(MultiSelect, {
        props: {
          items: [
            { id: "0", text: "Item 10" },
            { id: "1", text: "Item 2" },
            { id: "2", text: "Item 1" },
          ],
        },
      });

      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("Item 1");
      expect(nthRenderedOptionText(1)).toBe("Item 2");
      expect(nthRenderedOptionText(2)).toBe("Item 10");
    });

    it("exposes sortedItems via bind", async () => {
      const { component } = render(MultiSelect, {
        props: {
          items: [
            { id: "3", text: "C" },
            { id: "1", text: "A" },
            { id: "2", text: "B" },
          ],
          selectionFeedback: "top",
        },
      });

      await tick();
      expect(component.sortedItems?.map((item) => item.id)).toEqual([
        "1",
        "2",
        "3",
      ]);
      expect(component.sortedItems?.every((item) => !item.checked)).toBe(true);

      await openMenu();
      await toggleOption("C");
      await tick();

      expect(component.sortedItems?.map((item) => item.id)).toEqual([
        "3",
        "1",
        "2",
      ]);
      expect(
        component.sortedItems?.find((item) => item.id === "3")?.checked,
      ).toBe(true);
    });
  });
});

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

type SortItem = Exclude<
  ComponentProps<MultiSelectComponent>["sortItem"],
  undefined
>;

describe("MultiSelect sortItem opt-out", () => {
  // Deliberately not alphabetical, so "unchanged" is distinguishable from
  // "sorted".
  const items: MultiSelectItem[] = [
    { id: "2", text: "Zebra" },
    { id: "0", text: "Apple" },
    { id: "1", text: "Mango" },
  ];

  const optOutForms: [string, SortItem][] = [
    ["false", false],
    ["a no-op function", () => {}],
  ];

  it.each(optOutForms)("keeps items order with %s", (_label, sortItem) => {
    render(MultiSelect, {
      props: { items, sortItem, open: true },
    });
    expect(optionTexts()).toEqual(["Zebra", "Apple", "Mango"]);
  });

  it.each(optOutForms)(
    "moves the checked item first, then the rest in items order, with selectionFeedback=top (%s)",
    (_label, sortItem) => {
      const { component } = render(MultiSelect, {
        props: {
          items,
          selectedIds: ["1"],
          selectionFeedback: "top",
          sortItem,
        },
      });

      expect(
        (component.sortedItems ?? [])
          .filter((entry) => !entry.isSelectAll)
          .map((entry) => entry.id),
      ).toEqual(["1", "2", "0"]);
    },
  );

  it("bind:sortedItems matches the rendered option order", () => {
    const { component } = render(MultiSelect, {
      props: { items, sortItem: false, open: true },
    });

    const bound = (component.sortedItems ?? [])
      .filter((entry) => !entry.isSelectAll)
      .map((entry) => entry.text);
    expect(bound).toEqual(optionTexts());
    expect(bound).toEqual(["Zebra", "Apple", "Mango"]);
  });
});

describe("MultiSelect new-but-equal items", () => {
  const buildItems = (): MultiSelectItem[] => [
    { id: "3", text: "C" },
    { id: "1", text: "A" },
    { id: "2", text: "B" },
  ];

  const createSortItem = () =>
    vi.fn((a: MultiSelectItem, b: MultiSelectItem) =>
      a.text.localeCompare(b.text),
    );

  it("does not re-sort for equal items, and re-sorts for different ones", async () => {
    const sortItem = createSortItem();
    const { rerender } = render(MultiSelect, {
      props: { items: buildItems(), sortItem, open: true },
    });
    expect(optionTexts()).toEqual(["A", "B", "C"]);

    sortItem.mockClear();
    const options = screen.getAllByRole("option");
    await rerender({ items: buildItems() });
    await rerender({ items: buildItems() });
    expect(sortItem).not.toHaveBeenCalled();
    expect(screen.getAllByRole("option")).toEqual(options);

    await rerender({ items: [...buildItems(), { id: "0", text: "Aa" }] });
    expect(sortItem).toHaveBeenCalled();
    expect(optionTexts()).toEqual(["A", "Aa", "B", "C"]);
  });

  it("re-sorts when an item is mutated in place and the array is copied", async () => {
    const sortItem = createSortItem();
    const items = buildItems();
    const { rerender } = render(MultiSelect, {
      props: { items, sortItem, open: true },
    });

    sortItem.mockClear();
    items[0].text = "0";
    await rerender({ items: [...items] });
    expect(sortItem).toHaveBeenCalled();
    expect(optionTexts()).toEqual(["0", "A", "B"]);
  });

  it("re-sorts when a field compared by identity changes", async () => {
    const sortItem = createSortItem();
    const withFormat = (format: () => string) =>
      buildItems().map((item) => ({ ...item, format }));
    const formatA = () => "a";
    const { rerender } = render(MultiSelect, {
      props: { items: withFormat(formatA), sortItem, open: true },
    });

    sortItem.mockClear();
    await rerender({ items: withFormat(formatA) });
    expect(sortItem).not.toHaveBeenCalled();

    await rerender({ items: withFormat(() => "a") });
    expect(sortItem).toHaveBeenCalled();
  });

  it("re-sorts equal items when selectedIds changed with them", async () => {
    const { rerender } = render(MultiSelect, {
      props: { items: buildItems(), open: true },
    });
    expect(screen.getByRole("option", { name: "C" })).toHaveAttribute(
      "aria-selected",
      "false",
    );

    await rerender({ items: buildItems(), selectedIds: ["3"] });
    expect(screen.getByRole("option", { name: "C" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});

describe("MultiSelect skips re-sorting for a new-but-equal selectedIds, selectionFeedback: top", () => {
  it("does not rebuild sortedItems when selectedIds is a new-but-equal array", async () => {
    const { component, rerender } = render(MultiSelect, {
      props: {
        items: buildItems(),
        selectedIds: ["1", "2"],
        selectionFeedback: "top",
      },
    });

    const before = component.sortedItems;
    await rerender({ selectedIds: ["1", "2"] });
    expect(component.sortedItems).toBe(before);

    await rerender({ selectedIds: ["3"] });
    expect(component.sortedItems).not.toBe(before);
    expect(component.sortedItems?.[0].id).toBe("3");
  });

  it("treats the same ids in a different order as equal", async () => {
    const { component, rerender } = render(MultiSelect, {
      props: {
        items: buildItems(),
        selectedIds: ["1", "2"],
        selectionFeedback: "top",
      },
    });

    const before = component.sortedItems;
    await rerender({ selectedIds: ["2", "1"] });
    expect(component.sortedItems).toBe(before);
  });

  it("re-sorts when duplicate ids keep the length but change the selection", async () => {
    const { component, rerender } = render(MultiSelect, {
      props: {
        items: buildItems(),
        selectedIds: ["1", "2"],
        selectionFeedback: "top",
      },
    });

    await rerender({ selectedIds: ["1", "1"] });
    expect(
      component.sortedItems?.filter((entry) => entry.checked).map((e) => e.id),
    ).toEqual(["1"]);
  });

  it("re-sorts when the array previously passed as selectedIds is mutated in place and a copy is passed", async () => {
    // `prevSelectedIds` must snapshot the prop, not alias it: if it aliased
    // `ids`, mutating `ids` in place would mutate `prevSelectedIds` too, and
    // the value-compare below would wrongly say "equal".
    const ids = ["1"];
    const { component, rerender } = render(MultiSelect, {
      props: {
        items: buildItems(),
        selectedIds: ids,
        selectionFeedback: "top",
      },
    });

    const before = component.sortedItems;
    ids.push("3");
    await rerender({ selectedIds: [...ids] });

    expect(component.sortedItems).not.toBe(before);
    expect(
      component.sortedItems?.filter((entry) => entry.checked).map((e) => e.id),
    ).toEqual(expect.arrayContaining(["1", "3"]));
  });
});

function observeMutations(target: Node) {
  const records: MutationRecord[] = [];
  const observer = new MutationObserver((entries) => records.push(...entries));
  observer.observe(target, {
    subtree: true,
    attributes: true,
    characterData: true,
    childList: true,
  });
  return {
    disconnect: () => observer.disconnect(),
    targets: () => new Set(records.map((record) => record.target)),
  };
}

const findOption = async (text: string) => {
  const el = await screen.findByText((content) => content.trim() === text);
  const option = el.closest('[role="option"]');
  assert(option instanceof HTMLElement);
  return option;
};

describe("MultiSelect sortedItems entry reuse", () => {
  it("leaves other options' DOM untouched when toggling one, with selectionFeedback=top", async () => {
    const { container } = render(MultiSelect, {
      props: { items: buildItems(), open: true, selectionFeedback: "top" },
    });

    const optionsBefore = new Set(screen.getAllByRole("option"));
    const fax = await findOption("Fax");
    const others = [...optionsBefore].filter((option) => option !== fax);

    const mo = observeMutations(container);
    await fireEvent.click(fax);
    mo.disconnect();

    // Svelte 3/4's compiled each-block update writes every attribute
    // expression for a block whenever it re-runs, even when the computed
    // value is unchanged (Svelte 5 skips the DOM write in that case), so
    // "zero mutations on an untouched option" only holds under Svelte 5.
    // Element identity (no destroy/recreate) is a version-agnostic
    // invariant that still catches an unkeyed-reuse regression.
    if (isSvelte5) {
      const touched = mo.targets();
      for (const other of others) {
        expect(touched.has(other)).toBe(false);
        for (const descendant of other.querySelectorAll("*")) {
          expect(touched.has(descendant)).toBe(false);
        }
      }
    }
    for (const other of others) {
      expect(optionsBefore.has(other)).toBe(true);
    }
    expect(new Set(screen.getAllByRole("option"))).toEqual(optionsBefore);

    // Toggled item moves to the top of the (still-checked-first) order.
    expect(screen.getAllByRole("option")[0].textContent?.trim()).toBe("Fax");
  });

  it("with selectionFeedback=fixed, toggling one option mutates only that option", async () => {
    const { container } = render(MultiSelect, {
      props: { items: buildItems(), open: true, selectionFeedback: "fixed" },
    });

    const optionTextsBefore = screen
      .getAllByRole("option")
      .map((el) => el.textContent?.trim());
    const optionsBefore = new Set(screen.getAllByRole("option"));
    const fax = await findOption("Fax");
    const others = [...optionsBefore].filter((option) => option !== fax);

    const mo = observeMutations(container);
    await fireEvent.click(fax);
    mo.disconnect();

    // See the "top" test above for why this check is Svelte-5-only.
    if (isSvelte5) {
      const touched = mo.targets();
      for (const other of others) {
        expect(touched.has(other)).toBe(false);
        for (const descendant of other.querySelectorAll("*")) {
          expect(touched.has(descendant)).toBe(false);
        }
      }
    }
    expect(new Set(screen.getAllByRole("option"))).toEqual(optionsBefore);

    // Order is unchanged for `fixed`.
    expect(
      screen.getAllByRole("option").map((el) => el.textContent?.trim()),
    ).toEqual(optionTextsBefore);
  });

  it("reuses sortedItems entries for ids unaffected by a selectedIds change", async () => {
    const { component, rerender } = render(MultiSelect, {
      props: {
        items: buildItems(),
        selectedIds: ["0"],
        selectionFeedback: "top",
      },
    });

    const before = new Map(
      (component.sortedItems ?? []).map((entry) => [entry.id, entry]),
    );

    await rerender({ selectedIds: ["1"] });

    const after = component.sortedItems ?? [];
    const reused = after.filter((entry) => before.get(entry.id) === entry);
    const changed = after.filter((entry) => before.get(entry.id) !== entry);

    // Only the previously-checked ("0") and newly-checked ("1") entries
    // should be rebuilt; everything else keeps its object identity.
    expect(reused.length).toBe(after.length - 2);
    expect(new Set(changed.map((entry) => entry.id))).toEqual(
      new Set(["0", "1"]),
    );
  });

  it("re-sorts the mutated entry when an item is mutated in place and the array is copied", async () => {
    const items = buildItems();
    const { component, rerender } = render(MultiSelect, {
      props: { items, selectionFeedback: "top" },
    });

    const before = new Map(
      (component.sortedItems ?? []).map((entry) => [entry.id, entry]),
    );

    items[2].text = "Facsimile";
    await rerender({ items: [...items] });

    const after = component.sortedItems ?? [];
    const mutated = after.find((entry) => entry.id === "2");
    expect(mutated?.text).toBe("Facsimile");
    // The mutated entry must be rebuilt, not stale-reused from `before`.
    expect(before.get("2")).not.toBe(mutated);

    // Every other entry keeps its identity.
    const others = after.filter((entry) => entry.id !== "2");
    for (const entry of others) {
      expect(before.get(entry.id)).toBe(entry);
    }
  });

  it("handles duplicate item ids without mismatching reused entries", async () => {
    // `selectedIds` stays empty throughout: MultiSelect's native-form each
    // block (`{#each formItems as item (item.id)}`) already rejects two
    // simultaneously-*checked* items sharing an id (Svelte's own keyed-each
    // duplicate-key constraint, unrelated to this fix), so this only
    // exercises the reuse `Map`'s duplicate-id bucketing at the data level.
    const items = [
      { id: "dup", text: "First" },
      { id: "dup", text: "Second" },
      { id: "extra", text: "Extra" },
    ];
    const { component, rerender } = render(MultiSelect, {
      props: {
        items,
        selectedIds: [],
        selectionFeedback: "fixed",
        sortItem: () => 0,
      },
    });

    const before = component.sortedItems ?? [];
    expect(before.map((entry) => entry.text)).toEqual([
      "First",
      "Second",
      "Extra",
    ]);

    // A genuine `items` change (dropping "Extra") forces `sort()` to rebuild
    // via the reuse map. The two same-id entries must not cross-wire: each
    // keeps its own text and object identity.
    await rerender({ items: [items[0], items[1]] });
    const after = component.sortedItems ?? [];
    expect(after.map((entry) => entry.text)).toEqual(["First", "Second"]);
    expect(after[0]).toBe(before[0]);
    expect(after[1]).toBe(before[1]);
  });
});
