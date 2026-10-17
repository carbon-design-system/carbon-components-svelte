import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import TableContainerWithTable from "./TableContainerWithTable.test.svelte";
import TableSubComponents from "./TableSubComponents.test.svelte";

describe("Table Sub-Components", () => {
  describe("Table", () => {
    it("labels a Table nested in a standalone TableContainer via context", () => {
      render(TableContainerWithTable, {
        props: { title: "Container Title", description: "Container Desc" },
      });

      const table = screen.getByRole("table");

      const labelledbyId = table.getAttribute("aria-labelledby");
      assert(labelledbyId);
      expect(document.getElementById(labelledbyId)).toHaveTextContent(
        "Container Title",
      );

      const describedbyId = table.getAttribute("aria-describedby");
      assert(describedbyId);
      expect(document.getElementById(describedbyId)).toHaveTextContent(
        "Container Desc",
      );
    });

    it("describes a Table by a TableContainer description without a title", () => {
      const { container } = render(TableContainerWithTable, {
        props: { title: "", description: "Container Desc" },
      });

      const table = screen.getByRole("table");
      expect(screen.getByText("Container Desc")).toBeInTheDocument();

      const describedbyId = table.getAttribute("aria-describedby");
      assert(describedbyId);
      expect(document.getElementById(describedbyId)).toHaveTextContent(
        "Container Desc",
      );
      expect(table).not.toHaveAttribute("aria-labelledby");
      expect(
        container.querySelector(".bx--data-table-header__title"),
      ).not.toBeInTheDocument();
    });

    it("omits the description paragraph for a TableContainer title alone", () => {
      const { container } = render(TableContainerWithTable, {
        props: { title: "Container Title", description: "" },
      });

      const table = screen.getByRole("table");
      expect(
        container.querySelector(".bx--data-table-header__description"),
      ).not.toBeInTheDocument();
      expect(table).not.toHaveAttribute("aria-describedby");

      const labelledbyId = table.getAttribute("aria-labelledby");
      assert(labelledbyId);
      expect(document.getElementById(labelledbyId)).toHaveTextContent(
        "Container Title",
      );
    });

    it("renders no TableContainer header without a title or description", () => {
      const { container } = render(TableContainerWithTable, {
        props: { title: "", description: "" },
      });

      expect(
        container.querySelector(".bx--data-table-header"),
      ).not.toBeInTheDocument();
    });

    it("should handle sortable prop", () => {
      const { container } = render(TableSubComponents, {
        props: { testComponent: "Table", sortable: true },
      });

      const table = container.querySelector("table");
      expect(table).toHaveClass("bx--data-table--sort");
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

  describe("TableFoot", () => {
    it("should render as tfoot element", () => {
      const { container } = render(TableSubComponents, {
        props: { testComponent: "TableFoot", slotContent: "Foot content" },
      });

      const tfoot = container.querySelector("tfoot");
      expect(tfoot).toBeInTheDocument();
      expect(screen.getByText("Foot content")).toBeInTheDocument();
    });

    it("should apply custom attributes", () => {
      const { container } = render(TableSubComponents, {
        props: {
          testComponent: "TableFoot",
          "data-testid": "custom-tfoot",
        },
      });

      const tfoot = container.querySelector(
        "tfoot[data-testid='custom-tfoot']",
      );
      expect(tfoot).toBeInTheDocument();
    });
  });

  describe("TableContainer", () => {
    it("should handle stickyHeader prop", () => {
      const { container } = render(TableSubComponents, {
        props: { testComponent: "TableContainer", stickyHeader: true },
      });

      const div = container.querySelector(".bx--data-table-container");
      expect(div).toHaveClass("bx--data-table--max-width");
    });
  });
});
