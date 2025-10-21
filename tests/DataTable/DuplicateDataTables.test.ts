import { fireEvent, render } from "@testing-library/svelte";
import DuplicateDataTables from "./DuplicateDataTables.test.svelte";

describe("DuplicateDataTables", () => {
  test("should allow independent radio selection in duplicate tables", async () => {
    const { container } = render(DuplicateDataTables);

    // Get all radio tables
    const radioTables = container.querySelectorAll(
      'input[type="radio"][name="radio-select"]',
    );
    expect(radioTables).toHaveLength(4); // 2 rows * 2 tables

    // Select first row in first table
    await fireEvent.click(radioTables[0]);
    expect(radioTables[0]).toBeChecked();
    expect(radioTables[1]).not.toBeChecked();
    expect(radioTables[2]).not.toBeChecked();
    expect(radioTables[3]).not.toBeChecked();

    // Select second row in second table
    await fireEvent.click(radioTables[3]);
    expect(radioTables[0]).not.toBeChecked();
    expect(radioTables[1]).not.toBeChecked();
    expect(radioTables[2]).not.toBeChecked();
    expect(radioTables[3]).toBeChecked();
  });

  test("should allow independent checkbox selection in duplicate tables", async () => {
    const { container } = render(DuplicateDataTables);

    // Get all checkbox tables
    const checkboxTables = container.querySelectorAll(
      'input[type="checkbox"][name="checkbox-select"]',
    );
    expect(checkboxTables).toHaveLength(4); // 2 rows * 2 tables

    // Select first row in first table
    await fireEvent.click(checkboxTables[0]);
    expect(checkboxTables[0]).toBeChecked();
    expect(checkboxTables[1]).not.toBeChecked();
    expect(checkboxTables[2]).not.toBeChecked();
    expect(checkboxTables[3]).not.toBeChecked();

    // Select second row in second table
    await fireEvent.click(checkboxTables[3]);
    expect(checkboxTables[0]).toBeChecked();
    expect(checkboxTables[1]).not.toBeChecked();
    expect(checkboxTables[2]).not.toBeChecked();
    expect(checkboxTables[3]).toBeChecked();
  });

  test("should maintain separate select-all checkboxes for each table", async () => {
    const { container } = render(DuplicateDataTables);

    // Get all select-all checkboxes
    const selectAllCheckboxes = container.querySelectorAll(
      'input[type="checkbox"][value="all"]',
    );
    expect(selectAllCheckboxes).toHaveLength(2); // One per table

    // Select all in first table
    await fireEvent.click(selectAllCheckboxes[0]);
    expect(selectAllCheckboxes[0]).toBeChecked();
    expect(selectAllCheckboxes[1]).not.toBeChecked();

    // Select all in second table
    await fireEvent.click(selectAllCheckboxes[1]);
    expect(selectAllCheckboxes[0]).toBeChecked();
    expect(selectAllCheckboxes[1]).toBeChecked();
  });
});
