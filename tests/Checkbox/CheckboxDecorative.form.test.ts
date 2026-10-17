import { render, screen } from "@testing-library/svelte";
import { resetForm } from "../utils/reset-form";
import CheckboxDecorativeForm from "./CheckboxDecorative.form.test.svelte";

const getBoxes = (testId: string) =>
  Array.from(
    screen
      .getByTestId(testId)
      .querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
  );

describe("decorative Checkbox form reset", () => {
  it("keeps TreeView checkboxes in step with checkedIds", async () => {
    render(CheckboxDecorativeForm);
    expect(getBoxes("tree").map((box) => box.checked)).toEqual([true, false]);

    await resetForm();

    expect(getBoxes("tree").map((box) => box.checked)).toEqual([true, false]);
  });

  it("keeps open MultiSelect option checkboxes in step with selectedIds", async () => {
    render(CheckboxDecorativeForm);
    expect(getBoxes("multiselect").map((box) => box.checked)).toEqual([
      true,
      false,
    ]);

    await resetForm();

    expect(getBoxes("multiselect").map((box) => box.checked)).toEqual([
      true,
      false,
    ]);
  });
});
