import { fireEvent, render } from "@testing-library/svelte";
import { task } from "ostia";
import { tick } from "svelte";
import DataTableFilterBench from "./fixtures/DataTableFilterBench.svelte";

// DataTable filterMode benchmark: compare "hide" vs "remove" strategies per
// search keystroke on a 1000-row table. Instances are rendered ONCE and
// persist for the whole file's run — the timed closure fires only the input
// event. (Rendering inside the closure would bury the keystroke under ~1s of
// mount/unmount cost and make the two modes indistinguishable.)
// Alternating "row 7"/"row 8" swaps between two ~111-row disjoint match sets,
// so every iteration does steady, genuine filter work.

function buildRows(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i),
    name: `row ${i} - Load Balancer`,
    protocol: "HTTP",
    port: 3000 + i,
    rule: "Round robin",
  }));
}

const removeInstance = render(DataTableFilterBench, {
  props: { rows: buildRows(1000), filterMode: "remove" },
});
const hideInstance = render(DataTableFilterBench, {
  props: { rows: buildRows(1000), filterMode: "hide" },
});

const getInput = (instance: typeof removeInstance) => {
  const input = instance.container.querySelector("input");
  if (!input) throw new Error("search input not found");
  return input;
};

// Sanity check both modes actually filter before measuring.
const removeInput = getInput(removeInstance);
await fireEvent.input(removeInput, { target: { value: "row 7" } });
await tick();
const removeVisible =
  removeInstance.container.querySelectorAll("tbody tr").length;
const hideInput = getInput(hideInstance);
await fireEvent.input(hideInput, { target: { value: "row 7" } });
await tick();
const hideMounted = hideInstance.container.querySelectorAll("tbody tr").length;
const hideVisible = hideInstance.container.querySelectorAll(
  "tbody tr:not([hidden])",
).length;
process.stdout.write(
  `sanity: remove mounted=${removeVisible} hide mounted=${hideMounted} hide visible=${hideVisible}\n`,
);

const registerKeystrokeCase = (
  title: string,
  input: HTMLInputElement,
): void => {
  let n = 0;
  task(title, async () => {
    const value = n++ % 2 === 0 ? "row 8" : "row 7";
    await fireEvent.input(input, { target: { value } });
    await tick();
  });
};

registerKeystrokeCase(
  "filter keystroke, DataTable 1000 rows, filterMode remove",
  removeInput,
);
registerKeystrokeCase(
  "filter keystroke, DataTable 1000 rows, filterMode hide",
  hideInput,
);
