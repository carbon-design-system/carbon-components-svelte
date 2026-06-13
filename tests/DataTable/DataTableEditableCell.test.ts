import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import DataTableEditableCell from "./DataTableEditableCell.test.svelte";

const dirty = () => screen.getByTestId("dirty").textContent;
const valid = () => screen.getByTestId("valid").textContent;

function getFirstBodyRow(): HTMLElement {
  const rows = screen
    .getAllByRole("row")
    .filter((r) => r.closest("tbody") !== null);
  expect(rows.length).toBeGreaterThan(0);
  return rows[0];
}

describe("EditableCell", () => {
  it("starts clean and valid for non-empty initial values", () => {
    render(DataTableEditableCell);
    expect(dirty()).toBe("false");
    expect(valid()).toBe("true");
  });

  it("marks the table dirty when a cell value changes", async () => {
    render(DataTableEditableCell);
    const input = screen.getByLabelText("Name") as HTMLInputElement;

    await fireEvent.input(input, { target: { value: "beta" } });
    await tick();

    expect(dirty()).toBe("true");
  });

  it("rolls up validity from the cell's validate function", async () => {
    render(DataTableEditableCell);
    const input = screen.getByLabelText("Name") as HTMLInputElement;

    await fireEvent.input(input, { target: { value: "" } });
    await tick();
    expect(valid()).toBe("false");

    await fireEvent.input(input, { target: { value: "gamma" } });
    await tick();
    expect(valid()).toBe("true");
  });

  it("clears dirty after resetDirty re-snapshots the baseline", async () => {
    const { component } = render(DataTableEditableCell);
    const input = screen.getByLabelText("Name") as HTMLInputElement;

    await fireEvent.input(input, { target: { value: "beta" } });
    await tick();
    expect(dirty()).toBe("true");

    component.resetDirty();
    await tick();
    expect(dirty()).toBe("false");

    // A further edit (away from the new baseline) marks dirty again.
    await fireEvent.input(input, { target: { value: "gamma" } });
    await tick();
    expect(dirty()).toBe("true");
  });

  it("re-derives a display column after an edit without a manual refresh", async () => {
    render(DataTableEditableCell);
    expect(
      within(getFirstBodyRow()).queryByRole("cell", { name: "20" }),
    ).not.toBeNull();

    const qty = screen.getByRole("spinbutton") as HTMLInputElement;
    await fireEvent.input(qty, { target: { value: "5" } });
    await tick();

    const row = getFirstBodyRow();
    expect(within(row).queryByRole("cell", { name: "50" })).not.toBeNull();
    expect(within(row).queryByRole("cell", { name: "20" })).toBeNull();
  });
});
