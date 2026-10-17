import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import DataTable from "./DataTable.test.svelte";
import { eventNames, getBodyRows, getCells } from "./helpers";

describe("DataTable body cells", () => {
  const rows = [
    { id: "a", name: "Load Balancer 3", protocol: "HTTP" },
    { id: "b", name: "Load Balancer 1", protocol: "HTTP" },
  ];

  describe("empty column", () => {
    const headers = [
      { key: "name", value: "Name" },
      { key: "actions", value: "", empty: true },
    ] as const;

    it("pairs a data cell with its header and leaves an empty cell unpaired", () => {
      render(DataTable, { props: { headers, rows } });

      const nameHeader = screen.getAllByRole("columnheader")[0];
      const [nameCell, actionsCell] = getCells(getBodyRows()[0]);

      expect(nameHeader.id).toBeTruthy();
      expect(nameCell).toHaveAttribute("headers", nameHeader.id);
      expect(actionsCell).not.toHaveAttribute("headers");
    });

    it("dispatches cell events for a data cell but not an empty cell", async () => {
      const onevent = vi.fn();
      render(DataTable, { props: { headers, rows, onevent } });

      const [nameCell, actionsCell] = getCells(getBodyRows()[0]);

      await user.click(actionsCell);
      expect(eventNames(onevent, "click")).toEqual(["click", "click:row"]);

      onevent.mockClear();
      await user.click(nameCell);
      expect(eventNames(onevent, "click")).toEqual([
        "click",
        "click:cell",
        "click",
        "click:row",
      ]);
    });
  });
});
