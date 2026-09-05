import { fireEvent, render, within } from "@testing-library/svelte";
import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
import { task } from "ostia";

function buildItems(count: number) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({ id: String(i), text: `Item ${(i * 37) % count}` });
  }
  return items;
}

const items1000 = buildItems(1000);

// Both instances persist for the whole file's run (ostia's suite files
// register every task up front; there's no per-task teardown hook the way
// mitata's run() drove one generator to completion before the next
// started). Queries are scoped via `within(instance.container)` instead of
// the instance-global `getByRole` mitata's version used, since that would
// otherwise be ambiguous with two Dropdowns in the same document.
const notVirtualized = render(Dropdown, {
  props: {
    items: items1000,
    selectedId: "0",
    labelText: "Contact",
    virtualize: false,
    open: true,
  },
});
const notVirtualizedCombobox = within(notVirtualized.container).getByRole(
  "combobox",
);

const virtualized = render(Dropdown, {
  props: {
    items: items1000,
    selectedId: "0",
    labelText: "Contact",
    open: true,
  },
});
const virtualizedCombobox = within(virtualized.container).getByRole("combobox");

task("ArrowDown highlight, Dropdown 1000 items (not virtualized)", () => {
  fireEvent.keyDown(notVirtualizedCombobox, { key: "ArrowDown" });
});

task("ArrowDown highlight, Dropdown 1000 items (virtualized)", () => {
  fireEvent.keyDown(virtualizedCombobox, { key: "ArrowDown" });
});
