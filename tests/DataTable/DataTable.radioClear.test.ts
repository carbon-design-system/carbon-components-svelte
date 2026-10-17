import { render } from "@testing-library/svelte";
import { user } from "../utils/user";
import DataTable from "./DataTable.test.svelte";
import { getRowInput } from "./helpers";

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
