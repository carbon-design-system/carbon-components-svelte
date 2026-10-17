import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import DataTableBatchSelectionToolbar from "./DataTableBatchSelectionToolbar.test.svelte";
import DataTableToolbarNoBatch from "./DataTableToolbarNoBatch.test.svelte";
import { getSelectAll } from "./helpers";

describe("DataTableBatchSelectionToolbar", () => {
  it("renders toolbar when rows are selected", () => {
    const { container } = render(DataTableBatchSelectionToolbar, {
      props: {
        selectedRowIds: ["a", "b"],
      },
    });

    const toolbar = container.querySelector(".bx--batch-actions");
    expect(toolbar).toBeInTheDocument();
    expect(toolbar).toHaveClass("bx--batch-actions--active");

    expect(screen.getByText("2 items selected")).toBeInTheDocument();
  });

  it("hides toolbar when no rows are selected", () => {
    const { container } = render(DataTableBatchSelectionToolbar, {
      props: {
        selectedRowIds: [],
      },
    });

    const toolbar = container.querySelector(".bx--batch-actions");
    expect(toolbar).not.toHaveClass("bx--batch-actions--active");
  });

  it("unchecks the select-all checkbox after cancel", async () => {
    render(DataTableBatchSelectionToolbar, {
      props: {
        selectedRowIds: ["a", "b", "c", "d", "e", "f"],
      },
    });

    const selectAll = getSelectAll();
    expect(selectAll).toBeChecked();

    await user.click(screen.getByText("Cancel"));
    await tick();

    expect(selectAll).not.toBeChecked();
    expect(screen.getByTestId("selected-ids").textContent).toBe("[]");
  });

  it("handles controlled active state", async () => {
    const { container, rerender } = render(DataTableBatchSelectionToolbar, {
      props: {
        selectedRowIds: ["a", "b"],
        active: false,
      },
    });

    const toolbar = container.querySelector(".bx--batch-actions");
    expect(toolbar).not.toHaveClass("bx--batch-actions--active");

    await rerender({ active: true });

    expect(toolbar).toHaveClass("bx--batch-actions--active");
  });

  it("does not silently flip controlled active=false back to true when rows are selected", async () => {
    const { container, rerender } = render(DataTableBatchSelectionToolbar, {
      props: {
        selectedRowIds: [],
        active: false,
      },
    });

    await rerender({ selectedRowIds: ["a", "b"], active: false });

    const toolbar = container.querySelector(".bx--batch-actions");
    expect(toolbar).not.toHaveClass("bx--batch-actions--active");
  });

  it("prevents default cancel behavior when controlled", async () => {
    render(DataTableBatchSelectionToolbar, {
      props: {
        selectedRowIds: ["a", "b"],
        active: true,
        controlled: true,
      },
    });

    const cancelButton = screen.getByText("Cancel");
    await user.click(cancelButton);
    await tick();

    const selectedIdsElement = screen.getByTestId("selected-ids");
    expect(selectedIdsElement.textContent).toBe('["a","b"]');
  });

  it("handles multiple batch actions", async () => {
    const ondelete = vi.fn();
    const onrestart = vi.fn();
    render(DataTableBatchSelectionToolbar, {
      props: {
        selectedRowIds: ["a", "b"],
        ondelete,
        onrestart,
      },
    });

    await user.click(screen.getByText("Delete"));
    expect(ondelete).toHaveBeenCalledExactlyOnceWith(["a", "b"]);

    await user.click(screen.getByText("Restart"));
    expect(onrestart).toHaveBeenCalledExactlyOnceWith(["a", "b"]);
  });

  it("updates selected count when selection changes", async () => {
    const { rerender } = render(DataTableBatchSelectionToolbar, {
      props: {
        selectedRowIds: ["a"],
      },
    });

    expect(screen.getByText("1 item selected")).toBeInTheDocument();

    await rerender({ selectedRowIds: ["a", "b", "c"] });

    expect(screen.getByText("3 items selected")).toBeInTheDocument();
  });

  it("announces the selection count via a live region", () => {
    const { container } = render(DataTableBatchSelectionToolbar, {
      props: {
        selectedRowIds: ["a", "b"],
      },
    });

    const summary = container.querySelector(".bx--batch-summary__para");
    expect(summary).toHaveAttribute("aria-live", "polite");
    expect(summary).toHaveAttribute("aria-atomic", "true");
  });

  it("moves focus off the bar when Cancel closes it via the keyboard", async () => {
    const { container } = render(DataTableBatchSelectionToolbar, {
      props: {
        selectedRowIds: ["a", "b"],
      },
    });

    const cancelButton = screen.getByText("Cancel");
    cancelButton.focus();
    await user.keyboard("{Enter}");
    await tick();

    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toBe(
      container.querySelector(".bx--table-toolbar"),
    );
  });

  it("leaves focus where an action handler moved it after closing the bar", async () => {
    render(DataTableBatchSelectionToolbar, {
      props: { selectedRowIds: ["a", "b"], moveFocusOnDelete: true },
    });

    screen.getByText("Delete").focus();
    await user.keyboard("{Enter}");
    await tick();
    await tick();

    expect(screen.getByRole("textbox", { name: "Elsewhere" })).toHaveFocus();
  });

  it("should label each row selection checkbox", () => {
    const { container } = render(DataTableBatchSelectionToolbar, {
      props: { selectedRowIds: [] },
    });

    const rowCheckboxes = container.querySelectorAll(
      'td input[type="checkbox"]',
    );
    expect(rowCheckboxes.length).toBeGreaterThan(0);
    for (const checkbox of rowCheckboxes) {
      const label = container.querySelector(`label[for="${checkbox.id}"]`);
      const hasAccessibleName =
        checkbox.getAttribute("aria-label") ||
        label?.getAttribute("aria-label") ||
        label?.textContent?.trim();
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  it("toggles inert attributes when selection changes", async () => {
    const { container, rerender } = render(DataTableBatchSelectionToolbar, {
      props: {
        selectedRowIds: [],
      },
    });

    const batchActions = container.querySelector(".bx--batch-actions");
    const toolbarContent = container.querySelector(".bx--toolbar-content");

    expect(batchActions).toHaveAttribute("inert");
    expect(toolbarContent).not.toHaveAttribute("inert");

    await rerender({ selectedRowIds: ["a", "b"] });

    expect(batchActions).not.toHaveAttribute("inert");
    expect(toolbarContent).toHaveAttribute("inert");

    await rerender({ selectedRowIds: [] });

    expect(batchActions).toHaveAttribute("inert");
    expect(toolbarContent).not.toHaveAttribute("inert");
  });
});

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
