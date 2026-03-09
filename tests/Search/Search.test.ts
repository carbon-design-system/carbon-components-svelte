import { render, screen } from "@testing-library/svelte";
import type SearchComponent from "carbon-components-svelte/Search/Search.svelte";
import type { ComponentProps } from "svelte";
import { user } from "../setup-tests";
import SearchSlot from "./Search.slot.test.svelte";
import Search from "./Search.test.svelte";
import SearchExpandable from "./SearchExpandable.test.svelte";
import SearchInitialEvent from "./SearchInitialEvent.test.svelte";
import SearchSkeleton from "./SearchSkeleton.test.svelte";

describe("Search", () => {
  const getSearchInput = (label?: string | RegExp) =>
    screen.getByRole("searchbox", { name: label });
  const getClearButton = (label = "Clear search input") =>
    screen.getByRole("button", { name: label });

  // Regression test for initial event dispatch in Svelte 5
  // https://github.com/carbon-design-system/carbon-components-svelte/issues/2529
  it("does not fire expand/collapse event on initial render", () => {
    render(SearchInitialEvent);

    expect(screen.getByTestId("expand-event")).toHaveTextContent("false");
    expect(screen.getByTestId("collapse-event")).toHaveTextContent("false");
  });

  // Regression test for initial event dispatch in Svelte 5
  // https://github.com/carbon-design-system/carbon-components-svelte/issues/2529
  it("does not fire expand/collapse event on initial render when expanded is true", () => {
    render(SearchInitialEvent, { props: { expanded: true } });

    expect(screen.getByTestId("expand-event")).toHaveTextContent("false");
    expect(screen.getByTestId("collapse-event")).toHaveTextContent("false");
  });

  it("renders and functions correctly", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Search);

    const search = getSearchInput("Default search");
    expect(search).toHaveValue("");
    expect(search).toHaveAttribute("placeholder", "Search");

    await user.type(search, "test");
    expect(search).toHaveValue("test");

    const clearButton = getClearButton("Clear value");
    await user.click(clearButton);
    expect(search).toHaveValue("");
    expect(consoleLog).toHaveBeenCalledWith("clear");
    expect(consoleLog).toHaveBeenCalledTimes(1);
  });

  it("renders disabled state", () => {
    render(Search);

    const search = getSearchInput("Disabled search");
    expect(search).toBeDisabled();
  });

  it("handles expandable variant", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(SearchExpandable);

    const search = getSearchInput("Expandable search");
    const searchWrapper = search.closest(".bx--search");
    assert(searchWrapper);

    expect(searchWrapper).toHaveClass("bx--search--expandable");
    expect(searchWrapper).not.toHaveClass("bx--search--expanded");

    const magnifier = searchWrapper.querySelector(".bx--search-magnifier");
    assert(magnifier);

    await user.click(magnifier);
    expect(searchWrapper).toHaveClass("bx--search--expanded");
    expect(consoleLog).toHaveBeenCalledWith("expanded");

    await user.click(document.body);
    expect(searchWrapper).not.toHaveClass("bx--search--expanded");
    expect(consoleLog).toHaveBeenCalledWith("collapsed");

    // Don't collapse when has value
    await user.click(magnifier);
    await user.type(search, "test");
    await user.click(document.body);
    expect(searchWrapper).toHaveClass("bx--search--expanded");
  });

  it("renders skeleton states", () => {
    render(SearchSkeleton);

    const skeletons = document.querySelectorAll(".bx--skeleton");
    expect(skeletons).toHaveLength(3);

    // Default (xl) skeleton
    expect(skeletons[0]).toHaveClass("bx--search--xl");

    // Large (lg) skeleton
    expect(skeletons[1]).toHaveClass("bx--search--lg");

    // Small (sm) skeleton
    expect(skeletons[2]).toHaveClass("bx--search--sm");
  });

  it("supports custom label slot", () => {
    render(SearchSlot);

    const customLabel = screen.getByText("Custom label content");
    expect(customLabel).toBeInTheDocument();
  });

  describe("Generics", () => {
    it("should support custom types with generics", () => {
      type CustomValue = "option1" | "option2" | "option3";

      type ComponentType = SearchComponent<CustomValue>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["value"]>().toEqualTypeOf<CustomValue | undefined>();
    });

    it("should default to any type when generic is not specified", () => {
      type ComponentType = SearchComponent;
      type Props = ComponentProps<ComponentType>;

      // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
      expectTypeOf<Props["value"]>().toEqualTypeOf<any>();
    });

    it("should work with object types", () => {
      type SearchFilters = { query: string; category: string };

      type ComponentType = SearchComponent<SearchFilters>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["value"]>().toEqualTypeOf<SearchFilters | undefined>();
    });

    it("should work with 'as const' for type inference", () => {
      const suggestions = ["apple", "banana", "cherry"] as const;
      type InferredType = (typeof suggestions)[number];

      expectTypeOf<typeof suggestions>().toEqualTypeOf<
        readonly ["apple", "banana", "cherry"]
      >();
      expectTypeOf<InferredType>().toEqualTypeOf<
        "apple" | "banana" | "cherry"
      >();

      type ComponentType = SearchComponent<InferredType>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["value"]>().toEqualTypeOf<InferredType | undefined>();
    });

    it("should support custom Icon types with generics", () => {
      type CustomIcon = new (...args: unknown[]) => unknown;

      type ComponentType = SearchComponent<unknown, CustomIcon>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["icon"]>().toEqualTypeOf<CustomIcon | undefined>();
    });

    it("should default Icon to any when not specified", () => {
      type ComponentType = SearchComponent<string>;
      type Props = ComponentProps<ComponentType>;

      // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
      expectTypeOf<Props["icon"]>().toEqualTypeOf<any>();
    });
  });
});
