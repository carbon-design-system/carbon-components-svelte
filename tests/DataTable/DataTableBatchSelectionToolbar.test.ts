import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../setup-tests";
import DataTableBatchSelectionToolbar from "./DataTableBatchSelectionToolbar.test.svelte";

describe("DataTableBatchSelectionToolbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders toolbar when rows are selected", async () => {
    const { container } = render(DataTableBatchSelectionToolbar, {
      props: {
        selectedRowIds: ["a", "b"],
      },
    });

    // Verify toolbar is visible
    const toolbar = container.querySelector(".bx--batch-actions");
    expect(toolbar).toBeInTheDocument();
    expect(toolbar).toHaveClass("bx--batch-actions--active");

    // Verify selected count is displayed
    expect(screen.getByText("2 items selected")).toBeInTheDocument();
  });

  it("hides toolbar when no rows are selected", () => {
    const { container } = render(DataTableBatchSelectionToolbar, {
      props: {
        selectedRowIds: [],
      },
    });

    // Verify toolbar is not visible
    const toolbar = container.querySelector(".bx--batch-actions");
    expect(toolbar).not.toHaveClass("bx--batch-actions--active");
  });

  it("handles cancel action", async () => {
    const { component } = render(DataTableBatchSelectionToolbar, {
      props: {
        selectedRowIds: ["a", "b"],
      },
    });

    // Click cancel button
    const cancelButton = screen.getByText("Cancel");
    await user.click(cancelButton);

    // Verify selected rows are cleared
    expect(component.$$.ctx[component.$$.props.selectedRowIds]).toEqual([]);
  });

  it("handles custom batch actions", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(DataTableBatchSelectionToolbar, {
      props: {
        selectedRowIds: ["a", "b"],
      },
    });

    // Click custom action button
    const actionButton = screen.getByText("Delete");
    await user.click(actionButton);

    // Verify action was triggered
    expect(consoleLog).toHaveBeenCalledWith("delete", ["a", "b"]);
  });

  it("handles controlled active state", async () => {
    const { container, component } = render(DataTableBatchSelectionToolbar, {
      props: {
        selectedRowIds: ["a", "b"],
        active: false,
      },
    });

    // Verify toolbar is not active despite selected rows
    const toolbar = container.querySelector(".bx--batch-actions");
    expect(toolbar).not.toHaveClass("bx--batch-actions--active");

    // Update active state
    component.$set({ active: true });
    await tick();

    // Verify toolbar is now active
    expect(toolbar).toHaveClass("bx--batch-actions--active");
  });

  it("prevents default cancel behavior when controlled", async () => {
    const { component } = render(DataTableBatchSelectionToolbar, {
      props: {
        selectedRowIds: ["a", "b"],
        active: true,
        controlled: true,
      },
    });

    // Click cancel button
    const cancelButton = screen.getByText("Cancel");
    await user.click(cancelButton);

    // Verify selected rows are not cleared
    expect(component.$$.ctx[component.$$.props.selectedRowIds]).toEqual([
      "a",
      "b",
    ]);
  });

  it("handles multiple batch actions", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(DataTableBatchSelectionToolbar, {
      props: {
        selectedRowIds: ["a", "b"],
      },
    });

    // Click first action button
    const deleteButton = screen.getByText("Delete");
    await user.click(deleteButton);
    expect(consoleLog).toHaveBeenCalledWith("delete", ["a", "b"]);

    // Click second action button
    const restartButton = screen.getByText("Restart");
    await user.click(restartButton);
    expect(consoleLog).toHaveBeenCalledWith("restart", ["a", "b"]);
  });

  it("updates selected count when selection changes", async () => {
    const { component } = render(DataTableBatchSelectionToolbar, {
      props: {
        selectedRowIds: ["a"],
      },
    });

    // Verify initial count
    expect(screen.getByText("1 item selected")).toBeInTheDocument();

    // Update selection
    component.$set({ selectedRowIds: ["a", "b", "c"] });
    await tick();

    // Verify updated count
    expect(screen.getByText("3 items selected")).toBeInTheDocument();
  });

  it("handles keyboard navigation", async () => {
    render(DataTableBatchSelectionToolbar, {
      props: {
        selectedRowIds: ["a", "b"],
      },
    });

    // Focus cancel button
    const cancelButton = screen.getByText("Cancel");
    cancelButton.focus();

    // Press tab to move to next action
    await user.keyboard("{Tab}");
    expect(screen.getByText("Create balancer")).toHaveFocus();

    // Press tab again to move to next action
    await user.keyboard("{Tab}");
    expect(
      screen.getByRole("checkbox", { name: "Select all rows" }),
    ).toHaveFocus();
  });

  it("applies inert to batch actions when no rows are selected", () => {
    const { container } = render(DataTableBatchSelectionToolbar, {
      props: {
        selectedRowIds: [],
      },
    });

    const batchActions = container.querySelector(".bx--batch-actions");
    expect(batchActions).toHaveAttribute("inert");
  });

  it("removes inert from batch actions when rows are selected", () => {
    const { container } = render(DataTableBatchSelectionToolbar, {
      props: {
        selectedRowIds: ["a", "b"],
      },
    });

    const batchActions = container.querySelector(".bx--batch-actions");
    expect(batchActions).not.toHaveAttribute("inert");
  });

  it("applies inert to toolbar content when rows are selected", async () => {
    const { container } = render(DataTableBatchSelectionToolbar, {
      props: {
        selectedRowIds: ["a", "b"],
      },
    });

    const toolbarContent = container.querySelector(".bx--toolbar-content");
    expect(toolbarContent).toHaveAttribute("inert");
  });

  it("removes inert from toolbar content when no rows are selected", () => {
    const { container } = render(DataTableBatchSelectionToolbar, {
      props: {
        selectedRowIds: [],
      },
    });

    const toolbarContent = container.querySelector(".bx--toolbar-content");
    expect(toolbarContent).not.toHaveAttribute("inert");
  });

  it("toggles inert attributes when selection changes", async () => {
    const { container, component } = render(DataTableBatchSelectionToolbar, {
      props: {
        selectedRowIds: [],
      },
    });

    const batchActions = container.querySelector(".bx--batch-actions");
    const toolbarContent = container.querySelector(".bx--toolbar-content");

    expect(batchActions).toHaveAttribute("inert");
    expect(toolbarContent).not.toHaveAttribute("inert");

    component.$set({ selectedRowIds: ["a", "b"] });
    await tick();

    expect(batchActions).not.toHaveAttribute("inert");
    expect(toolbarContent).toHaveAttribute("inert");

    component.$set({ selectedRowIds: [] });
    await tick();

    expect(batchActions).toHaveAttribute("inert");
    expect(toolbarContent).not.toHaveAttribute("inert");
  });
});
