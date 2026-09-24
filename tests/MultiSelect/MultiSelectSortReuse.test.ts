import { fireEvent, render, screen } from "@testing-library/svelte";
import { isSvelte5 } from "../utils/svelte-version";
import { buildItems } from "./helpers";
import MultiSelect from "./MultiSelect.test.svelte";

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
