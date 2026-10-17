import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { getBoundText } from "../utils/get-bound-text";
import { getForm } from "../utils/get-form";
import { resetForm } from "../utils/reset-form";
import { user } from "../utils/user";
import DataTableForm from "./DataTable.form.test.svelte";
import DataTableFormAttribute from "./DataTable.formAttribute.test.svelte";
import DataTable from "./DataTable.test.svelte";
import DataTableBatchSelectionSelectableBind from "./DataTableBatchSelectionSelectableBind.test.svelte";
import { getRowInput, getRowInputs, getSelectAll } from "./helpers";

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

describe("DataTable form attribute", () => {
  it("associates the selection inputs with the form named by `inputForm`", () => {
    render(DataTableFormAttribute);

    expect(new FormData(getForm()).get("row")).toBe("b");
  });
});

describe("DataTable radio selection clearing", () => {
  const headers = [{ key: "name", value: "Name" }] as const;

  const rows = [
    { id: "a", name: "api-gateway" },
    { id: "b", name: "payments-api" },
  ];

  it("clears the selection when selectedRowIds is set to an empty array", async () => {
    const { rerender } = render(DataTable, {
      props: {
        headers,
        rows,
        radio: true,
        selectedRowIds: ["a"],
      },
    });

    expect(getRowInput("a")).toBeChecked();
    expect(getRowInput("a")).toHaveAccessibleName("Select row");

    await rerender({ selectedRowIds: [] });

    expect(getRowInput("a")).not.toBeChecked();
    expect(getRowInput("b")).not.toBeChecked();
  });

  it("keeps the selection on click when allowDeselect is not set", async () => {
    render(DataTable, {
      props: {
        headers,
        rows,
        radio: true,
        selectedRowIds: ["a"],
      },
    });

    const radio = getRowInput("a");
    await user.click(radio);

    expect(radio).toBeChecked();
  });

  it("clicking the selected row clears the selection when allowDeselect is set", async () => {
    render(DataTable, {
      props: {
        headers,
        rows,
        radio: true,
        allowDeselect: true,
        selectedRowIds: ["a"],
      },
    });

    const radio = getRowInput("a");
    expect(radio).toBeChecked();

    await user.click(radio);

    expect(radio).not.toBeChecked();
  });

  it("clicking an unselected row still selects it when allowDeselect is set", async () => {
    render(DataTable, {
      props: {
        headers,
        rows,
        radio: true,
        allowDeselect: true,
        selectedRowIds: ["a"],
      },
    });

    const nextRadio = getRowInput("b");
    await user.click(nextRadio);

    expect(nextRadio).toBeChecked();
    expect(getRowInput("a")).not.toBeChecked();
  });
});

// Regression test: `batchSelection` used to write `selectable = true` back
// into the exported prop, clobbering a consumer's `bind:selectable`.
describe("DataTable batchSelection does not clobber bound selectable", () => {
  it("keeps a bound selectable false while still rendering selection checkboxes", async () => {
    const { component } = render(DataTableBatchSelectionSelectableBind, {
      props: { selectable: false, batchSelection: true },
    });

    await tick();

    expect(component.selectable).toBe(false);
    expect(getSelectAll()).toBeInTheDocument();
  });
});
