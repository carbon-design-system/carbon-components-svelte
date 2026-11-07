import { render, screen, within } from "@testing-library/svelte";
import { user } from "../utils/user";
import MultiSort from "./DataTableMultiSort.test.svelte";
import { getBodyRows, getCells } from "./helpers";

const names = () =>
  getBodyRows().map((row) => getCells(row)[1].textContent?.trim());

const state = () => JSON.parse(screen.getByTestId("state").textContent ?? "");

const header = (name: string) =>
  screen.getByRole("button", { name: new RegExp(`^${name}`) });

async function shiftClick(name: string) {
  await user.keyboard("{Shift>}");
  await user.click(header(name));
  await user.keyboard("{/Shift}");
}

describe("DataTable sortMode multiple with externalSort", () => {
  it("emits the list, shows the priority and leaves the rows in the order given", async () => {
    const onsort = vi.fn();
    const sort = vi.fn(() => 0);
    render(MultiSort, { props: { externalSort: true, onsort, sort } });
    const given = names();

    await user.click(header("Team"));
    await shiftClick("Age");

    expect(onsort.mock.calls[1][0].detail.sortBy).toEqual([
      { key: "team", direction: "ascending" },
      { key: "age", direction: "ascending" },
    ]);
    expect(state().sortBy).toHaveLength(2);
    expect(
      header("Age").querySelector(".bx--table-sort__priority"),
    ).toHaveTextContent("2");
    expect(names()).toEqual(given);
    expect(sort).not.toHaveBeenCalled();
  });

  it("emits the list from the Sort by dialog", async () => {
    const onsort = vi.fn();
    render(MultiSort, {
      props: { externalSort: true, toolbar: true, onsort },
    });
    const given = names();

    await user.click(screen.getByRole("button", { name: "Sort by" }));
    const dialog = await screen.findByRole("dialog", { name: "Sort by" });
    await user.click(
      within(dialog).getByRole("button", { name: "Add sort rule" }),
    );
    await user.click(within(dialog).getByRole("button", { name: "Apply" }));

    expect(onsort).toHaveBeenCalledTimes(1);
    expect(onsort.mock.calls[0][0].detail.sortBy).toEqual([
      { key: "team", direction: "ascending" },
    ]);
    expect(names()).toEqual(given);
  });
});
