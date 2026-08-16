import { cleanup, render } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import { bench, run } from "mitata";

// Mirrors multiselect-mount.dom.bench.ts: ComboBox shares the same
// `virtualize.js` util (already proven O(1) in item count at the pure-logic
// tier, see virtualize.bench.ts) and the same auto-virtualization threshold
// (100 items). This checks whether the real component's mount/open cost
// actually gets the same payoff MultiSelect's did, since ComboBox has never
// been benched at the component tier — only its filtering (structurally
// identical to fuzzyMatch, already covered).
//
// Unlike MultiSelect/Dropdown (menu items mount up front behind
// display:none), ComboBox gates its whole item list behind `{#if open}`
// (ComboBox.svelte:883) — same as OverflowMenu (see
// bench/fixtures/OverflowMenuBench.svelte's comment). A closed ComboBox
// never mounts item nodes regardless of item count, so cases below open the
// menu (either as part of the timed closure, or via `open: true` from the
// start) instead of measuring a closed mount.
function buildItems(count: number) {
  const items = [];
  for (let i = 0; i < count; i++) {
    // Scrambled, not sequential — see multiselect-mount.dom.bench.ts's
    // comment. ComboBox's default filter is a plain substring match (no
    // sort), but scrambling keeps this fixture consistent with its sibling
    // and avoids accidentally-ordered data masking any future finding.
    items.push({ id: String(i), text: `Item ${(i * 37) % count}` });
  }
  return items;
}

const items100 = buildItems(100);
const items1000 = buildItems(1000);

// Reused across iterations so the benchmark measures ComboBox, not the cost
// of setting up userEvent.
const user = userEvent.setup();

it("benchmarks mounting an open ComboBox with various item counts and virtualization modes", async () => {
  // 100 items is at the auto-virtualization cutoff (virtualize kicks in
  // above 100), so this mounts every menu item.
  bench("mount open ComboBox, 100 items", () => {
    render(ComboBox, {
      props: { items: items100, placeholder: "Options", open: true },
    });
    cleanup();
  });

  bench("mount open ComboBox, 1000 items (virtualized default)", () => {
    render(ComboBox, {
      props: { items: items1000, placeholder: "Options", open: true },
    });
    cleanup();
  });

  bench("mount open ComboBox, 1000 items, virtualize disabled", () => {
    render(ComboBox, {
      props: {
        items: items1000,
        placeholder: "Options",
        open: true,
        virtualize: false,
      },
    });
    cleanup();
  });

  bench("mount + click-open ComboBox, 1000 items", async () => {
    const { getByRole } = render(ComboBox, {
      props: { items: items1000, placeholder: "Options" },
    });

    await user.click(getByRole("combobox"));

    cleanup();
  });

  // mitata defaults `print` to console.log, which vitest swallows for
  // passing tests. process.stdout.write always reaches the terminal.
  await run({ print: (line) => process.stdout.write(`${line}\n`) });
}, 120_000);
