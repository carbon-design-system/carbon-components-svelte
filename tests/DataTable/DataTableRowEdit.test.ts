import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import DataTableRowEdit from "./DataTableRowEdit.test.svelte";

const editing = () => screen.getByTestId("editing").textContent;
const saved = () => screen.getByTestId("saved").textContent;
const discarded = () => screen.getByTestId("discarded").textContent;

function bodyRow(id: string): HTMLElement {
  const row = document.querySelector(`[data-row="${id}"]`);
  expect(row).not.toBeNull();
  return row as HTMLElement;
}

describe("DataTable row edit mode", () => {
  it("enters edit mode for one row, leaving others read-only", async () => {
    render(DataTableRowEdit);
    expect(editing()).toBe("");

    await fireEvent.click(screen.getByTestId("edit-a"));
    await tick();

    expect(editing()).toBe("a");
    // Row a shows an input; row b stays as static text.
    expect(within(bodyRow("a")).getByLabelText("Name")).toBeInTheDocument();
    expect(within(bodyRow("b")).queryByLabelText("Name")).toBeNull();
    expect(
      within(bodyRow("b")).queryByRole("cell", { name: "beta" }),
    ).not.toBeNull();
  });

  it("commits the edit and dispatches save", async () => {
    render(DataTableRowEdit);
    await fireEvent.click(screen.getByTestId("edit-a"));
    await tick();

    const input = within(bodyRow("a")).getByLabelText(
      "Name",
    ) as HTMLInputElement;
    await fireEvent.input(input, { target: { value: "ALPHA" } });
    await fireEvent.click(screen.getByTestId("save-a"));
    await tick();

    expect(editing()).toBe("");
    expect(saved()).toBe("ALPHA");
    expect(
      within(bodyRow("a")).queryByRole("cell", { name: "ALPHA" }),
    ).not.toBeNull();
  });

  it("restores the snapshot on cancel and dispatches discard", async () => {
    render(DataTableRowEdit);
    await fireEvent.click(screen.getByTestId("edit-a"));
    await tick();

    const input = within(bodyRow("a")).getByLabelText(
      "Name",
    ) as HTMLInputElement;
    await fireEvent.input(input, { target: { value: "zzz" } });
    await fireEvent.click(screen.getByTestId("cancel-a"));
    await tick();

    expect(editing()).toBe("");
    expect(discarded()).toBe("alpha");
    // Reverted to the pre-edit value.
    expect(
      within(bodyRow("a")).queryByRole("cell", { name: "alpha" }),
    ).not.toBeNull();
    expect(
      within(bodyRow("a")).queryByRole("cell", { name: "zzz" }),
    ).toBeNull();
  });

  it("commits on Enter and cancels on Escape", async () => {
    render(DataTableRowEdit);

    // Enter commits.
    await fireEvent.click(screen.getByTestId("edit-a"));
    await tick();
    let input = within(bodyRow("a")).getByLabelText("Name") as HTMLInputElement;
    await fireEvent.input(input, { target: { value: "ENTERED" } });
    await fireEvent.keyDown(input, { key: "Enter" });
    await tick();
    expect(editing()).toBe("");
    expect(saved()).toBe("ENTERED");

    // Escape cancels.
    await fireEvent.click(screen.getByTestId("edit-b"));
    await tick();
    input = within(bodyRow("b")).getByLabelText("Name") as HTMLInputElement;
    await fireEvent.input(input, { target: { value: "nope" } });
    await fireEvent.keyDown(input, { key: "Escape" });
    await tick();
    expect(editing()).toBe("");
    expect(discarded()).toBe("beta");
    expect(
      within(bodyRow("b")).queryByRole("cell", { name: "beta" }),
    ).not.toBeNull();
  });

  it("enters edit mode when editingRowId is set programmatically", async () => {
    render(DataTableRowEdit);

    await fireEvent.click(screen.getByTestId("program-edit-b"));
    await tick();

    expect(editing()).toBe("b");
    expect(within(bodyRow("b")).getByLabelText("Name")).toBeInTheDocument();
  });
});
