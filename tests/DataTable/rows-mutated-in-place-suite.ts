import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import { getBodyRows } from "./helpers";

const NAME_HEADER = /Name/;

const rowNames = () => getBodyRows().map((row) => row.textContent?.trim());

/**
 * The fixture renders rows Alpha and Bravo, sortable by name, and a
 * "Replace rows" button that replaces them in place with Delta and Charlie,
 * and a "Rename first row" button that renames row 0 in place to Echo.
 */
export function describeRowsMutatedInPlace(
  label: string,
  Fixture: Parameters<typeof render>[0],
) {
  describe(`DataTable rows mutated in place (${label})`, () => {
    it("renders the new rows", async () => {
      render(Fixture);
      await user.click(screen.getByRole("button", { name: "Replace rows" }));

      expect(rowNames()).toEqual(["Delta", "Charlie"]);
    });

    it("sorts the new rows", async () => {
      render(Fixture);
      await user.click(screen.getByRole("button", { name: "Replace rows" }));
      await user.click(screen.getByRole("button", { name: NAME_HEADER }));

      expect(rowNames()).toEqual(["Charlie", "Delta"]);
    });

    it("leaves a renamed row for refreshRow after rows were replaced", async () => {
      render(Fixture);
      await user.click(screen.getByRole("button", { name: "Replace rows" }));
      await user.click(
        screen.getByRole("button", { name: "Rename first row" }),
      );

      expect(rowNames()).toEqual(["Delta", "Charlie"]);
    });
  });
}
