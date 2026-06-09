import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import DataTableFilterMode from "./DataTableFilterMode.test.svelte";

describe("DataTable filterMode", () => {
  const getSearch = () => screen.getByRole("searchbox");
  const selectedCount = () =>
    Number(screen.getByTestId("selected-count").textContent);

  it('keeps filtered-out rows mounted with filterMode="hide"', async () => {
    render(DataTableFilterMode);

    const note = screen.getByTestId("note-0");
    await user.type(note, "draft");
    expect(note).toHaveValue("draft");

    // "round" matches Round robin rows only; row 0 is DNS delegation.
    await user.type(getSearch(), "round");

    const hiddenRow = document.querySelector('[data-row="0"]')?.closest("tr");
    expect(hiddenRow).toHaveAttribute("hidden");
    expect(screen.getByTestId("note-0")).toBe(note);
    expect(note).toHaveValue("draft");

    await user.clear(getSearch());
    expect(screen.getByTestId("note-0")).toBe(note);
    expect(note).toHaveValue("draft");
    expect(document.querySelector('[data-row="0"]')).not.toHaveAttribute(
      "hidden",
    );
  });

  it('removes filtered-out rows with filterMode="remove"', async () => {
    render(DataTableFilterMode, { props: { filterMode: "remove" } });

    expect(screen.getByTestId("note-0")).toBeInTheDocument();

    await user.type(getSearch(), "round");

    expect(screen.queryByTestId("note-0")).not.toBeInTheDocument();
  });

  it('"select all" selects only matching rows while filtering', async () => {
    render(DataTableFilterMode, { props: { batchSelection: true } });

    await user.type(getSearch(), "round");
    expect(screen.getAllByText(/Round robin/)).toHaveLength(3);

    await user.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    expect(selectedCount()).toBe(3);
  });

  it('"select all" covers every row when no filter is active', async () => {
    render(DataTableFilterMode, { props: { batchSelection: true } });

    await user.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    expect(selectedCount()).toBe(6);
  });

  it('falls back to "remove" when pageSize is set', async () => {
    render(DataTableFilterMode, {
      props: { filterMode: "hide", pageSize: 3 },
    });

    await user.type(getSearch(), "round");

    expect(screen.queryByTestId("note-0")).not.toBeInTheDocument();
    const row = document.querySelector('[data-row="1"]')?.closest("tr");
    expect(row).not.toHaveAttribute("hidden");
  });
});
