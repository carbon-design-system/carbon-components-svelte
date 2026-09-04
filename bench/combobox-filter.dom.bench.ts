import { fireEvent, render } from "@testing-library/svelte";
import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import { task } from "ostia";
import { tick } from "svelte";

// ComboBox filterMode benchmark: compare "hide" vs "remove" per keystroke on
// a 100-item menu (at the auto-virtualization cutoff, so every option is
// mounted when the menu opens). Instances are rendered ONCE and persist
// for the whole file's run — the timed closure fires only the input event,
// matching datatable-filter.dom.bench.ts. Alternating "Item 7"/"Item 8"
// swaps two disjoint-ish match sets so every iteration does genuine filter
// work.
//
// Default is "remove": at this size, remounting ~11 matches is cheaper than
// updating `hidden` on all 100 option nodes.

function buildItems(count: number) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({ id: String(i), text: `Item ${(i * 37) % count}` });
  }
  return items;
}

const items100 = buildItems(100);

const shouldFilterItem = (item: { text: string }, value: string): boolean =>
  item.text.toLowerCase().includes(value.toLowerCase());

const hideInstance = render(ComboBox, {
  props: {
    items: items100,
    placeholder: "Options",
    open: true,
    virtualize: false,
    filterMode: "hide",
    shouldFilterItem,
  },
});
const removeInstance = render(ComboBox, {
  props: {
    items: items100,
    placeholder: "Options",
    open: true,
    virtualize: false,
    filterMode: "remove",
    shouldFilterItem,
  },
});

const getInput = (instance: typeof hideInstance) => {
  const input = instance.container.querySelector("input");
  if (!input) throw new Error("combobox input not found");
  return input;
};

const hideInput = getInput(hideInstance);
await fireEvent.input(hideInput, { target: { value: "Item 7" } });
await tick();
const hideMounted =
  hideInstance.container.querySelectorAll('[role="option"]').length;
const hideVisible = hideInstance.container.querySelectorAll(
  '[role="option"]:not([hidden])',
).length;
const removeInput = getInput(removeInstance);
await fireEvent.input(removeInput, { target: { value: "Item 7" } });
await tick();
const removeMounted =
  removeInstance.container.querySelectorAll('[role="option"]').length;
process.stdout.write(
  `sanity: hide mounted=${hideMounted} hide visible=${hideVisible} remove mounted=${removeMounted}\n`,
);

const registerKeystrokeCase = (
  title: string,
  input: HTMLInputElement,
): void => {
  let n = 0;
  task(title, async () => {
    const value = n++ % 2 === 0 ? "Item 8" : "Item 7";
    await fireEvent.input(input, { target: { value } });
    await tick();
  });
};

registerKeystrokeCase(
  "filter keystroke, ComboBox 100 items, filterMode hide",
  hideInput,
);
registerKeystrokeCase(
  "filter keystroke, ComboBox 100 items, filterMode remove",
  removeInput,
);
