import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../setup-tests";
import Snippets from "./Snippets.test.svelte";

describe("Svelte 5 Snippets", () => {
  describe("DataTable expandIcon", () => {
    it("should render custom expand icon via expandIcon snippet with expanded, row, and props", async () => {
      const { container } = render(Snippets);

      const datatable = screen.getByTestId(
        "datatable-expand-icon-snippet-container",
      );
      expect(datatable).toBeInTheDocument();

      const customIcons = screen.getAllByTestId(
        "datatable-expand-icon-snippet",
      );
      expect(customIcons.length).toBeGreaterThanOrEqual(2);

      const firstExpandButton = screen.getAllByRole("button", {
        name: /expand/i,
      })[0];
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
    });
  });

  describe("Dropdown", () => {
    it("should render snippet with item and index arguments", async () => {
      render(Snippets);

      const dropdown = screen.getByTestId("dropdown-snippet");
      expect(dropdown).toBeInTheDocument();

      const button = dropdown.querySelector("button");
      expect.assert(button);
      await user.click(button);

      const item0 = screen.getByTestId("dropdown-item-0");
      const item1 = screen.getByTestId("dropdown-item-1");
      const item2 = screen.getByTestId("dropdown-item-2");

      expect(item0).toHaveTextContent("Option 1 (#0)");
      expect(item1).toHaveTextContent("Option 2 (#1)");
      expect(item2).toHaveTextContent("Option 3 (#2)");
    });
  });

  describe("Dropdown labelChildren", () => {
    it("should render labelChildren slot", () => {
      render(Snippets);

      const customLabel = screen.getByTestId("dropdown-custom-label");
      expect(customLabel).toBeInTheDocument();
      expect(customLabel).toHaveTextContent("Custom label content");
    });
  });

  describe("ComboBox", () => {
    it("should render snippet with item and index arguments", async () => {
      render(Snippets);

      const inputs = screen.getAllByRole("combobox");
      const comboboxInput = inputs[0];
      expect(comboboxInput).toBeInTheDocument();

      await user.click(comboboxInput);

      const item0 = screen.getByTestId("combobox-item-0");
      const item1 = screen.getByTestId("combobox-item-1");
      const item2 = screen.getByTestId("combobox-item-2");

      expect(item0).toHaveTextContent("Option 1 - index 0");
      expect(item1).toHaveTextContent("Option 2 - index 1");
      expect(item2).toHaveTextContent("Option 3 - index 2");
    });
  });

  describe("Button", () => {
    it("should render snippet with props argument when using 'as' prop", () => {
      render(Snippets);

      const customButton = screen.getByTestId("custom-button");
      expect(customButton).toBeInTheDocument();
      expect(customButton).toHaveTextContent("Custom Button Element");

      expect(customButton.tagName).toBe("DIV");
      expect(customButton).toHaveClass("bx--btn");
    });
  });

  describe("Theme", () => {
    it("should render snippet with theme argument", () => {
      render(Snippets);

      const themeValue = screen.getByTestId("theme-value");
      expect(themeValue).toBeInTheDocument();

      expect(themeValue).toHaveTextContent("Current theme:");
      expect(themeValue.textContent).toMatch(
        /Current theme: (white|g10|g80|g90|g100)/,
      );
    });
  });

  describe("Tabs secondary label", () => {
    it("should render container tabs with secondary label via prop", () => {
      render(Snippets);

      const tabsContainer = screen.getByTestId("tabs-secondary-label-snippet");
      expect(tabsContainer).toBeInTheDocument();
      expect(tabsContainer).toHaveClass("bx--tabs--container");
      expect(tabsContainer).toHaveClass("bx--tabs--tall");

      expect(screen.getByText("(21/25)")).toBeInTheDocument();
    });

    it("should render secondary label via secondaryChildren snippet", () => {
      render(Snippets);

      const snippetContent = screen.getByTestId("tab-secondary-label-snippet");
      expect(snippetContent).toBeInTheDocument();
      expect(snippetContent).toHaveTextContent("(12/16)");
    });

    it("should switch content when clicking tab with secondary label snippet", async () => {
      render(Snippets);

      const analyzeTab = screen.getByRole("tab", { name: /Analyze/ });
      await user.click(analyzeTab);

      expect(analyzeTab).toHaveAttribute("aria-selected", "true");
      expect(screen.getByText("Analyze content")).toBeVisible();
    });
  });
});
