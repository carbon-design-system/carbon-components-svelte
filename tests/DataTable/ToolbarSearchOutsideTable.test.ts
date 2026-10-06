import { render, screen } from "@testing-library/svelte";
import ToolbarSearch from "carbon-components-svelte/DataTable/ToolbarSearch.svelte";
import { user } from "../utils/user";

describe("ToolbarSearch outside a DataTable", () => {
  it("renders with shouldFilterRows without throwing", () => {
    expect(() =>
      render(ToolbarSearch, { shouldFilterRows: true }),
    ).not.toThrow();
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });

  it("accepts input with a custom shouldFilterRows", async () => {
    render(ToolbarSearch, {
      shouldFilterRows: () => true,
      persistent: true,
    });
    await user.type(screen.getByRole("searchbox"), "abc");

    expect(screen.getByRole("searchbox")).toHaveValue("abc");
  });
});
