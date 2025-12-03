import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
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

  it("toolbar button should be clickable when rows are selected without batch actions", async () => {
    const clickHandler = vi.fn();
    render(DataTableToolbarNoBatch, {
      props: {
        selectedRowIds: ["a"],
      },
    });

    const button = screen.getByText("Action");
    button.addEventListener("click", clickHandler);
    await user.click(button);

    expect(clickHandler).toHaveBeenCalled();
  });

  it("toolbar search should be focusable when rows are selected without batch actions", async () => {
    render(DataTableToolbarNoBatch, {
      props: {
        selectedRowIds: ["a"],
      },
    });

    const searchInput = screen.getByRole("searchbox");
    await user.click(searchInput);

    expect(searchInput).toHaveFocus();
  });
});
