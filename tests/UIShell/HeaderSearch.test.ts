import { fireEvent, render, screen } from "@testing-library/svelte";
import type HeaderSearchComponent from "carbon-components-svelte/UIShell/HeaderSearch.svelte";
import type { HeaderSearchResult } from "carbon-components-svelte/UIShell/HeaderSearch.svelte";
import type { ComponentProps } from "svelte";
import { user } from "../utils/user";
import HeaderSearchTest from "./HeaderSearch.test.svelte";
import HeaderSearchIconTest from "./HeaderSearchIcon.test.svelte";

describe("HeaderSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Regression test for initial event dispatch in Svelte 5
  // https://github.com/carbon-design-system/carbon-components-svelte/issues/2532
  it("does not fire active/inactive event on initial render", () => {
    render(HeaderSearchTest);

    expect(screen.getByTestId("active-event")).toHaveTextContent("false");
    expect(screen.getByTestId("inactive-event")).toHaveTextContent("false");
  });

  // Regression test for initial event dispatch in Svelte 5
  // https://github.com/carbon-design-system/carbon-components-svelte/issues/2532
  it("does not fire active/inactive event on initial render when active is true", () => {
    render(HeaderSearchTest, { props: { active: true } });

    expect(screen.getByTestId("active-event")).toHaveTextContent("false");
    expect(screen.getByTestId("inactive-event")).toHaveTextContent("false");
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
      expect(searchInput.id).toMatch(/^ccs-[a-z0-9.]+-input$/);
    });

    it("should support a custom placeholder", () => {
      render(HeaderSearchTest, { props: { placeholder: "Find anything..." } });

      expect(screen.getByRole("textbox")).toHaveAttribute(
        "placeholder",
        "Find anything...",
      );
    });

    it("should label the input with labelText by default", () => {
      render(HeaderSearchTest);

      const label = screen.getByText("Search", { selector: "label" });
      const input = screen.getByRole("textbox");
      expect(label.getAttribute("for")).toBe(input.id);
    });

    it("should support a custom labelText", () => {
      render(HeaderSearchTest, { props: { labelText: "Search the catalog" } });

      const label = screen.getByText("Search the catalog", {
        selector: "label",
      });
      expect(label.getAttribute("for")).toBe(screen.getByRole("textbox").id);
    });

    it("should generate unique ids per instance to avoid collisions", () => {
      const { container: a } = render(HeaderSearchTest);
      const { container: b } = render(HeaderSearchTest);

      const inputA = a.querySelector("input");
      const inputB = b.querySelector("input");
      expect(inputA?.id).toBeTruthy();
      expect(inputB?.id).toBeTruthy();
      expect(inputA?.id).not.toBe(inputB?.id);

      const labelA = a.querySelector("label");
      const labelB = b.querySelector("label");
      expect(labelA?.getAttribute("for")).toBe(inputA?.id);
      expect(labelB?.getAttribute("for")).toBe(inputB?.id);
    });

    it("should render search button", () => {
      render(HeaderSearchTest);

      const searchButton = screen.getByRole("button", { name: "Search" });
      expect(searchButton).toHaveAttribute("aria-expanded", "false");
    });

    it("should render clear button when active", () => {
      render(HeaderSearchTest, { props: { active: true } });

      const clearButton = screen.getByRole("button", {
        name: "Clear search input",
      });
      expect(clearButton).toBeInTheDocument();
    });

    it("should not render clear button when not active", () => {
      render(HeaderSearchTest, { props: { active: false } });

      expect(
        screen.queryByRole("button", { name: "Clear search input" }),
      ).not.toBeInTheDocument();
    });

    it("should support a custom closeButtonLabelText", () => {
      render(HeaderSearchTest, {
        props: { active: true, closeButtonLabelText: "Reset search" },
      });

      expect(
        screen.getByRole("button", { name: "Reset search" }),
      ).toBeInTheDocument();
    });
  });

  describe("Icon", () => {
    it("should render IconSearch in the trigger by default", () => {
      render(HeaderSearchTest);

      const searchButton = screen.getByRole("button", { name: "Search" });
      expect(searchButton.querySelector("svg")).toBeInTheDocument();
      expect(screen.queryByTestId("custom-icon")).not.toBeInTheDocument();
    });

    it("should render a custom icon in the trigger", () => {
      render(HeaderSearchIconTest);

      const searchButton = screen.getByRole("button", { name: "Search" });
      expect(
        searchButton.querySelector("[data-testid='custom-icon']"),
      ).toBeInTheDocument();
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
      expect(searchInput.getAttribute("aria-activedescendant")).toMatch(
        /^ccs-[a-z0-9.]+-menuitem-1$/,
      );
    });

    it("should pass selected to the result slot", async () => {
      const results = [
        { href: "/1", text: "Result 1" },
        { href: "/2", text: "Result 2" },
        { href: "/3", text: "Result 3" },
      ];
      render(HeaderSearchTest, {
        props: { active: true, results, selectedResultIndex: 0 },
      });

      expect(screen.getByTestId("result-0")).toHaveAttribute(
        "data-selected",
        "true",
      );
      expect(screen.getByTestId("result-1")).toHaveAttribute(
        "data-selected",
        "false",
      );

      await user.keyboard("{ArrowDown}");

      expect(screen.getByTestId("result-0")).toHaveAttribute(
        "data-selected",
        "false",
      );
      expect(screen.getByTestId("result-1")).toHaveAttribute(
        "data-selected",
        "true",
      );
    });

    it("should use result id for selected menu item id when provided", () => {
      const results = [
        { id: "result-a", href: "/1", text: "Result 1" },
        { id: 2, href: "/2", text: "Result 2" },
      ];
      render(HeaderSearchTest, {
        props: { active: true, results, selectedResultIndex: 1 },
      });

      const searchInput = screen.getByRole("textbox");
      expect(searchInput.getAttribute("aria-activedescendant")).toMatch(
        /^ccs-[a-z0-9.]+-menuitem-2$/,
      );
      expect(
        screen.getByRole("menuitem", { name: "Result 2" }),
      ).toHaveAttribute(
        "id",
        searchInput.getAttribute("aria-activedescendant"),
      );
    });

    it("should render results when active and results exist", () => {
      const results = [
        { href: "/1", text: "Result 1", description: "Description 1" },
        { href: "/2", text: "Result 2", description: "Description 2" },
      ];
      render(HeaderSearchTest, { props: { active: true, results } });

      const menu = screen.getByRole("menu");
      expect(menu).toBeInTheDocument();
      const label = screen.getByText("Search", { selector: "label" });
      expect(menu.getAttribute("aria-labelledby")).toBe(label.id);

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

      const clearButton = screen.getByRole("button", {
        name: "Clear search input",
      });
      await user.click(clearButton);

      expect(screen.getByTestId("clear-event")).toHaveTextContent("true");
    });

    it("should dispatch select event when result is selected", async () => {
      const results = [
        { href: "/1", text: "Result 1" },
        { href: "/2", text: "Result 2" },
      ];
      render(HeaderSearchTest, {
        props: { active: true, results, value: "test" },
      });

      const firstMenuItem = screen.getByRole("menuitem", { name: "Result 1" });
      await user.click(firstMenuItem);

      const selectEvent = JSON.parse(
        screen.getByTestId("select-event").textContent || "{}",
      );
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
      render(HeaderSearchTest, {
        props: { active: true, results, value: "test" },
      });

      const searchInput = screen.getByRole("textbox");
      await user.click(searchInput);
      await user.keyboard("{Enter}");

      const selectEvent = JSON.parse(
        screen.getByTestId("select-event").textContent || "{}",
      );
      expect(selectEvent.selectedResultIndex).toBe(0);
    });

    it("should navigate down with ArrowDown key", async () => {
      const results = [
        { href: "/1", text: "Result 1" },
        { href: "/2", text: "Result 2" },
        { href: "/3", text: "Result 3" },
      ];
      render(HeaderSearchTest, {
        props: { active: true, results, selectedResultIndex: 0 },
      });

      const searchInput = screen.getByRole("textbox");
      await user.click(searchInput);
      await user.keyboard("{ArrowDown}");

      expect(searchInput.getAttribute("aria-activedescendant")).toMatch(
        /^ccs-[a-z0-9.]+-menuitem-1$/,
      );
    });

    it("should navigate up with ArrowUp key", async () => {
      const results = [
        { href: "/1", text: "Result 1" },
        { href: "/2", text: "Result 2" },
        { href: "/3", text: "Result 3" },
      ];
      render(HeaderSearchTest, {
        props: { active: true, results, selectedResultIndex: 1 },
      });

      const searchInput = screen.getByRole("textbox");
      await user.click(searchInput);
      await user.keyboard("{ArrowUp}");

      expect(searchInput.getAttribute("aria-activedescendant")).toMatch(
        /^ccs-[a-z0-9.]+-menuitem-0$/,
      );
    });

    it("should wrap to first item when navigating down from last item", async () => {
      const results = [
        { href: "/1", text: "Result 1" },
        { href: "/2", text: "Result 2" },
      ];
      render(HeaderSearchTest, {
        props: { active: true, results, selectedResultIndex: 1 },
      });

      const searchInput = screen.getByRole("textbox");
      await user.click(searchInput);
      await user.keyboard("{ArrowDown}");

      expect(searchInput.getAttribute("aria-activedescendant")).toMatch(
        /^ccs-[a-z0-9.]+-menuitem-0$/,
      );
    });

    it("should wrap to last item when navigating up from first item", async () => {
      const results = [
        { href: "/1", text: "Result 1" },
        { href: "/2", text: "Result 2" },
      ];
      render(HeaderSearchTest, {
        props: { active: true, results, selectedResultIndex: 0 },
      });

      const searchInput = screen.getByRole("textbox");
      await user.click(searchInput);
      await user.keyboard("{ArrowUp}");

      expect(searchInput.getAttribute("aria-activedescendant")).toMatch(
        /^ccs-[a-z0-9.]+-menuitem-1$/,
      );
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
      expect(screen.getByRole("search")).toHaveClass(
        "bx--header__search--active",
      );
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
      const { component } = render(HeaderSearchTest, {
        props: { active: true },
      });

      component.active = false;
      await new Promise((resolve) => setTimeout(resolve, 0));

      const searchInput = screen.getByRole("textbox");
      expect(searchInput).not.toHaveFocus();
    });
  });

  describe("Ref Binding", () => {
    it("should bind ref to input element", () => {
      const { component } = render(HeaderSearchTest);
      const searchInput = screen.getByRole("textbox");

      assert(component.ref instanceof HTMLInputElement);
      expect(component.ref).toBe(searchInput);
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
      expect(searchInput.getAttribute("aria-controls")).toMatch(
        /^ccs-[a-z0-9.]+-menu$/,
      );
    });

    it("should have proper tabindex attributes", () => {
      render(HeaderSearchTest, { props: { active: true } });

      const searchButton = screen.getByRole("button", { name: "Search" });
      expect(searchButton).toHaveAttribute("tabindex", "-1");

      const searchInput = screen.getByRole("textbox");
      expect(searchInput).toHaveAttribute("tabindex", "0");

      const clearButton = screen.getByRole("button", {
        name: "Clear search input",
      });
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

      // dismiss() defers window listener registration by a macrotask; flush
      // it before the outside click so that click is not missed.
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Click outside the search component
      const outsideElement = document.createElement("div");
      document.body.appendChild(outsideElement);
      fireEvent.mouseUp(outsideElement);

      // Wait for the event to be processed
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(screen.getByTestId("inactive-event")).toHaveTextContent("true");

      document.body.removeChild(outsideElement);
    });

    it("should not deactivate when clicking inside", () => {
      render(HeaderSearchTest, { props: { active: true } });

      const searchContainer = screen.getByRole("search");
      fireEvent.mouseUp(searchContainer);

      expect(screen.getByTestId("inactive-event")).toHaveTextContent("false");
    });
  });
});

describe("HeaderSearch Generics", () => {
  it("should support custom result types with generics", () => {
    type CustomResult = {
      href: string;
      text: string;
      description?: string;
      category?: "document" | "user" | "project";
      score?: number;
    };

    const customResults: CustomResult[] = [
      {
        href: "/doc1",
        text: "Document 1",
        category: "document",
        score: 0.95,
      },
    ];

    expectTypeOf<typeof customResults>().toEqualTypeOf<CustomResult[]>();

    type ResultsPropType = ReadonlyArray<CustomResult> | undefined;
    expectTypeOf<ResultsPropType>().toEqualTypeOf<
      ReadonlyArray<CustomResult> | undefined
    >();

    type SelectEventDetail = {
      value: string;
      selectedResultIndex: number;
      selectedResult: CustomResult;
    };

    const testEventDetail: SelectEventDetail = {
      value: "test",
      selectedResultIndex: 0,
      selectedResult: customResults[0],
    };

    expectTypeOf(testEventDetail.selectedResult).toEqualTypeOf<CustomResult>();
    if (testEventDetail.selectedResult.category) {
      expectTypeOf(testEventDetail.selectedResult.category).toEqualTypeOf<
        "document" | "user" | "project"
      >();
    }
    if (testEventDetail.selectedResult.score) {
      expectTypeOf(
        testEventDetail.selectedResult.score,
      ).toEqualTypeOf<number>();
    }
  });

  it("should default to HeaderSearchResult type when generic is not specified", () => {
    type DefaultHeaderSearchResult = {
      href: string;
      text: string;
      description?: string;
    };

    const defaultResults: DefaultHeaderSearchResult[] = [
      { href: "/1", text: "Result 1", description: "Description" },
    ];

    expectTypeOf<typeof defaultResults>().toEqualTypeOf<
      DefaultHeaderSearchResult[]
    >();

    type ResultsPropType = ReadonlyArray<DefaultHeaderSearchResult> | undefined;
    expectTypeOf<ResultsPropType>().toEqualTypeOf<
      ReadonlyArray<DefaultHeaderSearchResult> | undefined
    >();
  });

  it("should provide type-safe access to custom result properties in event handlers", () => {
    type SearchResult = {
      href: string;
      text: string;
      description?: string;
      category: "document" | "user" | "project";
      score: number;
    };

    const handleSelect = (event: {
      value: string;
      selectedResultIndex: number;
      selectedResult: SearchResult;
    }) => {
      expectTypeOf(event.selectedResult).toEqualTypeOf<SearchResult>();
      expectTypeOf(event.selectedResult.category).toEqualTypeOf<
        "document" | "user" | "project"
      >();
      expectTypeOf(event.selectedResult.score).toEqualTypeOf<number>();
    };

    expectTypeOf(handleSelect).parameter(0).toEqualTypeOf<{
      value: string;
      selectedResultIndex: number;
      selectedResult: SearchResult;
    }>();

    type SelectEventDetail = {
      value: string;
      selectedResultIndex: number;
      selectedResult: SearchResult;
    };
    const testEventDetail: SelectEventDetail = {
      value: "test",
      selectedResultIndex: 0,
      selectedResult: {
        href: "/1",
        text: "Result",
        category: "document",
        score: 0.9,
      },
    };
    expectTypeOf(testEventDetail).toEqualTypeOf<
      Parameters<typeof handleSelect>[0]
    >();
  });

  it("should work with results that have all base properties", () => {
    type FullResult = {
      href: string;
      text: string;
      description: string;
    };

    const fullResults: FullResult[] = [
      {
        href: "/item",
        text: "Item",
        description: "Full description",
      },
    ];

    expectTypeOf<typeof fullResults>().toEqualTypeOf<FullResult[]>();

    type ResultsPropType = ReadonlyArray<FullResult> | undefined;
    expectTypeOf<ResultsPropType>().toEqualTypeOf<
      ReadonlyArray<FullResult> | undefined
    >();
  });

  it("should work with minimal result types", () => {
    type MinimalResult = {
      href: string;
      text: string;
    };

    const minimalResults: MinimalResult[] = [
      {
        href: "/simple",
        text: "Simple result",
      },
    ];

    expectTypeOf<typeof minimalResults>().toEqualTypeOf<MinimalResult[]>();

    type ResultsPropType = ReadonlyArray<MinimalResult> | undefined;
    expectTypeOf<ResultsPropType>().toEqualTypeOf<
      ReadonlyArray<MinimalResult> | undefined
    >();
  });

  it("should accept an optional id field on HeaderSearchResult", () => {
    const withStringId: HeaderSearchResult = {
      id: "result-a",
      href: "/1",
      text: "Result",
    };
    const withNumberId: HeaderSearchResult = {
      id: 1,
      href: "/1",
      text: "Result",
    };
    const withoutId: HeaderSearchResult = { href: "/1", text: "Result" };

    expectTypeOf(withStringId.id).toEqualTypeOf<string | number | undefined>();
    expectTypeOf(withNumberId.id).toEqualTypeOf<string | number | undefined>();
    expectTypeOf(withoutId.id).toEqualTypeOf<string | number | undefined>();
  });

  it("should provide type-safe access in slot props", () => {
    type CustomResult = {
      href: string;
      text: string;
      metadata?: { tags: string[]; author: string };
    };

    const slotProps: { result: CustomResult; index: number } = {
      result: {
        href: "/1",
        text: "Result",
        metadata: { tags: ["tag1"], author: "Author" },
      },
      index: 0,
    };

    expectTypeOf(slotProps.result).toEqualTypeOf<CustomResult>();
    expectTypeOf(slotProps.index).toEqualTypeOf<number>();

    if (slotProps.result.metadata) {
      expectTypeOf(slotProps.result.metadata.tags).toEqualTypeOf<string[]>();
      expectTypeOf(slotProps.result.metadata.author).toEqualTypeOf<string>();
    }
  });

  it("should enforce HeaderSearchResult constraint on generic type", () => {
    type CustomResult = {
      href: string;
      text: string;
      category?: "document" | "user" | "project";
      score?: number;
    };

    type ComponentType = HeaderSearchComponent<CustomResult>;
    type Props = ComponentProps<ComponentType>;

    expectTypeOf<NonNullable<Props["results"]>>().toEqualTypeOf<
      readonly CustomResult[]
    >();

    type BaseComponentType = HeaderSearchComponent<HeaderSearchResult>;
    type BaseProps = ComponentProps<BaseComponentType>;
    expectTypeOf<NonNullable<BaseProps["results"]>>().toEqualTypeOf<
      readonly HeaderSearchResult[]
    >();
  });
});
