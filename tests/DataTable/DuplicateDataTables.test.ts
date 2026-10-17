import { fireEvent, render } from "@testing-library/svelte";
import DuplicateDataTables from "./DuplicateDataTables.test.svelte";

describe("DuplicateDataTables", () => {
  it("should allow independent radio selection in duplicate tables", async () => {
    const { container, getByTestId } = render(DuplicateDataTables);

    const radios = container.querySelectorAll<HTMLInputElement>(
      'input[type="radio"]',
    );
    expect(radios).toHaveLength(4); // 2 rows * 2 tables

    const checked = () => Array.from(radios, (radio) => radio.checked);
    const state = () => [
      getByTestId("selected-a").textContent,
      getByTestId("selected-b").textContent,
    ];

    await fireEvent.click(radios[0]);
    expect(checked()).toEqual([true, false, false, false]);
    expect(state()).toEqual(['["1"]', "[]"]);

    await fireEvent.click(radios[3]);
    expect(checked()).toEqual([true, false, false, true]);
    expect(state()).toEqual(['["1"]', '["2"]']);
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
