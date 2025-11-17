import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import TableSubComponents from "./TableSubComponents.test.svelte";

describe("Table Sub-Components", () => {
  describe("Table", () => {
    it("should render with default props", () => {
      const { container } = render(TableSubComponents, {
        props: { testComponent: "Table", slotContent: "Content" },
      });

      const table = container.querySelector("table");
      expect(table).toBeInTheDocument();
      expect(table).toHaveClass("bx--data-table");
    });

    it("should handle size variants", () => {
      const sizes = ["compact", "short", "medium", "tall"] as const;

      for (const size of sizes) {
        const { container, unmount } = render(TableSubComponents, {
          props: { testComponent: "Table", size },
        });

        const table = container.querySelector("table");
        const expectedClass =
          size === "medium" ? "bx--data-table--md" : `bx--data-table--${size}`;
        expect(table).toHaveClass(expectedClass);
        unmount();
      }
    });

    it("should handle zebra prop", () => {
      const { container } = render(TableSubComponents, {
        props: { testComponent: "Table", zebra: true },
      });

      const table = container.querySelector("table");
      expect(table).toHaveClass("bx--data-table--zebra");
    });

    it("should handle useStaticWidth prop", () => {
      const { container } = render(TableSubComponents, {
        props: { testComponent: "Table", useStaticWidth: true },
      });

      const table = container.querySelector("table");
      expect(table).toHaveClass("bx--data-table--static");
    });

    it("should handle sortable prop", () => {
      const { container } = render(TableSubComponents, {
        props: { testComponent: "Table", sortable: true },
      });

      const table = container.querySelector("table");
      expect(table).toHaveClass("bx--data-table--sort");
    });

    it("should handle stickyHeader prop", () => {
      const { container } = render(TableSubComponents, {
        props: { testComponent: "Table", stickyHeader: true },
      });

      const table = container.querySelector("table");
      expect(table).toHaveClass("bx--data-table--sticky-header");

      const section = container.querySelector("section");
      expect(section).toHaveClass("bx--data-table_inner-container");
    });

    it("should handle tableStyle prop", () => {
      const { container } = render(TableSubComponents, {
        props: { testComponent: "Table", tableStyle: "width: 100%;" },
      });

      const table = container.querySelector("table");
      expect(table).toHaveAttribute("style", "width: 100%;");
    });
  });

  describe("TableBody", () => {
    it("should render as tbody element", () => {
      const { container } = render(TableSubComponents, {
        props: { testComponent: "TableBody", slotContent: "Body content" },
      });

      const tbody = container.querySelector("tbody");
      expect(tbody).toBeInTheDocument();
      expect(tbody).toHaveAttribute("aria-live", "polite");
    });

    it("should apply custom attributes", () => {
      const { container } = render(TableSubComponents, {
        props: {
          testComponent: "TableBody",
          "data-testid": "custom-tbody",
        },
      });

      const tbody = container.querySelector("[data-testid='custom-tbody']");
      expect(tbody).toBeInTheDocument();
    });
  });

  describe("TableCell", () => {
    it("should render as td element", () => {
      const { container } = render(TableSubComponents, {
        props: { testComponent: "TableCell", slotContent: "Cell content" },
      });

      const td = container.querySelector("td");
      expect(td).toBeInTheDocument();
      expect(screen.getByText("Cell content")).toBeInTheDocument();
    });

    it("should handle click events", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { container } = render(TableSubComponents, {
        props: { testComponent: "TableCell", slotContent: "Click me" },
      });

      const td = container.querySelector("td");
      assert(td);
      await user.click(td);
      expect(consoleLog).toHaveBeenCalledWith("click");
    });

    it("should handle mouse events", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { container } = render(TableSubComponents, {
        props: { testComponent: "TableCell", slotContent: "Hover me" },
      });

      const td = container.querySelector("td");
      assert(td);
      await user.hover(td);
      expect(consoleLog).toHaveBeenCalledWith("mouseover");
      expect(consoleLog).toHaveBeenCalledWith("mouseenter");

      await user.unhover(td);
      expect(consoleLog).toHaveBeenCalledWith("mouseleave");
    });
  });

  describe("TableRow", () => {
    it("should render as tr element", () => {
      const { container } = render(TableSubComponents, {
        props: { testComponent: "TableRow", slotContent: "Row content" },
      });

      const tr = container.querySelector("tr");
      expect(tr).toBeInTheDocument();
    });

    it("should handle click events", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { container } = render(TableSubComponents, {
        props: { testComponent: "TableRow", slotContent: "Click row" },
      });

      const tr = container.querySelector("tr");
      assert(tr);
      await user.click(tr);
      expect(consoleLog).toHaveBeenCalledWith("click");
    });

    it("should handle mouse events", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { container } = render(TableSubComponents, {
        props: { testComponent: "TableRow", slotContent: "Hover row" },
      });

      const tr = container.querySelector("tr");
      assert(tr);
      await user.hover(tr);
      expect(consoleLog).toHaveBeenCalledWith("mouseover");
      expect(consoleLog).toHaveBeenCalledWith("mouseenter");

      await user.unhover(tr);
      expect(consoleLog).toHaveBeenCalledWith("mouseleave");
    });
  });

  describe("TableHead", () => {
    it("should render as thead element", () => {
      const { container } = render(TableSubComponents, {
        props: { testComponent: "TableHead", slotContent: "Head content" },
      });

      const thead = container.querySelector("thead");
      expect(thead).toBeInTheDocument();
    });

    it("should handle click events", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { container } = render(TableSubComponents, {
        props: { testComponent: "TableHead", slotContent: "Click head" },
      });

      const thead = container.querySelector("thead");
      assert(thead);
      await user.click(thead);
      expect(consoleLog).toHaveBeenCalledWith("click");
    });

    it("should handle mouse events", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { container } = render(TableSubComponents, {
        props: { testComponent: "TableHead", slotContent: "Hover head" },
      });

      const thead = container.querySelector("thead");
      assert(thead);
      await user.hover(thead);
      expect(consoleLog).toHaveBeenCalledWith("mouseover");
      expect(consoleLog).toHaveBeenCalledWith("mouseenter");

      await user.unhover(thead);
      expect(consoleLog).toHaveBeenCalledWith("mouseleave");
    });
  });

  describe("TableContainer", () => {
    it("should render with default props", () => {
      const { container } = render(TableSubComponents, {
        props: { testComponent: "TableContainer", slotContent: "Content" },
      });

      const div = container.querySelector(".bx--data-table-container");
      expect(div).toBeInTheDocument();
    });

    it("should render title and description", () => {
      render(TableSubComponents, {
        props: {
          testComponent: "TableContainer",
          title: "Table Title",
          description: "Table description",
        },
      });

      expect(screen.getByText("Table Title")).toBeInTheDocument();
      expect(screen.getByText("Table description")).toBeInTheDocument();
    });

    it("should not render header when title is empty", () => {
      const { container } = render(TableSubComponents, {
        props: { testComponent: "TableContainer", title: "" },
      });

      const header = container.querySelector(".bx--data-table-header");
      expect(header).not.toBeInTheDocument();
    });

    it("should handle useStaticWidth prop", () => {
      const { container } = render(TableSubComponents, {
        props: { testComponent: "TableContainer", useStaticWidth: true },
      });

      const div = container.querySelector(".bx--data-table-container");
      expect(div).toHaveClass("bx--data-table-container--static");
    });

    it("should handle stickyHeader prop", () => {
      const { container } = render(TableSubComponents, {
        props: { testComponent: "TableContainer", stickyHeader: true },
      });

      const div = container.querySelector(".bx--data-table-container");
      expect(div).toHaveClass("bx--data-table--max-width");
    });
  });
});
