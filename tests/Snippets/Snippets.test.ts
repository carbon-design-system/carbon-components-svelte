import { render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import Snippets from "./Snippets.test.svelte";

/** Renders the fixture and clicks the trigger button inside `testid`. */
const openDropdown = async (testid: string) => {
  render(Snippets);
  const button = screen.getByTestId(testid).querySelector("button");
  if (!button) throw new Error("expected dropdown trigger button");
  await user.click(button);
};

describe("Svelte 5 Snippets", () => {
  describe("DataTable expandIcon", () => {
    it("should render custom expand icon via expandIcon snippet with expanded, row, and props", async () => {
      const { container } = render(Snippets);

      screen.getByTestId("datatable-expand-icon-snippet-container");

      const customIcons = screen.getAllByTestId(
        "datatable-expand-icon-snippet",
      );
      expect(customIcons.length).toBeGreaterThanOrEqual(2);

      const firstExpandButton = screen.getAllByRole("button", {
        name: /expand/i,
      })[0];
      expect(
        container.querySelector(".bx--child-row-inner-container"),
      ).toBeNull();
      expect(screen.queryByText(/"name": "Load Balancer 1"/)).toBeNull();

      const iconInButton = within(firstExpandButton).getByTestId(
        "datatable-expand-icon-snippet",
      );
      expect(iconInButton).toHaveAttribute("data-expanded", "false");

      await user.click(firstExpandButton);

      expect(iconInButton).toHaveAttribute("data-expanded", "true");

      const expandedContent = container.querySelector(
        ".bx--child-row-inner-container",
      );
      expect(expandedContent).toBeInTheDocument();
      // The expandedRow snippet receives the row and renders it as JSON.
      expect(expandedContent?.querySelector("pre")).toHaveTextContent(
        /"name": "Load Balancer 1"/,
      );
      expect(screen.queryByText(/"name": "Load Balancer 2"/)).toBeNull();
    });
  });

  describe("TagInput", () => {
    it("should render the tag snippet with tag, index, and props", async () => {
      render(Snippets);

      const first = screen.getByTestId("tag-input-tag-0");
      expect(first).toHaveTextContent("alpha");
      expect(first).toHaveClass("bx--tag--teal", "bx--tag--filter");

      await user.click(within(first).getByRole("button"));
      expect(screen.getByTestId("tag-input-tag-0")).toHaveTextContent("beta");
      expect(screen.queryByTestId("tag-input-tag-1")).not.toBeInTheDocument();
    });
  });

  describe("MultiSelect", () => {
    it("should render the tag snippet with item, index, and props", async () => {
      render(Snippets);

      const first = screen.getByTestId("multiselect-tag-0");
      expect(first).toHaveTextContent("Option 1");
      expect(first).toHaveClass("bx--tag--teal", "bx--tag--filter");
      expect(screen.getByTestId("multiselect-tag-1")).toHaveTextContent(
        "Option 3",
      );

      await user.click(within(first).getByRole("button"));
      expect(screen.queryByTestId("multiselect-tag-1")).not.toBeInTheDocument();
    });
  });

  describe("item and index snippet arguments", () => {
    it.each([
      {
        name: "Dropdown",
        open: () => openDropdown("dropdown-snippet"),
        prefix: "dropdown-item",
        texts: ["Option 1 (#0)", "Option 2 (#1)", "Option 3 (#2)"],
        // items have ids "1","2","3"; selectedId="1" -> index 0
        selectedIndex: 0,
      },
      {
        name: "ComboBox",
        open: async () => {
          render(Snippets);
          await user.click(screen.getByTestId("combobox-snippet"));
        },
        prefix: "combobox-item",
        texts: [
          "Option 1 - index 0",
          "Option 2 - index 1",
          "Option 3 - index 2",
        ],
        // selectedId="2" -> index 1
        selectedIndex: 1,
      },
    ])("should render $name snippet with item and index", async (row) => {
      await row.open();

      row.texts.forEach((text, index) => {
        const item = screen.getByTestId(`${row.prefix}-${index}`);
        expect(item).toHaveTextContent(text);
        expect(item).toHaveAttribute(
          "data-selected",
          String(index === row.selectedIndex),
        );
      });
    });
  });

  describe("labelChildren", () => {
    it("should render Dropdown labelChildren", () => {
      render(Snippets);

      expect(screen.getByTestId("dropdown-custom-label")).toHaveTextContent(
        "Custom label content",
      );
    });

    it.each([
      {
        name: "IconIndicator",
        indicator: "icon-indicator-label-children",
        custom: "icon-indicator-custom-label",
        replacedLabel: "Succeeded",
      },
      {
        name: "ShapeIndicator",
        indicator: "shape-indicator-label-children",
        custom: "shape-indicator-custom-label",
        replacedLabel: "Stable",
      },
    ])("should render $name labelChildren", (row) => {
      render(Snippets);

      expect(screen.getByTestId(row.custom)).toHaveTextContent(
        "Custom label content",
      );
      expect(screen.getByTestId(row.indicator)).not.toHaveTextContent(
        row.replacedLabel,
      );
    });
  });

  describe("Dropdown icon/iconRight", () => {
    it("should render icon and iconRight snippets with selected", async () => {
      await openDropdown("dropdown-icon-snippets");

      // items have ids "1","2","3"; selectedId="1" is selected
      screen.getByTestId("dropdown-icon-1");
      expect(screen.getByTestId("dropdown-icon-right-1")).toHaveAttribute(
        "data-selected",
        "true",
      );
      expect(screen.getByTestId("dropdown-icon-right-2")).toHaveAttribute(
        "data-selected",
        "false",
      );
    });

    it("should render the iconEnd snippet with selected", async () => {
      await openDropdown("dropdown-icon-end-snippets");

      expect(screen.getByTestId("dropdown-icon-end-1")).toHaveAttribute(
        "data-selected",
        "true",
      );
      expect(screen.getByTestId("dropdown-icon-end-2")).toHaveAttribute(
        "data-selected",
        "false",
      );
    });
  });

  describe("OverflowMenuItem icon/iconRight", () => {
    it("should render icon and iconRight slots as snippets", () => {
      render(Snippets);

      const leftIcon = screen.getByTestId("overflow-item-icon-left");
      expect(
        leftIcon.closest(".bx--overflow-menu-options__option-icon--left"),
      ).toBeInTheDocument();

      const rightIcon = screen.getByTestId("overflow-item-icon-right");
      expect(
        rightIcon.closest(".bx--overflow-menu-options__option-icon--right"),
      ).toBeInTheDocument();
    });
  });

  describe("Theme", () => {
    it("should render snippet with theme argument", () => {
      render(Snippets);

      const themeValue = screen.getByTestId("theme-value");

      expect(themeValue).toHaveTextContent("Current theme:");
      expect(themeValue.textContent).toMatch(
        /Current theme: (white|g10|g80|g90|g100)/,
      );
    });
  });

  describe("ProgressStep icon", () => {
    it("should render icon snippet with complete, current, and invalid arguments", async () => {
      render(Snippets);
      await tick();

      const icon1 = screen.getByTestId("progress-step-icon-1");
      expect(icon1).toHaveAttribute("data-complete", "true");
      expect(icon1).toHaveAttribute("data-current", "false");
      expect(icon1).toHaveAttribute("data-invalid", "false");

      const icon2 = screen.getByTestId("progress-step-icon-2");
      expect(icon2).toHaveAttribute("data-complete", "false");
      expect(icon2).toHaveAttribute("data-current", "true");
      expect(icon2).toHaveAttribute("data-invalid", "false");

      const icon3 = screen.getByTestId("progress-step-icon-3");
      expect(icon3).toHaveAttribute("data-complete", "false");
      expect(icon3).toHaveAttribute("data-current", "false");
      expect(icon3).toHaveAttribute("data-invalid", "true");
    });
  });

  describe("Tabs secondary label", () => {
    it("should render secondary label via secondaryChildren snippet", async () => {
      render(Snippets);
      await tick();

      const snippetContent = screen.getByTestId("tab-secondary-label-snippet");
      expect(snippetContent).toHaveTextContent("(12/16)");
    });
  });

  describe("Dropdown highlighted", () => {
    it("should pass highlighted for the selected item when the menu opens", async () => {
      await openDropdown("dropdown-snippet");

      expect(screen.getByTestId("dropdown-item-0")).toHaveAttribute(
        "data-highlighted",
        "true",
      );
      expect(screen.getByTestId("dropdown-item-1")).toHaveAttribute(
        "data-highlighted",
        "false",
      );
    });

    it("should move highlighted with keyboard navigation", async () => {
      await openDropdown("dropdown-snippet");
      await user.keyboard("{ArrowDown}");

      expect(screen.getByTestId("dropdown-item-1")).toHaveAttribute(
        "data-highlighted",
        "true",
      );
      expect(screen.getByTestId("dropdown-item-0")).toHaveAttribute(
        "data-highlighted",
        "false",
      );
    });
  });

  describe("DataTable cellHeader and footerCell", () => {
    it("should render cellHeader and footerCell snippets with header and index", () => {
      render(Snippets);

      const table = screen.getByTestId("datatable-header-footer-snippets");
      expect(
        within(table).getByTestId("datatable-cell-header-name"),
      ).toHaveTextContent("Header: Name");
      expect(
        within(table).getByTestId("datatable-cell-header-protocol"),
      ).toHaveTextContent("Header: Protocol");
      expect(
        within(table).getByTestId("datatable-footer-cell-0"),
      ).toHaveTextContent("Footer: name");
      expect(
        within(table).getByTestId("datatable-footer-cell-1"),
      ).toHaveTextContent("Footer: protocol");
    });
  });

  describe("HeaderSearch result", () => {
    it("should render the result snippet with result, index, and selected", () => {
      render(Snippets);

      const first = screen.getByTestId("header-search-result-0");
      expect(first).toHaveTextContent("Result: First result");
      expect(first).toHaveAttribute("data-selected", "true");
      expect(screen.getByTestId("header-search-result-1")).toHaveAttribute(
        "data-selected",
        "false",
      );
    });
  });

  describe("Tab children", () => {
    it("should render the children snippet with selected", async () => {
      render(Snippets);

      const overview = screen.getByTestId("tab-children-overview");
      const details = screen.getByTestId("tab-children-details");
      expect(overview).toHaveAttribute("data-selected", "true");
      expect(details).toHaveAttribute("data-selected", "false");

      await user.click(details);

      expect(overview).toHaveAttribute("data-selected", "false");
      expect(details).toHaveAttribute("data-selected", "true");
    });
  });

  describe("TreeView children", () => {
    it("should render the children snippet with node for every node", () => {
      render(Snippets);

      expect(screen.getByTestId("tree-node-parent")).toHaveTextContent(
        "Node: Parent",
      );
      expect(screen.getByTestId("tree-node-parent")).toHaveAttribute(
        "data-expanded",
        "true",
      );
      expect(screen.getByTestId("tree-node-child")).toHaveTextContent(
        "Node: Child",
      );
    });
  });
});
