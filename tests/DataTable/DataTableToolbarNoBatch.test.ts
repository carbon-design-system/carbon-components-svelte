import { render, screen } from "@testing-library/svelte";
import DataTableToolbarNoBatch from "./DataTableToolbarNoBatch.test.svelte";

// Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/2404
describe("DataTable toolbar without batch actions", () => {
  it("toolbar content should not be inert when rows are selected without batch actions", () => {
    const { container } = render(DataTableToolbarNoBatch, {
      props: {
        selectedRowIds: ["a"],
      },
    });

    const toolbarContent = container.querySelector(".bx--toolbar-content");
    expect(toolbarContent).not.toHaveAttribute("inert");
  });

  it("toolbar controls should not sit inside an inert subtree when rows are selected without batch actions", () => {
    render(DataTableToolbarNoBatch, {
      props: {
        selectedRowIds: ["a"],
      },
    });

    // jsdom does not enforce `inert`, so click and focus checks cannot fail.
    // Check every ancestor of the controls instead.
    expect(screen.getByText("Action").closest("[inert]")).toBeNull();
    expect(screen.getByRole("searchbox").closest("[inert]")).toBeNull();
  });
});
