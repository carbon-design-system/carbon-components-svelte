import { render } from "@testing-library/svelte";
import type MultiSelectComponent from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import type { MultiSelectItem } from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import type { ComponentProps } from "svelte";
import { optionTexts } from "./helpers";
import MultiSelect from "./MultiSelect.test.svelte";

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
