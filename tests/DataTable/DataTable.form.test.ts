import { render } from "@testing-library/svelte";
import { getBoundText } from "../utils/get-bound-text";
import { getForm } from "../utils/get-form";
import { resetForm } from "../utils/reset-form";
import { user } from "../utils/user";
import DataTableForm from "./DataTable.form.test.svelte";
import { getRowInputs, getSelectAll } from "./helpers";

describe("DataTable form reset", () => {
  it("clears a checkbox selection without firing events", async () => {
    const onSelect = vi.fn();
    render(DataTableForm, { props: { onSelect } });

    const [first, second] = getRowInputs();
    await user.click(first);
    await user.click(second);
    expect(getBoundText()).toBe("[1,2]");
    onSelect.mockClear();

    await resetForm();

    expect(getBoundText()).toBe("[]");
    for (const input of getRowInputs()) expect(input).not.toBeChecked();
    expect(getSelectAll()).not.toBeChecked();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("clears a radio selection", async () => {
    render(DataTableForm, { props: { radio: true, selectedRowIds: [2] } });
    expect(getRowInputs()[1]).toBeChecked();

    await resetForm();

    expect(getBoundText()).toBe("[]");
    expect(new FormData(getForm()).getAll("user")).toEqual([]);
  });

  it.each([false, true])(
    "keeps rows checked by server-rendered markup, with their original ids (no inputName: %s)",
    async (noInputName) => {
      render(DataTableForm, { props: { noInputName } });

      const [first, , third] = getRowInputs();
      // Server-rendered markup carries the state as the `checked` attribute.
      first.defaultChecked = true;
      third.defaultChecked = true;
      await user.click(getRowInputs()[1]);

      await resetForm();

      expect(getBoundText()).toBe("[1,3]");
    },
  );
});
