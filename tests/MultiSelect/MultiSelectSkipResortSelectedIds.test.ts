import { render } from "@testing-library/svelte";
import MultiSelect from "./MultiSelect.test.svelte";

function buildItems() {
  return [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
    { id: "3", text: "Phone" },
    { id: "4", text: "Mail" },
  ];
}

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
