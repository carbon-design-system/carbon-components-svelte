import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import DataTable from "./DataTableStacked.test.svelte";

const headers = [
  { key: "name", value: "Name", primary: true },
  { key: "protocol", value: "Protocol" },
  { key: "port", value: "Port", stackedLabel: "Port number" },
  { key: "rule", value: "Rule", stackedHidden: true },
  { key: "actions", value: "Actions", empty: true },
];

const rows = [
  {
    id: "a",
    name: "Load Balancer 3",
    protocol: "HTTP",
    port: 3000,
    rule: "r1",
  },
  { id: "b", name: "Load Balancer 1", protocol: "TCP", port: 443, rule: "r2" },
];

const bodyRows = () =>
  screen
    .getAllByRole("row", { hidden: true })
    .filter((row) => row.closest("tbody"));

const state = () => screen.getByTestId("state").textContent;

describe("DataTable stacked", () => {
  it("is the same table as before when `stacked` is unset", () => {
    const { container } = render(DataTable, { props: { headers, rows } });

    expect(container.querySelector("[class*='--stacked']")).toBeNull();
    expect(container.querySelector("[data-label]")).toBeNull();
    expect(container.querySelector("[data-stacked]")).toBeNull();
    expect(
      container.querySelector("tbody[role], tr[role], td[role], table[role]"),
    ).toBeNull();
    expect(
      container.querySelector(".bx--data-table-stacked-controls"),
    ).toBeNull();
  });

  it("labels each cell from its header and names the roles CSS would drop", () => {
    const { container } = render(DataTable, {
      props: { headers, rows, stacked: "auto" },
    });

    const root = container.querySelector(".bx--data-table-container");
    expect(root).toHaveClass(
      "bx--data-table-container--stacked",
      "bx--data-table-container--stacked-md",
    );
    expect(screen.getByRole("table")).toHaveAttribute("role", "table");

    const cells = bodyRows()[0].querySelectorAll("td");
    expect([...cells].map((cell) => cell.getAttribute("data-label"))).toEqual([
      "Name",
      "Protocol",
      "Port number",
      "Rule",
      null,
    ]);
    expect([...cells].map((cell) => cell.getAttribute("data-stacked"))).toEqual(
      ["primary", null, null, "hidden", "actions"],
    );
    expect(bodyRows()[0]).toHaveAttribute("role", "row");
    expect(cells[0]).toHaveAttribute("role", "cell");
    expect(container.querySelector("tbody")).toHaveAttribute(
      "role",
      "rowgroup",
    );
  });

  it("takes the breakpoint, and `always` needs no container", () => {
    const { container, rerender } = render(DataTable, {
      props: { headers, rows, stacked: "auto", stackedBreakpoint: "lg" },
    });
    const root = container.querySelector(".bx--data-table-container");
    expect(root).toHaveClass("bx--data-table-container--stacked-lg");

    return rerender({ headers, rows, stacked: "always" }).then(() => {
      expect(root).toHaveClass("bx--data-table-container--stacked-always");
      expect(root).not.toHaveClass("bx--data-table-container--stacked-lg");
    });
  });

  it("renders every row, since cards vary in height", () => {
    const many = Array.from({ length: 300 }, (_, i) => ({
      id: `r${i}`,
      name: `Row ${i}`,
    }));
    render(DataTable, {
      props: {
        headers: [{ key: "name", value: "Name" }],
        rows: many,
        stacked: "always",
        virtualize: true,
      },
    });

    expect(bodyRows()).toHaveLength(300);
  });

  it("ignores `useStaticWidth` in `auto`, which a container cannot honor", () => {
    const { container } = render(DataTable, {
      props: { headers, rows, stacked: "auto", useStaticWidth: true },
    });

    expect(
      container.querySelector(".bx--data-table-container--static"),
    ).toBeNull();
  });

  describe("controls", () => {
    it("sorts from a select, since the header is hidden", async () => {
      const onsort = vi.fn();
      render(DataTable, {
        props: { headers, rows, stacked: "always", sortable: true, onsort },
      });

      const select = screen.getByRole("combobox", { name: "Sort by" });
      // Sortable columns only: not the empty one, nor the hidden one.
      expect(
        [...select.querySelectorAll("option")].map((o) => o.textContent),
      ).toEqual([
        "Default order",
        "Name, ascending",
        "Name, descending",
        "Protocol, ascending",
        "Protocol, descending",
        "Port number, ascending",
        "Port number, descending",
      ]);

      await user.selectOptions(select, "Protocol, descending");

      expect(onsort).toHaveBeenCalledWith({
        key: "protocol",
        direction: "descending",
      });
      expect(state()).toBe("|protocol|descending");
      expect(select).toHaveValue("1:descending");
    });

    it("keeps the sort when the `sort` event is cancelled", async () => {
      render(DataTable, {
        props: {
          headers,
          rows,
          stacked: "always",
          sortable: true,
          preventSortDefault: true,
        },
      });

      const select = screen.getByRole("combobox", { name: "Sort by" });
      await user.selectOptions(select, "Name, ascending");

      expect(state()).toBe("||none");
      expect(select).toHaveValue("");
    });

    it("selects every row from a checkbox that stands for the header's", async () => {
      render(DataTable, {
        props: { headers, rows, stacked: "always", batchSelection: true },
      });

      // The header's own checkbox is still in the markup; CSS hides it.
      await user.click(
        document.querySelector<HTMLInputElement>(
          "input[id$='-stacked-select-all']",
        )!,
      );

      expect(state()).toBe("a,b||none");
    });

    it("has no controls when there is nothing to sort or select", () => {
      const { container } = render(DataTable, {
        props: { headers, rows, stacked: "always" },
      });

      expect(
        container.querySelector(".bx--data-table-stacked-controls"),
      ).toBeNull();
    });
  });
});
