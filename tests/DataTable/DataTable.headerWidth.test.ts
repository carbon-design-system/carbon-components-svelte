import { render } from "@testing-library/svelte";
import { expectInlineStyle } from "../utils/inline-style";
import DataTable from "./DataTable.test.svelte";

describe("DataTable header width", () => {
  const headers = [
    { key: "name", value: "Name", width: "200px" },
    { key: "status", value: "Status" },
  ] as const;

  const rows = [{ id: "a", name: "payments-api", status: "Active" }];

  it("emits a col with the matching width for a sized header", () => {
    const { container } = render(DataTable, { headers, rows });

    const cols = container.querySelectorAll("colgroup col");
    expect(cols).toHaveLength(headers.length);
    expectInlineStyle(cols[0], { width: "200px" });
  });
});
