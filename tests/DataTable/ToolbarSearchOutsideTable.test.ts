import { render, screen } from "@testing-library/svelte";
import ToolbarSearch from "carbon-components-svelte/DataTable/ToolbarSearch.svelte";

describe("ToolbarSearch outside a DataTable", () => {
  it("renders with shouldFilterRows without throwing", () => {
    expect(() =>
      render(ToolbarSearch, { shouldFilterRows: true }),
    ).not.toThrow();
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });
});
