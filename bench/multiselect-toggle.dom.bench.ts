import { fireEvent, render, within } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import { task } from "ostia";
import { tick } from "svelte";

function buildItems(count: number) {
  const items = [];
  for (let i = 0; i < count; i++) {
    // Scrambled, not sequential: `Item ${i}` would already be sorted under the
    // default sortItem (numeric-aware), letting TimSort skip most comparisons.
    items.push({ id: String(i), text: `Item ${(i * 37) % count}` });
  }
  return items;
}

// Fixture built once — MultiSelect copies items internally, safe to share.
const items1000 = buildItems(1000);

// Reused across iterations so the benchmark measures MultiSelect, not the cost
// of setting up userEvent.
const user = userEvent.setup();

// Three instances coexist in jsdom; every query is scoped to the owning
// instance's container. Only one menu can be open at a time — opening one
// instance is an outside click for the others (use:dismiss closes them) —
// so each case's setup (re)opens its own menu just before registering
// instead of opening all three up front.
const instance1 = render(MultiSelect, {
  props: { items: items1000, label: "Options", labelText: "Options" },
});

const instance2 = render(MultiSelect, {
  props: {
    items: items1000,
    label: "Options",
    labelText: "Options",
    selectionFeedback: "top",
  },
});

const instance3 = render(MultiSelect, {
  props: {
    items: items1000,
    label: "Options",
    labelText: "Options",
    virtualize: false,
  },
});

const registerToggleCase = async (
  title: string,
  instance: typeof instance1,
): Promise<void> => {
  const scope = within(instance.container);
  // Guarded open: the field click handler toggles, and ostia may sample
  // this task many times — only click when the menu is closed.
  const combobox = scope.getByRole("combobox", { hidden: true });
  if (combobox.getAttribute("aria-expanded") === "false") {
    fireEvent.click(combobox);
    // The open-menu state update isn't synchronous with the click (Svelte
    // flushes on a microtask) — without this, the listbox query below runs
    // before the menu has actually opened and throws.
    await tick();
  }
  const listbox = scope.getByRole("listbox", { hidden: true });

  task(title, async () => {
    // Re-query each iteration: with selectionFeedback "top" the sorted
    // order changes per click, so "first option" is a moving target.
    const option = within(listbox).queryAllByRole("option", {
      hidden: true,
    })[0];
    await user.click(option);
  });
};

await registerToggleCase(
  "toggle option, open MultiSelect, 1000 items (virtualized)",
  instance1,
);
await registerToggleCase(
  "toggle option, open MultiSelect, 1000 items, selectionFeedback top",
  instance2,
);
await registerToggleCase(
  "toggle option, open MultiSelect, 1000 items, virtualize disabled",
  instance3,
);
