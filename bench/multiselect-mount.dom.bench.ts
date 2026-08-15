import { cleanup, render } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import { bench, run } from "mitata";

function buildItems(count: number) {
  const items = [];
  for (let i = 0; i < count; i++) {
    // Scrambled, not sequential: `Item ${i}` would already be sorted under the
    // default sortItem (numeric-aware), letting TimSort skip most comparisons
    // and hiding the mount-time sort cost this bench should include.
    items.push({ id: String(i), text: `Item ${(i * 37) % count}` });
  }
  return items;
}

// Fixtures built once — MultiSelect copies items internally (sort() maps to
// new objects), so sharing them across iterations is safe.
const items100 = buildItems(100);
const items1000 = buildItems(1000);

// Reused across iterations so the benchmark measures MultiSelect, not the cost
// of setting up userEvent.
const user = userEvent.setup();

it("benchmarks mounting MultiSelect with various item counts and virtualization modes", async () => {
  // 100 items is at the auto-virtualization cutoff (virtualize kicks in above
  // 100), so this mounts every menu item — the closed menu is display:none
  // gated but still rendered.
  bench("mount MultiSelect, 100 items", () => {
    render(MultiSelect, {
      props: { items: items100, label: "Options", labelText: "Options" },
    });
    cleanup();
  });

  bench("mount MultiSelect, 1000 items (virtualized default)", () => {
    render(MultiSelect, {
      props: { items: items1000, label: "Options", labelText: "Options" },
    });
    cleanup();
  });

  bench("mount MultiSelect, 1000 items, virtualize disabled", () => {
    render(MultiSelect, {
      props: {
        items: items1000,
        label: "Options",
        labelText: "Options",
        virtualize: false,
      },
    });
    cleanup();
  });

  bench("mount + open MultiSelect, 1000 items", async () => {
    const { getByRole } = render(MultiSelect, {
      props: { items: items1000, label: "Options", labelText: "Options" },
    });

    await user.click(getByRole("combobox"));

    cleanup();
  });

  // mitata defaults `print` to console.log, which vitest swallows for
  // passing tests. process.stdout.write always reaches the terminal.
  await run({ print: (line) => process.stdout.write(`${line}\n`) });
}, 120_000);
