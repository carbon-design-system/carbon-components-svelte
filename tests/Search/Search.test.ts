import { render, screen } from "@testing-library/svelte";
import type SearchComponent from "carbon-components-svelte/Search/Search.svelte";
import type { ComponentProps } from "svelte";
import { user } from "../utils/user";
import SearchFluidForm from "./Search.fluidForm.test.svelte";
import SearchFluidSkeleton from "./Search.fluidSkeleton.test.svelte";
import SearchFluidSlot from "./Search.fluidSlot.test.svelte";
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

  it("supports the extra-small size", () => {
    render(Search, { props: { size: "xs" } });

    const search = getSearchInput("Default search");
    expect(search.closest(".bx--search")).toHaveClass("bx--search--xs");
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
    expect(skeletons).toHaveLength(4);

    // Default (xl) skeleton
    expect(skeletons[0]).toHaveClass("bx--search--xl");

    // Large (lg) skeleton
    expect(skeletons[1]).toHaveClass("bx--search--lg");

    // Small (sm) skeleton
    expect(skeletons[2]).toHaveClass("bx--search--sm");

    // Skeleton with hidden label has no label element
    const hideLabelSkeleton = screen.getByTestId("skeleton-hide-label");
    expect(hideLabelSkeleton.querySelector(".bx--label")).toBeNull();
  });

  it("supports custom label slot", () => {
    render(SearchSlot);

    const customLabel = screen.getByText("Custom label content");
    expect(customLabel).toBeInTheDocument();
  });

  describe("fluid variant", () => {
    it("does not render the fluid class by default", () => {
      render(Search);

      expect(document.querySelector(".bx--search--fluid")).toBeNull();
    });

    it("renders the fluid variant", () => {
      render(Search, { props: { fluid: true } });

      const search = getSearchInput("Default search");
      expect(search.closest(".bx--search")).toHaveClass("bx--search--fluid");
    });

    it("ignores fluid for the expandable variant", () => {
      render(SearchExpandable, { props: { fluid: true } });

      const search = getSearchInput("Expandable search");
      const searchWrapper = search.closest(".bx--search");
      expect(searchWrapper).toHaveClass("bx--search--expandable");
      expect(searchWrapper).not.toHaveClass("bx--search--fluid");
    });

    it("inherits fluid from the FluidForm context", () => {
      render(SearchFluidForm);

      const search = getSearchInput("Fluid form search");
      expect(search.closest(".bx--search")).toHaveClass("bx--search--fluid");
    });

    it("marks the label as slotted when fluid", () => {
      render(SearchFluidSlot);

      expect(screen.getByText("Custom label content")).toHaveClass(
        "bx--label--slotted",
      );
    });

    it("does not mark the label as slotted when not fluid", () => {
      render(SearchFluidSlot, { props: { fluid: false } });

      expect(screen.getByText("Custom label content")).not.toHaveClass(
        "bx--label--slotted",
      );
    });
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

  it("renders fluid skeleton state", () => {
    render(SearchFluidSkeleton);

    const skeleton = screen.getByTestId("fluid-search-skeleton");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass(
      "bx--form-item",
      "bx--text-input--fluid__skeleton",
    );
    expect(skeleton.children).toHaveLength(2);
    expect(skeleton.children[0]).toHaveClass("bx--label", "bx--skeleton");
    expect(skeleton.children[1]).toHaveClass("bx--skeleton", "bx--text-input");
  });
});
