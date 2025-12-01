import { render, screen } from "@testing-library/svelte";
import Toolbar from "./Toolbar.test.svelte";

describe("DataTable Toolbar", () => {
  describe("Toolbar", () => {
    it("should render with default props", () => {
      const { container } = render(Toolbar, {
        props: { testComponent: "Toolbar", slotContent: "Toolbar content" },
      });

      const toolbar = container.querySelector(".bx--table-toolbar");
      expect(toolbar).toBeInTheDocument();
      expect(toolbar?.tagName).toBe("SECTION");
      expect(toolbar).toHaveAttribute("aria-label", "data table toolbar");
    });

    it("should handle default size", () => {
      const { container } = render(Toolbar, {
        props: { testComponent: "Toolbar", size: "default" },
      });

      const toolbar = container.querySelector(".bx--table-toolbar");
      expect(toolbar).toHaveClass("bx--table-toolbar--normal");
      expect(toolbar).not.toHaveClass("bx--table-toolbar--small");
    });

    it("should handle small size", () => {
      const { container } = render(Toolbar, {
        props: { testComponent: "Toolbar", size: "sm" },
      });

      const toolbar = container.querySelector(".bx--table-toolbar");
      expect(toolbar).toHaveClass("bx--table-toolbar--small");
      expect(toolbar).not.toHaveClass("bx--table-toolbar--normal");
    });

    it("should have z-index style", () => {
      const { container } = render(Toolbar, {
        props: { testComponent: "Toolbar" },
      });

      const toolbar = container.querySelector(".bx--table-toolbar");
      expect(toolbar).toHaveStyle("z-index: 1");
    });

    it("should render slot content", () => {
      render(Toolbar, {
        props: {
          testComponent: "Toolbar",
          slotContent: "Custom toolbar content",
        },
      });

      expect(screen.getByText("Custom toolbar content")).toBeInTheDocument();
    });

    it("should apply custom attributes", () => {
      const { container } = render(Toolbar, {
        props: {
          testComponent: "Toolbar",
          "data-testid": "custom-toolbar",
        },
      });

      const toolbar = container.querySelector("[data-testid='custom-toolbar']");
      expect(toolbar).toBeInTheDocument();
    });
  });

  describe("ToolbarContent", () => {
    it("should render with default props", () => {
      const { container } = render(Toolbar, {
        props: { testComponent: "ToolbarContent", slotContent: "Content" },
      });

      const content = container.querySelector(".bx--toolbar-content");
      expect(content).toBeInTheDocument();
      expect(content?.tagName).toBe("DIV");
    });

    it("should render slot content", () => {
      render(Toolbar, {
        props: {
          testComponent: "ToolbarContent",
          slotContent: "Toolbar content text",
        },
      });

      expect(screen.getByText("Toolbar content text")).toBeInTheDocument();
    });
  });

  describe("ToolbarBatchActions", () => {
    it("should render in standalone mode with selectedIds", () => {
      const { container } = render(Toolbar, {
        props: {
          testComponent: "ToolbarBatchActions",
          selectedIds: [1, 2, 3],
        },
      });

      const batchActions = container.querySelector(".bx--batch-actions");
      expect(batchActions).toBeInTheDocument();
      expect(batchActions).toHaveClass("bx--batch-actions--active");
    });

    it("should display correct count of selected items", () => {
      render(Toolbar, {
        props: {
          testComponent: "ToolbarBatchActions",
          selectedIds: [1, 2, 3],
        },
      });

      expect(screen.getByText("3 items selected")).toBeInTheDocument();
    });

    it("should display singular form for one item", () => {
      render(Toolbar, {
        props: {
          testComponent: "ToolbarBatchActions",
          selectedIds: [1],
        },
      });

      expect(screen.getByText("1 item selected")).toBeInTheDocument();
    });

    it("should not be active when selectedIds is empty", () => {
      const { container } = render(Toolbar, {
        props: {
          testComponent: "ToolbarBatchActions",
          selectedIds: [],
        },
      });

      const batchActions = container.querySelector(".bx--batch-actions");
      expect(batchActions).not.toHaveClass("bx--batch-actions--active");
    });

    it("should be active when active prop is true", () => {
      const { container } = render(Toolbar, {
        props: {
          testComponent: "ToolbarBatchActions",
          selectedIds: [],
          active: true,
        },
      });

      const batchActions = container.querySelector(".bx--batch-actions");
      expect(batchActions).toHaveClass("bx--batch-actions--active");
    });

    it("should render cancel button", () => {
      render(Toolbar, {
        props: {
          testComponent: "ToolbarBatchActions",
          selectedIds: [1, 2],
        },
      });

      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("should render custom cancel button text", () => {
      render(Toolbar, {
        props: {
          testComponent: "ToolbarBatchActions",
          selectedIds: [1, 2],
          slotContent: "Custom cancel",
        },
      });

      expect(screen.getByText("Custom cancel")).toBeInTheDocument();
    });

    it("should dispatch cancel event when cancel button is clicked", () => {
      let cancelFired = false;
      render(Toolbar, {
        props: {
          testComponent: "ToolbarBatchActions",
          selectedIds: [1, 2],
          oncancel: () => {
            cancelFired = true;
          },
        },
      });

      const cancelButton = screen.getByText("Cancel");

      cancelButton.click();
      expect(cancelFired).toBe(true);
    });
  });
});
