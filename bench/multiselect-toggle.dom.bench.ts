import { cleanup, fireEvent, render, within } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import { bench, run } from "mitata";

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

it("benchmarks toggling a selection in an open MultiSelect menu", async () => {
  // Three instances coexist in jsdom; every query is scoped to the owning
  // instance's container. Only one menu can be open at a time — opening one
  // instance is an outside click for the others (use:dismiss closes them) —
  // so each case's generator setup (re)opens its own menu just before
  // sampling instead of opening all three up front.
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

  const registerToggleCase = (
    title: string,
    instance: typeof instance1,
  ): void => {
    bench(title, function* () {
      const scope = within(instance.container);
      // Guarded open: the field click handler toggles, and mitata may invoke
      // this setup more than once — only click when the menu is closed.
      const combobox = scope.getByRole("combobox", { hidden: true });
      if (combobox.getAttribute("aria-expanded") === "false") {
        fireEvent.click(combobox);
      }
      const listbox = scope.getByRole("listbox", { hidden: true });
      yield async () => {
        // Re-query each iteration: with selectionFeedback "top" the sorted
        // order changes per click, so "first option" is a moving target.
        const option = within(listbox).queryAllByRole("option", {
          hidden: true,
        })[0];
        await user.click(option);
      };
    });
  };

  registerToggleCase(
    "toggle option, open MultiSelect, 1000 items (virtualized)",
    instance1,
  );
  registerToggleCase(
    "toggle option, open MultiSelect, 1000 items, selectionFeedback top",
    instance2,
  );
  registerToggleCase(
    "toggle option, open MultiSelect, 1000 items, virtualize disabled",
    instance3,
  );

  // mitata defaults `print` to console.log, which vitest swallows for
  // passing tests. process.stdout.write always reaches the terminal.
  await run({ print: (line) => process.stdout.write(`${line}\n`) });

  // cleanup() once at the end, NOT inside the bench closures — the instances
  // must persist across all iterations.
  cleanup();
}, 180_000);
