import { render, within } from "@testing-library/svelte";
import { task } from "ostia";
import { tick } from "svelte";
import DatePickerBench from "./fixtures/DatePickerBench.svelte";

// Inline calendars, so the grid is built up front and every task measures a
// pick or a page on a calendar that already exists. Each instance persists
// for the whole run; queries are scoped to its own container.
const single = render(DatePickerBench, { props: { datePickerType: "single" } });
const range = render(DatePickerBench, {
  props: { datePickerType: "range", months: 2 },
});
await tick();

/**
 * The current month's days in an instance, in order. A class query, not
 * `getAllByRole`: role queries walk the whole tree and would outweigh the
 * pick being measured.
 */
function days(container: HTMLElement) {
  return container.querySelectorAll<HTMLElement>(
    ".bx--date-picker__day:not(.bx--date-picker__day--outside-month)",
  );
}

let singleIndex = 0;
task("pick a day, inline single", async () => {
  // Alternate between two days so every pick changes the selection.
  days(single.container)[(singleIndex++ % 2) * 7 + 3].click();
  await tick();
});

let rangeIndex = 0;
task("pick a range end, inline range, two months", async () => {
  // Start, end, start, end: each click is a real range change.
  days(range.container)[rangeIndex++ % 2 === 0 ? 3 : 12].click();
  await tick();
});

const next = within(single.container).getByRole("button", {
  name: "Next month",
});
task("show the next month, inline single", async () => {
  next.click();
  await tick();
});
