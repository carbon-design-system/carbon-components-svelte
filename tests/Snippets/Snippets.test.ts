import { render, screen, within } from "@testing-library/svelte";
import { user } from "../utils/user";
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
      if (!button) throw new Error("expected dropdown trigger button");
      await user.click(button);

      const item0 = screen.getByTestId("dropdown-item-0");
      const item1 = screen.getByTestId("dropdown-item-1");
      const item2 = screen.getByTestId("dropdown-item-2");

      expect(item0).toHaveTextContent("Option 1 (#0)");
      expect(item1).toHaveTextContent("Option 2 (#1)");
      expect(item2).toHaveTextContent("Option 3 (#2)");

      // items have ids "1","2","3"; selectedId="1" -> index 0 (item0)
      expect(item0).toHaveAttribute("data-selected", "true");
      expect(item1).toHaveAttribute("data-selected", "false");
      expect(item2).toHaveAttribute("data-selected", "false");
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

  describe("IconIndicator labelChildren", () => {
    it("should render labelChildren snippet", () => {
      render(Snippets);

      const indicator = screen.getByTestId("icon-indicator-label-children");
      const customLabel = screen.getByTestId("icon-indicator-custom-label");
      expect(customLabel).toBeInTheDocument();
      expect(customLabel).toHaveTextContent("Custom label content");
      expect(indicator).not.toHaveTextContent("Succeeded");
    });
  });

  describe("Dropdown icon/iconRight", () => {
    it("should render icon and iconRight snippets with selected", async () => {
      render(Snippets);

      const dropdown = screen.getByTestId("dropdown-icon-snippets");
      const button = dropdown.querySelector("button");
      if (!button) throw new Error("expected dropdown trigger button");
      await user.click(button);

      // items have ids "1","2","3"; selectedId="1" is selected
      expect(screen.getByTestId("dropdown-icon-1")).toBeInTheDocument();
      expect(screen.getByTestId("dropdown-icon-right-1")).toHaveAttribute(
        "data-selected",
        "true",
      );
      expect(screen.getByTestId("dropdown-icon-right-2")).toHaveAttribute(
        "data-selected",
        "false",
      );
    });
  });

  describe("ComboBox", () => {
    it("should render snippet with item and index arguments", async () => {
      render(Snippets);

      const comboboxInput = screen.getByTestId("combobox-snippet");
      expect(comboboxInput).toBeInTheDocument();

      await user.click(comboboxInput);

      const item0 = screen.getByTestId("combobox-item-0");
      const item1 = screen.getByTestId("combobox-item-1");
      const item2 = screen.getByTestId("combobox-item-2");

      expect(item0).toHaveTextContent("Option 1 - index 0");
      expect(item1).toHaveTextContent("Option 2 - index 1");
      expect(item2).toHaveTextContent("Option 3 - index 2");

      // items have ids "1","2","3"; selectedId="2" -> index 1 (item1)
      expect(item0).toHaveAttribute("data-selected", "false");
      expect(item1).toHaveAttribute("data-selected", "true");
      expect(item2).toHaveAttribute("data-selected", "false");
    });
  });

  describe("OverflowMenuItem icon/iconRight", () => {
    it("should render icon and iconRight slots as snippets", () => {
      render(Snippets);

      const leftIcon = screen.getByTestId("overflow-item-icon-left");
      expect(leftIcon).toBeInTheDocument();
      expect(
        leftIcon.closest(".bx--overflow-menu-options__option-icon--left"),
      ).toBeInTheDocument();

      const rightIcon = screen.getByTestId("overflow-item-icon-right");
      expect(rightIcon).toBeInTheDocument();
      expect(
        rightIcon.closest(".bx--overflow-menu-options__option-icon--right"),
      ).toBeInTheDocument();
    });
  });

  describe("Button", () => {
    it("should render default slot props when using 'as' prop", () => {
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

  describe("ProgressStep icon", () => {
    it("should render icon snippet with complete, current, and invalid arguments", () => {
      render(Snippets);

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
