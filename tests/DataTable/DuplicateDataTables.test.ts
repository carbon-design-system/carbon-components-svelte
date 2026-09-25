import { fireEvent, render } from "@testing-library/svelte";
import DuplicateDataTables from "./DuplicateDataTables.test.svelte";

describe("DuplicateDataTables", () => {
  it("should allow independent radio selection in duplicate tables", async () => {
    const { container } = render(DuplicateDataTables);

    const radioTables = container.querySelectorAll(
      'input[type="radio"][name="radio-select"]',
    );
    expect(radioTables).toHaveLength(4); // 2 rows * 2 tables

    await fireEvent.click(radioTables[0]);
    expect(radioTables[0]).toBeChecked();
    expect(radioTables[1]).not.toBeChecked();
    expect(radioTables[2]).not.toBeChecked();
    expect(radioTables[3]).not.toBeChecked();

    await fireEvent.click(radioTables[3]);
    expect(radioTables[0]).not.toBeChecked();
    expect(radioTables[1]).not.toBeChecked();
    expect(radioTables[2]).not.toBeChecked();
    expect(radioTables[3]).toBeChecked();
  });

  it("should allow independent checkbox selection in duplicate tables", async () => {
    const { container } = render(DuplicateDataTables);

    const checkboxTables = container.querySelectorAll(
      'input[type="checkbox"][name="checkbox-select"]',
    );
    expect(checkboxTables).toHaveLength(4); // 2 rows * 2 tables

    await fireEvent.click(checkboxTables[0]);
    expect(checkboxTables[0]).toBeChecked();
    expect(checkboxTables[1]).not.toBeChecked();
    expect(checkboxTables[2]).not.toBeChecked();
    expect(checkboxTables[3]).not.toBeChecked();

    await fireEvent.click(checkboxTables[3]);
    expect(checkboxTables[0]).toBeChecked();
    expect(checkboxTables[1]).not.toBeChecked();
    expect(checkboxTables[2]).not.toBeChecked();
    expect(checkboxTables[3]).toBeChecked();
  });

  it("should maintain separate select-all checkboxes for each table", async () => {
    const { container } = render(DuplicateDataTables);

    const selectAllCheckboxes = container.querySelectorAll(
      'input[type="checkbox"][value="all"]',
    );
    expect(selectAllCheckboxes).toHaveLength(2); // One per table

    await fireEvent.click(selectAllCheckboxes[0]);
    expect(selectAllCheckboxes[0]).toBeChecked();
    expect(selectAllCheckboxes[1]).not.toBeChecked();

    await fireEvent.click(selectAllCheckboxes[1]);
    expect(selectAllCheckboxes[0]).toBeChecked();
    expect(selectAllCheckboxes[1]).toBeChecked();
  });
});
