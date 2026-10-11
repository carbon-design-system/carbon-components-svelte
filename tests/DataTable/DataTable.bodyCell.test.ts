import { render, screen, within } from "@testing-library/svelte";
import { user } from "../utils/user";
import DataTable from "./DataTable.test.svelte";
import { getBodyRows } from "./helpers";

const clickEvents = (spy: { mock: { calls: unknown[][] } }) =>
  spy.mock.calls
    .map(([name]) => String(name))
    .filter((name) => name.startsWith("click"));

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
      const [nameCell, actionsCell] = within(getBodyRows()[0]).getAllByRole(
        "cell",
      );

      expect(nameHeader.id).toBeTruthy();
      expect(nameCell).toHaveAttribute("headers", nameHeader.id);
      expect(actionsCell).not.toHaveAttribute("headers");
    });

    it("dispatches cell events for a data cell but not an empty cell", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(DataTable, { props: { headers, rows } });

      const [nameCell, actionsCell] = within(getBodyRows()[0]).getAllByRole(
        "cell",
      );

      consoleLog.mockClear();
      await user.click(actionsCell);
      expect(clickEvents(consoleLog)).toEqual(["click", "click:row"]);

      consoleLog.mockClear();
      await user.click(nameCell);
      expect(clickEvents(consoleLog)).toEqual([
        "click",
        "click:cell",
        "click",
        "click:row",
      ]);
    });
  });
});
