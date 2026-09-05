import { cleanup, render } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
import { task } from "ostia";

const items = [
  { id: "0", text: "Slack" },
  { id: "1", text: "Email" },
  { id: "2", text: "Fax" },
];

// Reused across iterations so the benchmark measures Dropdown, not the cost
// of setting up userEvent.
const user = userEvent.setup();

task("mount + open Dropdown menu", async () => {
  const { getByRole } = render(Dropdown, {
    props: { items, selectedId: "0", labelText: "Contact" },
  });

  await user.click(getByRole("combobox"));

  // Unmount so DOM nodes don't pile up across thousands of iterations.
  cleanup();
});
