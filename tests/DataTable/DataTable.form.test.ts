import { render, screen } from "@testing-library/svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { getBoundText } from "../utils/get-bound-text";
import { getForm } from "../utils/get-form";
import { user } from "../utils/user";
import DataTableForm from "./DataTable.form.test.svelte";

const getRowInputs = () => {
  const tbody = screen.getByRole("table").querySelector("tbody");
  assert(tbody);
  return Array.from(
    tbody.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"], input[type="radio"]',
    ),
  );
};

describe("DataTable form reset", () => {
  it("clears a checkbox selection without firing events", async () => {
    const onSelect = vi.fn();
    render(DataTableForm, { props: { onSelect } });

    const [first, second] = getRowInputs();
    await user.click(first);
    await user.click(second);
    expect(getBoundText()).toBe("[1,2]");
    onSelect.mockClear();

    getForm().reset();
    await flushFormReset();

    expect(getBoundText()).toBe("[]");
    for (const input of getRowInputs()) expect(input).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Select all rows" }),
    ).not.toBeChecked();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("clears a radio selection", async () => {
    render(DataTableForm, { props: { radio: true, selectedRowIds: [2] } });
    expect(getRowInputs()[1]).toBeChecked();

    getForm().reset();
    await flushFormReset();

    expect(getBoundText()).toBe("[]");
    expect(new FormData(getForm()).getAll("user")).toEqual([]);
  });

  it("keeps rows checked by server-rendered markup, with their original ids", async () => {
    render(DataTableForm);

    const [first, , third] = getRowInputs();
    // Server-rendered markup carries the state as the `checked` attribute.
    first.defaultChecked = true;
    third.defaultChecked = true;
    await user.click(getRowInputs()[1]);

    getForm().reset();
    await flushFormReset();

    expect(getBoundText()).toBe("[1,3]");
  });
});
