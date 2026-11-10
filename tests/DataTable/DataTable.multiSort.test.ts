import { render, screen, within } from "@testing-library/svelte";
import { user } from "../utils/user";
import MultiSort from "./DataTableMultiSort.test.svelte";
import { getBodyRows, getCells } from "./helpers";

/** Names, top to bottom (the Name column). */
const names = () =>
  getBodyRows().map((row) => getCells(row)[1].textContent?.trim());

const state = () => JSON.parse(screen.getByTestId("state").textContent ?? "");

/** The sort button of a column. */
const header = (name: string) =>
  screen.getByRole("button", { name: new RegExp(`^${name}`) });

/** Click a header with Shift held. */
async function shiftClick(name: string) {
  await user.keyboard("{Shift>}");
  await user.click(header(name));
  await user.keyboard("{/Shift}");
}

const badge = (name: string) =>
  header(name).querySelector(".bx--table-sort__priority")?.textContent;

describe("DataTable sortMode multiple", () => {
  it("adds a secondary key on Shift+click and orders ties by it", async () => {
    render(MultiSort);

    await user.click(header("Team"));
    await shiftClick("Age");

    // Blue: 25 Bo, 40 Di. Red: 25 Ed, 30 Cy / Al (a tie, input order).
    expect(names()).toEqual(["Bo", "Di", "Ed", "Cy", "Al"]);
    expect(state().sortBy).toEqual([
      { key: "team", direction: "ascending" },
      { key: "age", direction: "ascending" },
    ]);
  });

  it("shows the priority only once two columns are sorted", async () => {
    render(MultiSort);

    await user.click(header("Team"));
    expect(badge("Team")).toBeUndefined();

    await shiftClick("Age");
    expect(badge("Team")).toBe("1");
    expect(badge("Age")).toBe("2");
    expect(badge("Name")).toBeUndefined();
  });

  it("reports aria-sort on the primary column alone and describes the rest", async () => {
    render(MultiSort);

    await user.click(header("Team"));
    await shiftClick("Age");
    await shiftClick("Age");

    expect(header("Team").closest("th")).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    expect(header("Age").closest("th")).toHaveAttribute("aria-sort", "none");
    expect(header("Age")).toHaveAccessibleDescription(
      "Sorted descending, priority 2 of 2",
    );
    expect(header("Team")).toHaveAccessibleDescription(
      "Sorted ascending, priority 1 of 2",
    );
    // The badge is decoration: the description says it.
    expect(
      header("Age").querySelector(".bx--table-sort__priority"),
    ).toHaveAttribute("aria-hidden", "true");
  });

  it("sorts by the header alone on a plain click", async () => {
    render(MultiSort);

    await user.click(header("Team"));
    await shiftClick("Age");
    await user.click(header("Name"));

    expect(state().sortBy).toEqual([{ key: "name", direction: "ascending" }]);
    expect(names()).toEqual(["Al", "Bo", "Cy", "Di", "Ed"]);
    expect(badge("Name")).toBeUndefined();
  });

  it("cycles a secondary key ascending, descending, removed", async () => {
    render(MultiSort);

    await user.click(header("Team"));
    await shiftClick("Age");
    await shiftClick("Age");
    expect(state().sortBy[1]).toEqual({ key: "age", direction: "descending" });

    await shiftClick("Age");
    expect(state().sortBy).toEqual([{ key: "team", direction: "ascending" }]);
  });

  it("promotes the next key when the primary is removed", async () => {
    render(MultiSort);

    await user.click(header("Team"));
    await shiftClick("Age");
    await shiftClick("Team");
    await shiftClick("Team");

    expect(state()).toMatchObject({
      sortBy: [{ key: "age", direction: "ascending" }],
      sortKey: "age",
      sortDirection: "ascending",
    });
    expect(header("Age").closest("th")).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
  });

  it("keeps a key in place with sortAlways", async () => {
    render(MultiSort, { props: { sortAlways: true } });

    await user.click(header("Team"));
    await shiftClick("Age");
    await shiftClick("Age");
    await shiftClick("Age");

    expect(state().sortBy[1]).toEqual({ key: "age", direction: "ascending" });
  });

  it("ignores Shift in single mode", async () => {
    const onsort = vi.fn();
    render(MultiSort, { props: { sortMode: "single", onsort } });

    await user.click(header("Team"));
    await shiftClick("Age");

    expect(state()).toMatchObject({ sortKey: "age", sortBy: [] });
    expect(onsort.mock.calls[1][0].detail).toEqual({
      key: "age",
      direction: "ascending",
    });
    expect(badge("Team")).toBeUndefined();
  });

  it("opens sorted by the list it is given", () => {
    render(MultiSort, {
      props: {
        sortBy: [
          { key: "age", direction: "descending" },
          { key: "name", direction: "ascending" },
        ],
      },
    });

    expect(names()).toEqual(["Di", "Al", "Cy", "Bo", "Ed"]);
    expect(state()).toMatchObject({
      sortKey: "age",
      sortDirection: "descending",
    });
  });

  it("opens sorted by sortKey when the list is empty", () => {
    render(MultiSort, {
      props: { sortKey: "name", sortDirection: "descending" },
    });

    expect(names()).toEqual(["Ed", "Di", "Cy", "Bo", "Al"]);
    expect(state().sortBy).toEqual([{ key: "name", direction: "descending" }]);
  });

  it("replaces the list when sortKey is set from outside", async () => {
    const { rerender } = render(MultiSort);

    await user.click(header("Team"));
    await shiftClick("Age");
    await rerender({ sortKey: "name", sortDirection: "ascending" });

    await vi.waitFor(() =>
      expect(state().sortBy).toEqual([{ key: "name", direction: "ascending" }]),
    );
    expect(names()).toEqual(["Al", "Bo", "Cy", "Di", "Ed"]);
  });

  it("dispatches the proposed list with the sort event", async () => {
    const onsort = vi.fn();
    render(MultiSort, { props: { onsort } });

    await user.click(header("Team"));
    await shiftClick("Age");

    expect(onsort.mock.calls[1][0].detail).toEqual({
      key: "team",
      direction: "ascending",
      sortBy: [
        { key: "team", direction: "ascending" },
        { key: "age", direction: "ascending" },
      ],
    });
  });

  it("leaves the sort alone when the sort event is cancelled", async () => {
    render(MultiSort, {
      props: { onsort: (event: CustomEvent) => event.preventDefault() },
    });

    await user.click(header("Team"));

    expect(state().sortBy).toEqual([]);
    expect(names()).toEqual(["Cy", "Bo", "Al", "Di", "Ed"]);
  });

  it("does not sort again when only the selection changes", async () => {
    const sort = vi.fn((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    render(MultiSort, { props: { sort, selectable: true } });

    await user.click(header("Team"));
    await shiftClick("Age");
    const calls = sort.mock.calls.length;
    expect(calls).toBeGreaterThan(0);

    await user.click(screen.getAllByRole("checkbox")[1]);
    await user.click(screen.getAllByRole("checkbox")[2]);

    expect(sort).toHaveBeenCalledTimes(calls);
  });

  it("announces the whole sort", async () => {
    render(MultiSort);

    await user.click(header("Team"));
    await shiftClick("Age");
    await shiftClick("Age");

    expect(screen.getByRole("status")).toHaveTextContent(
      "Sorted by Team, ascending; then Age, descending",
    );
  });

  it("passes the whole sort to sortStatusText", async () => {
    const sortStatusText = vi.fn(() => "custom");
    render(MultiSort, { props: { sortStatusText } });

    await user.click(header("Team"));
    await shiftClick("Name");

    type Rule = { key: string; direction: string };
    const [primary, direction, context] = sortStatusText.mock
      .calls[1] as unknown as [Rule, string, { sortBy: Rule[] }];
    expect(primary).toMatchObject({ key: "team" });
    expect(direction).toBe("ascending");
    expect(context.sortBy.map((rule) => [rule.key, rule.direction])).toEqual([
      ["team", "ascending"],
      ["name", "ascending"],
    ]);
  });
});

describe("ToolbarSortBy", () => {
  const openDialog = async () => {
    await user.click(screen.getByRole("button", { name: "Sort by" }));
    return screen.findByRole("dialog", { name: "Sort by" });
  };
  const button = (dialog: HTMLElement, name: string) =>
    within(dialog).getByRole("button", { name });
  const buttons = (dialog: HTMLElement, name: string) =>
    within(dialog).getAllByRole("button", { name });

  it("sorts by a list built in the dialog", async () => {
    const onsort = vi.fn();
    render(MultiSort, { props: { toolbar: true, onsort } });

    const dialog = await openDialog();
    expect(within(dialog).getByText("The table is not sorted.")).toBeVisible();

    await user.click(button(dialog, "Add sort rule"));
    await user.click(button(dialog, "Add sort rule"));
    const fields = within(dialog).getAllByRole("combobox");
    await user.selectOptions(fields[0], "Age");
    await user.selectOptions(fields[2], "Name");
    await user.selectOptions(fields[3], "descending");
    await user.click(button(dialog, "Apply"));

    expect(onsort).toHaveBeenCalledTimes(1);
    expect(state().sortBy).toEqual([
      { key: "age", direction: "ascending" },
      { key: "name", direction: "descending" },
    ]);
    expect(names()).toEqual(["Ed", "Bo", "Cy", "Al", "Di"]);
  });

  it("reorders rules, and leaves the sort alone on Cancel", async () => {
    render(MultiSort, {
      props: {
        toolbar: true,
        sortBy: [
          { key: "team", direction: "ascending" },
          { key: "age", direction: "descending" },
        ],
      },
    });

    let dialog = await openDialog();
    await user.click(buttons(dialog, "Move down")[0]);
    await user.click(buttons(dialog, "Remove")[0]);
    await user.click(button(dialog, "Cancel"));
    expect(state().sortBy).toHaveLength(2);

    // Reopening starts again from the table's sort.
    dialog = await openDialog();
    expect(within(dialog).getAllByRole("combobox")).toHaveLength(4);
    await user.click(buttons(dialog, "Move down")[0]);
    await user.click(button(dialog, "Apply"));

    expect(state().sortBy).toEqual([
      { key: "age", direction: "descending" },
      { key: "team", direction: "ascending" },
    ]);
  });

  it("offers each sortable column once", async () => {
    render(MultiSort, {
      props: {
        toolbar: true,
        sortBy: [{ key: "team", direction: "ascending" }],
      },
    });

    const dialog = await openDialog();
    await user.click(button(dialog, "Add sort rule"));
    const second = within(dialog).getAllByRole("combobox")[2];

    // Team is taken; Note opts out of sorting.
    expect(
      within(second)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Name", "Age"]);
  });

  it("is a one column picker in single mode", async () => {
    render(MultiSort, { props: { toolbar: true, sortMode: "single" } });

    const dialog = await openDialog();
    await user.click(button(dialog, "Add sort rule"));

    expect(within(dialog).getAllByRole("combobox")).toHaveLength(2);
    expect(
      within(dialog).queryByRole("button", { name: "Move up" }),
    ).toBeNull();
    expect(
      within(dialog).queryByRole("button", { name: "Add sort rule" }),
    ).toBeNull();
  });
});
