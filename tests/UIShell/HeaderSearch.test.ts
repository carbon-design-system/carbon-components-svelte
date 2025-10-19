import { render, screen, fireEvent } from "@testing-library/svelte";
import { user } from "../setup-tests";
import HeaderSearchTest from "./HeaderSearch.test.svelte";

describe("HeaderSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render with default props", () => {
      render(HeaderSearchTest);

      const searchContainer = screen.getByRole("search");
      expect(searchContainer).toHaveClass("bx--header__search");
    });

    it("should render search input", () => {
      render(HeaderSearchTest);

      const searchInput = screen.getByRole("textbox");
      expect(searchInput).toHaveAttribute("placeholder", "Search...");
      expect(searchInput).toHaveAttribute("id", "search-input");
    });

    it("should render search button", () => {
      render(HeaderSearchTest);

      const searchButton = screen.getByRole("button", { name: "Search" });
      expect(searchButton).toHaveAttribute("aria-expanded", "false");
    });

    it("should render clear button when active", () => {
      render(HeaderSearchTest, { props: { active: true } });

      const clearButton = screen.getByRole("button", { name: "Clear search" });
      expect(clearButton).toBeInTheDocument();
    });

    it("should hide clear button when not active", () => {
      render(HeaderSearchTest, { props: { active: false } });

      const clearButton = screen.queryByRole("button", { name: "Clear search" });
      expect(clearButton).toHaveClass("bx--header-search-button--hidden");
    });
  });

  describe("Props", () => {
    it("should bind value prop", () => {
      render(HeaderSearchTest, { props: { value: "test search" } });

      const searchInput = screen.getByRole("textbox");
      expect(searchInput).toHaveValue("test search");
    });

    it("should bind active prop", () => {
      render(HeaderSearchTest, { props: { active: true } });

      const searchContainer = screen.getByRole("search");
      expect(searchContainer).toHaveClass("bx--header__search--active");
    });

    it("should bind selectedResultIndex prop", () => {
      const results = [
        { href: "/1", text: "Result 1" },
        { href: "/2", text: "Result 2" },
        { href: "/3", text: "Result 3" },
      ];
      render(HeaderSearchTest, { props: { results, selectedResultIndex: 1 } });

      const searchInput = screen.getByRole("textbox");
      expect(searchInput).toHaveAttribute("aria-activedescendant", "search-menuitem-1");
    });

    it("should render results when active and results exist", () => {
      const results = [
        { href: "/1", text: "Result 1", description: "Description 1" },
        { href: "/2", text: "Result 2", description: "Description 2" },
      ];
      render(HeaderSearchTest, { props: { active: true, results } });

      const menu = screen.getByRole("menu");
      expect(menu).toBeInTheDocument();
      expect(menu).toHaveAttribute("aria-labelledby", "search-label");

      const menuItems = screen.getAllByRole("menuitem");
      expect(menuItems).toHaveLength(2);
    });

    it("should not render results when not active", () => {
      const results = [
        { href: "/1", text: "Result 1" },
        { href: "/2", text: "Result 2" },
      ];
      render(HeaderSearchTest, { props: { active: false, results } });

      const menu = screen.queryByRole("menu");
      expect(menu).not.toBeInTheDocument();
    });

    it("should not render results when no results", () => {
      render(HeaderSearchTest, { props: { active: true, results: [] } });

      const menu = screen.queryByRole("menu");
      expect(menu).not.toBeInTheDocument();
    });
  });

  describe("Events", () => {
    it("should dispatch active event when activated", async () => {
      render(HeaderSearchTest);

      const searchButton = screen.getByRole("button", { name: "Search" });
      await user.click(searchButton);

      expect(screen.getByTestId("active-event")).toHaveTextContent("true");
    });

    it("should dispatch inactive event when deactivated", async () => {
      render(HeaderSearchTest, { props: { active: true } });

      const searchInput = screen.getByRole("textbox");
      await user.click(searchInput);
      await user.keyboard("{Escape}");

      expect(screen.getByTestId("inactive-event")).toHaveTextContent("true");
    });

    it("should dispatch clear event when clear button is clicked", async () => {
      render(HeaderSearchTest, { props: { active: true, value: "test" } });

      const clearButton = screen.getByRole("button", { name: "Clear search" });
      await user.click(clearButton);

      expect(screen.getByTestId("clear-event")).toHaveTextContent("true");
    });

    it("should dispatch select event when result is selected", async () => {
      const results = [
        { href: "/1", text: "Result 1" },
        { href: "/2", text: "Result 2" },
      ];
      render(HeaderSearchTest, { props: { active: true, results, value: "test" } });

      const firstMenuItem = screen.getByRole("menuitem", { name: "Result 1" });
      await user.click(firstMenuItem);

      const selectEvent = JSON.parse(screen.getByTestId("select-event").textContent || "{}");
      expect(selectEvent).toEqual({
        value: "test",
        selectedResultIndex: 0,
        selectedResult: { href: "/1", text: "Result 1" },
      });
    });
  });

  describe("Keyboard Navigation", () => {
    it("should select result on Enter key", async () => {
      const results = [
        { href: "/1", text: "Result 1" },
        { href: "/2", text: "Result 2" },
      ];
      render(HeaderSearchTest, { props: { active: true, results, value: "test" } });

      const searchInput = screen.getByRole("textbox");
      await user.click(searchInput);
      await user.keyboard("{Enter}");

      const selectEvent = JSON.parse(screen.getByTestId("select-event").textContent || "{}");
      expect(selectEvent.selectedResultIndex).toBe(0);
    });

    it("should navigate down with ArrowDown key", async () => {
      const results = [
        { href: "/1", text: "Result 1" },
        { href: "/2", text: "Result 2" },
        { href: "/3", text: "Result 3" },
      ];
      render(HeaderSearchTest, { props: { active: true, results, selectedResultIndex: 0 } });

      const searchInput = screen.getByRole("textbox");
      await user.click(searchInput);
      await user.keyboard("{ArrowDown}");

      expect(searchInput).toHaveAttribute("aria-activedescendant", "search-menuitem-1");
    });

    it("should navigate up with ArrowUp key", async () => {
      const results = [
        { href: "/1", text: "Result 1" },
        { href: "/2", text: "Result 2" },
        { href: "/3", text: "Result 3" },
      ];
      render(HeaderSearchTest, { props: { active: true, results, selectedResultIndex: 1 } });

      const searchInput = screen.getByRole("textbox");
      await user.click(searchInput);
      await user.keyboard("{ArrowUp}");

      expect(searchInput).toHaveAttribute("aria-activedescendant", "search-menuitem-0");
    });

    it("should wrap to first item when navigating down from last item", async () => {
      const results = [
        { href: "/1", text: "Result 1" },
        { href: "/2", text: "Result 2" },
      ];
      render(HeaderSearchTest, { props: { active: true, results, selectedResultIndex: 1 } });

      const searchInput = screen.getByRole("textbox");
      await user.click(searchInput);
      await user.keyboard("{ArrowDown}");

      expect(searchInput).toHaveAttribute("aria-activedescendant", "search-menuitem-0");
    });

    it("should wrap to last item when navigating up from first item", async () => {
      const results = [
        { href: "/1", text: "Result 1" },
        { href: "/2", text: "Result 2" },
      ];
      render(HeaderSearchTest, { props: { active: true, results, selectedResultIndex: 0 } });

      const searchInput = screen.getByRole("textbox");
      await user.click(searchInput);
      await user.keyboard("{ArrowUp}");

      expect(searchInput).toHaveAttribute("aria-activedescendant", "search-menuitem-1");
    });

    it("should clear value on Escape key when search is empty", async () => {
      render(HeaderSearchTest, { props: { active: true, value: "" } });

      const searchInput = screen.getByRole("textbox");
      await user.click(searchInput);
      await user.keyboard("{Escape}");

      expect(screen.getByTestId("inactive-event")).toHaveTextContent("true");
    });

    it("should clear value but keep active on Escape key when search has value", async () => {
      render(HeaderSearchTest, { props: { active: true, value: "test" } });

      const searchInput = screen.getByRole("textbox");
      await user.click(searchInput);
      await user.keyboard("{Escape}");

      expect(searchInput).toHaveValue("");
      expect(screen.getByRole("search")).toHaveClass("bx--header__search--active");
    });
  });

  describe("Focus Management", () => {
    it("should focus input when active becomes true", async () => {
      const { component } = render(HeaderSearchTest);

      component.active = true;
      await new Promise((resolve) => setTimeout(resolve, 0));

      const searchInput = screen.getByRole("textbox");
      expect(searchInput).toHaveFocus();
    });

    it("should blur input when active becomes false", async () => {
      const { component } = render(HeaderSearchTest, { props: { active: true } });

      component.active = false;
      await new Promise((resolve) => setTimeout(resolve, 0));

      const searchInput = screen.getByRole("textbox");
      expect(searchInput).not.toHaveFocus();
    });
  });

  describe("Ref Binding", () => {
    it("should bind ref to input element", () => {
      render(HeaderSearchTest);

      expect(screen.getByTestId("ref-type")).toHaveTextContent("HTMLInputElement");
    });
  });

  describe("Slot Content", () => {
    it("should render custom slot content for results", () => {
      const results = [
        { href: "/1", text: "Result 1" },
        { href: "/2", text: "Result 2" },
      ];
      render(HeaderSearchTest, { props: { active: true, results } });

      expect(screen.getByTestId("result-0")).toHaveTextContent("Result 1");
      expect(screen.getByTestId("result-1")).toHaveTextContent("Result 2");
    });

    it("should render default slot content when no custom slot provided", () => {
      const results = [
        { href: "/1", text: "Result 1", description: "Description 1" },
      ];
      render(HeaderSearchTest, { props: { active: true, results } });

      const menuItem = screen.getByRole("menuitem", { name: "Result 1" });
      expect(menuItem).toHaveTextContent("Result 1");
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      render(HeaderSearchTest);

      const searchContainer = screen.getByRole("search");
      expect(searchContainer).toBeInTheDocument();

      const searchInput = screen.getByRole("textbox");
      expect(searchInput).toHaveAttribute("aria-autocomplete", "list");
      expect(searchInput).toHaveAttribute("aria-controls", "search-menu");
    });

    it("should have proper tabindex attributes", () => {
      render(HeaderSearchTest, { props: { active: true } });

      const searchButton = screen.getByRole("button", { name: "Search" });
      expect(searchButton).toHaveAttribute("tabindex", "-1");

      const searchInput = screen.getByRole("textbox");
      expect(searchInput).toHaveAttribute("tabindex", "0");

      const clearButton = screen.getByRole("button", { name: "Clear search" });
      expect(clearButton).toHaveAttribute("tabindex", "0");
    });

    it("should have proper tabindex when not active", () => {
      render(HeaderSearchTest, { props: { active: false } });

      const searchButton = screen.getByRole("button", { name: "Search" });
      expect(searchButton).toHaveAttribute("tabindex", "0");

      const searchInput = screen.getByRole("textbox");
      expect(searchInput).toHaveAttribute("tabindex", "-1");
    });
  });

  describe("Mouse Events", () => {
    it("should deactivate when clicking outside", async () => {
      render(HeaderSearchTest, { props: { active: true } });

      // Click outside the search component
      const outsideElement = document.createElement("div");
      document.body.appendChild(outsideElement);
      fireEvent.mouseUp(outsideElement);
      
      // Wait for the event to be processed
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(screen.getByTestId("inactive-event")).toHaveTextContent("true");
      
      document.body.removeChild(outsideElement);
    });

    it("should not deactivate when clicking inside", async () => {
      render(HeaderSearchTest, { props: { active: true } });

      const searchContainer = screen.getByRole("search");
      fireEvent.mouseUp(searchContainer);

      expect(screen.getByTestId("inactive-event")).toHaveTextContent("false");
    });
  });
});
