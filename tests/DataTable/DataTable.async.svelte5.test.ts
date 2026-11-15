import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import DataTableRowRemoved from "./DataTableRowRemoved.async.svelte5.test.svelte";
import DataTableRowsReplacedSilently from "./DataTableRowsReplacedSilently.async.svelte5.test.svelte";
import { getBodyRows } from "./helpers";

// Svelte 5 only, compiled with `experimental.async` (see vite.config.ts).
describe("DataTable in async mode", () => {
  it.each([false, true])(
    "removes a row (selectable: %s)",
    async (selectable) => {
      render(DataTableRowRemoved, { props: { selectable } });

      await user.click(screen.getByRole("button", { name: "Remove Bravo" }));

      expect(screen.queryByText("Bravo")).not.toBeInTheDocument();
      expect(screen.getByText("Charlie")).toBeInTheDocument();
    },
  );

  it("sorts rows replaced without Svelte seeing it", async () => {
    render(DataTableRowsReplacedSilently);

    await user.click(
      screen.getByRole("button", { name: "Replace rows silently" }),
    );
    await user.click(screen.getByRole("button", { name: /Name/ }));

    expect(getBodyRows().map((row) => row.textContent?.trim())).toEqual([
      "Charlie",
      "Delta",
    ]);
  });
});
