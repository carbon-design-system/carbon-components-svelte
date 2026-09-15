import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import DataTable from "./DataTable.test.svelte";

function getRadio(container: HTMLElement, rowId: string) {
  const radio = container.querySelector<HTMLInputElement>(
    `tr[data-row="${rowId}"] input[type="radio"]`,
  );
  if (!radio) throw new Error(`Radio for row "${rowId}" not found`);
  return radio;
}

describe("DataTable radio selection clearing", () => {
  const headers = [{ key: "name", value: "Name" }] as const;

  const rows = [
    { id: "a", name: "api-gateway" },
    { id: "b", name: "payments-api" },
  ];

  it("clears the selection when selectedRowIds is set to an empty array", async () => {
    const { container, rerender } = render(DataTable, {
      props: {
        headers,
        rows,
        radio: true,
        selectedRowIds: ["a"],
      },
    });

    expect(getRadio(container, "a")).toBeChecked();
    expect(getRadio(container, "a")).toHaveAccessibleName("Select row");

    rerender({ selectedRowIds: [] });
    await tick();

    expect(getRadio(container, "a")).not.toBeChecked();
    expect(getRadio(container, "b")).not.toBeChecked();
  });

  it("keeps the selection on click when allowDeselect is not set", async () => {
    const { container } = render(DataTable, {
      props: {
        headers,
        rows,
        radio: true,
        selectedRowIds: ["a"],
      },
    });

    const radio = getRadio(container, "a");
    await user.click(radio);

    expect(radio).toBeChecked();
  });

  it("clicking the selected row clears the selection when allowDeselect is set", async () => {
    const { container } = render(DataTable, {
      props: {
        headers,
        rows,
        radio: true,
        allowDeselect: true,
        selectedRowIds: ["a"],
      },
    });

    const radio = getRadio(container, "a");
    expect(radio).toBeChecked();

    await user.click(radio);

    expect(radio).not.toBeChecked();
  });

  it("clicking an unselected row still selects it when allowDeselect is set", async () => {
    const { container } = render(DataTable, {
      props: {
        headers,
        rows,
        radio: true,
        allowDeselect: true,
        selectedRowIds: ["a"],
      },
    });

    const nextRadio = getRadio(container, "b");
    await user.click(nextRadio);

    expect(nextRadio).toBeChecked();
    expect(getRadio(container, "a")).not.toBeChecked();
  });
});
