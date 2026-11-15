import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import DataTableRowRemoved from "./DataTableRowRemoved.async.svelte5.test.svelte";

// Svelte 5 only, compiled with `experimental.async` (see vite.config.ts).
describe("DataTable row removal in async mode", () => {
  it.each([false, true])(
    "removes the row (selectable: %s)",
    async (selectable) => {
      render(DataTableRowRemoved, { props: { selectable } });

      await user.click(screen.getByRole("button", { name: "Remove Bravo" }));

      expect(screen.queryByText("Bravo")).not.toBeInTheDocument();
      expect(screen.getByText("Charlie")).toBeInTheDocument();
    },
  );
});
