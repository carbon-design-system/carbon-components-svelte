import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import DataTable from "./DataTable.test.svelte";
import { getBodyRows, getRowInputs, makeRows } from "./helpers";

const headers = [{ key: "name", value: "Name" }];
const rows = makeRows(8);

const checked = () =>
  getRowInputs()
    .map((input, index) => (input.checked ? index : -1))
    .filter((index) => index !== -1);

const clickRow = (index: number) =>
  user.click(getBodyRows()[index].querySelector("td:last-child") as Element);

describe("DataTable selectionRange", () => {
  it("does nothing to the body of a row without the prop", async () => {
    render(DataTable, { props: { selectable: true, headers, rows } });
    await clickRow(2);
    expect(checked()).toEqual([]);
  });

  it("selects a row alone on click, replacing the rest", async () => {
    render(DataTable, {
      props: { selectable: true, selectionRange: true, headers, rows },
    });
    await clickRow(1);
    expect(checked()).toEqual([1]);
    await clickRow(4);
    expect(checked()).toEqual([4]);
  });

  it("toggles a row with Ctrl and with Cmd", async () => {
    render(DataTable, {
      props: { selectable: true, selectionRange: true, headers, rows },
    });
    await clickRow(1);
    await user.keyboard("{Control>}");
    await clickRow(4);
    await user.keyboard("{/Control}");
    expect(checked()).toEqual([1, 4]);
    await user.keyboard("{Meta>}");
    await clickRow(1);
    await user.keyboard("{/Meta}");
    expect(checked()).toEqual([4]);
  });

  it("selects the range from the anchor on Shift+click and keeps the anchor", async () => {
    render(DataTable, {
      props: { selectable: true, selectionRange: true, headers, rows },
    });
    await clickRow(2);
    await user.keyboard("{Shift>}");
    await clickRow(5);
    expect(checked()).toEqual([2, 3, 4, 5]);
    await clickRow(3);
    await user.keyboard("{/Shift}");
    expect(checked()).toEqual([2, 3]);
  });

  it("adds a range to the selection on Ctrl+Shift+click", async () => {
    render(DataTable, {
      props: { selectable: true, selectionRange: true, headers, rows },
    });
    await clickRow(0);
    await user.keyboard("{Control>}");
    await clickRow(5);
    await user.keyboard("{Shift>}");
    await clickRow(7);
    await user.keyboard("{/Shift}{/Control}");
    expect(checked()).toEqual([0, 5, 6, 7]);
  });

  it("skips rows that cannot be selected", async () => {
    render(DataTable, {
      props: {
        selectable: true,
        selectionRange: true,
        nonSelectableRowIds: ["2"],
        headers,
        rows,
      },
    });
    await clickRow(2);
    expect(checked()).toEqual([]);
    await clickRow(1);
    await user.keyboard("{Shift>}");
    await clickRow(4);
    await user.keyboard("{/Shift}");
    expect(getRowInputs().filter((input) => input.checked)).toHaveLength(3);
  });

  it("leaves a checkbox click to the checkbox", async () => {
    render(DataTable, {
      props: { selectable: true, selectionRange: true, headers, rows },
    });
    await clickRow(1);
    await user.click(getRowInputs()[4]);
    expect(checked()).toEqual([1, 4]);
  });

  it("reports the selection on the select event", async () => {
    const onevent = vi.fn();
    render(DataTable, {
      props: { selectable: true, selectionRange: true, headers, rows, onevent },
    });
    await clickRow(3);
    expect(onevent).toHaveBeenCalledWith(
      "click:row--select",
      expect.objectContaining({ selected: true }),
    );
  });

  describe("keyboard", () => {
    it("moves between row checkboxes without selecting", async () => {
      render(DataTable, {
        props: { selectable: true, selectionRange: true, headers, rows },
      });
      getRowInputs()[1].focus();
      await user.keyboard("{ArrowDown}{ArrowDown}");
      expect(getRowInputs()[3]).toHaveFocus();
      expect(checked()).toEqual([]);
      await user.keyboard("{ArrowUp}");
      expect(getRowInputs()[2]).toHaveFocus();
    });

    it("extends the range with Shift+arrow from the focused row", async () => {
      render(DataTable, {
        props: { selectable: true, selectionRange: true, headers, rows },
      });
      getRowInputs()[2].focus();
      await user.keyboard("{Shift>}{ArrowDown}{ArrowDown}{/Shift}");
      expect(getRowInputs()[4]).toHaveFocus();
      expect(checked()).toEqual([2, 3, 4]);
      await user.keyboard("{Shift>}{ArrowUp}{/Shift}");
      expect(checked()).toEqual([2, 3]);
    });

    it("jumps with Home and End, and extends with Shift", async () => {
      render(DataTable, {
        props: { selectable: true, selectionRange: true, headers, rows },
      });
      getRowInputs()[3].focus();
      await user.keyboard("{End}");
      expect(getRowInputs()[7]).toHaveFocus();
      await user.keyboard("{Shift>}{Home}{/Shift}");
      expect(getRowInputs()[0]).toHaveFocus();
      expect(checked()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    });

    it("selects every row with Ctrl+A and clears with Escape", async () => {
      render(DataTable, {
        props: { selectable: true, selectionRange: true, headers, rows },
      });
      getRowInputs()[1].focus();
      await user.keyboard("{Control>}a{/Control}");
      expect(checked()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
      await user.keyboard("{Escape}");
      expect(checked()).toEqual([]);
    });

    it("leaves Space to the checkbox", async () => {
      render(DataTable, {
        props: { selectable: true, selectionRange: true, headers, rows },
      });
      getRowInputs()[1].focus();
      await user.keyboard(" ");
      expect(checked()).toEqual([1]);
    });

    it("leaves the arrow keys alone without the prop", async () => {
      render(DataTable, { props: { selectable: true, headers, rows } });
      getRowInputs()[1].focus();
      await user.keyboard("{Shift>}{ArrowDown}{/Shift}");
      expect(getRowInputs()[1]).toHaveFocus();
      expect(checked()).toEqual([]);
    });
  });

  describe("announcement", () => {
    it("says how many are selected, once, after the quiet time", async () => {
      render(DataTable, {
        props: { selectable: true, selectionRange: true, headers, rows },
      });
      await clickRow(1);
      await user.keyboard("{Shift>}");
      await clickRow(2);
      await clickRow(4);
      await user.keyboard("{/Shift}");
      expect(await screen.findByText("4 selected")).toBeInTheDocument();
    });

    it("takes its own text", async () => {
      render(DataTable, {
        props: {
          selectable: true,
          selectionRange: true,
          headers,
          rows,
          selectedStatusText: (count: number) => `${count} Zeilen`,
        },
      });
      await clickRow(0);
      expect(await screen.findByText("1 Zeilen")).toBeInTheDocument();
    });

    it("has no status region without the prop", () => {
      render(DataTable, { props: { selectable: true, headers, rows } });
      expect(screen.getAllByRole("status")).toHaveLength(1);
    });
  });

  it("keeps the selection a filter hides and says so", async () => {
    render(DataTable, {
      props: {
        selectable: true,
        selectionRange: true,
        search: true,
        headers,
        rows,
      },
    });
    await clickRow(0);
    await user.type(screen.getByRole("searchbox"), "Row 3");
    expect(getRowInputs()).toHaveLength(1);
    await user.keyboard("{Control>}");
    await clickRow(0);
    await user.keyboard("{/Control}");
    expect(
      await screen.findByText("1 selected, 1 not shown"),
    ).toBeInTheDocument();
  });
});
