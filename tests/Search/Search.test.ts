import { render, screen } from "@testing-library/svelte";
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
  // https://github.com/carbon-design-system/carbon-components-svelte/issues/2525
  it("does not fire expand/collapse event on initial render", () => {
    render(SearchInitialEvent);

    expect(screen.getByTestId("expand-event")).toHaveTextContent("false");
    expect(screen.getByTestId("collapse-event")).toHaveTextContent("false");
  });

  // Regression test for initial event dispatch in Svelte 5
  // https://github.com/carbon-design-system/carbon-components-svelte/issues/2525
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
});
