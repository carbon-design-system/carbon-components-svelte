import { render, screen } from "@testing-library/svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { getForm } from "../utils/get-form";
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

    getForm().reset();
    await flushFormReset();

    expect(getBoxes("tree").map((box) => box.checked)).toEqual([true, false]);
  });

  it("keeps open MultiSelect option checkboxes in step with selectedIds", async () => {
    render(CheckboxDecorativeForm);
    expect(getBoxes("multiselect").map((box) => box.checked)).toEqual([
      true,
      false,
    ]);

    getForm().reset();
    await flushFormReset();

    expect(getBoxes("multiselect").map((box) => box.checked)).toEqual([
      true,
      false,
    ]);
  });
});
