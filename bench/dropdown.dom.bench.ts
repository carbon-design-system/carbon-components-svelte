import { cleanup, render } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
import { bench, run } from "mitata";

const items = [
  { id: "0", text: "Slack" },
  { id: "1", text: "Email" },
  { id: "2", text: "Fax" },
];

// Reused across iterations so the benchmark measures Dropdown, not the cost
// of setting up userEvent.
const user = userEvent.setup();

it("benchmarks opening a Dropdown menu", async () => {
  bench("mount + open Dropdown menu", async () => {
    const { getByRole } = render(Dropdown, {
      props: { items, selectedId: "0", labelText: "Contact" },
    });

    await user.click(getByRole("combobox"));

    // Unmount so DOM nodes don't pile up across thousands of iterations.
    cleanup();
  });

  // mitata defaults `print` to console.log, which vitest swallows for
  // passing tests. process.stdout.write always reaches the terminal.
  // (mitata also mislabels `runtime` as "chromium" here, since jsdom's
  // window/navigator globals look like a browser to its feature sniff —
  // the timings themselves still use bun's real nanosecond clock.)
  await run({ print: (line) => process.stdout.write(`${line}\n`) });
}, 60_000);
