import { render, screen } from "@testing-library/svelte";
import type SearchComponent from "carbon-components-svelte/Search/Search.svelte";
import type { ComponentProps } from "svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import SearchFocusWithoutSelect from "./Search.focusWithoutSelect.test.svelte";
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

  it("focuses without selecting text via focusWithoutSelect() when selectTextOnFocus is true", async () => {
    render(SearchFocusWithoutSelect, {
      props: { selectTextOnFocus: true, value: "Cloud functions" },
    });

    await user.click(
      screen.getByRole("button", { name: "Focus without select" }),
    );
    await tick();

    const search = getSearchInput("Focus search");
    assert(search instanceof HTMLInputElement);
    expect(search).toHaveFocus();
    expect(search.selectionStart).toBe(search.selectionEnd);
  });

  it("renders and functions correctly", async () => {
    const onClear = vi.fn();
    render(Search, { props: { onClear } });

    const search = getSearchInput("Default search");
    expect(search).toHaveValue("");
    expect(search).toHaveAttribute("placeholder", "Search");

    await user.type(search, "test");
    expect(search).toHaveValue("test");

    const clearButton = getClearButton("Clear value");
    await user.click(clearButton);
    expect(search).toHaveValue("");
    expect(onClear).toHaveBeenCalledOnce();
  });

  describe("readonly", () => {
    it("renders a readonly input and hides the clear button", () => {
      render(Search, { props: { readonly: true, value: "abc" } });

      expect(getSearchInput("Default search")).toHaveAttribute("readonly");
      expect(getClearButton("Clear value")).toHaveClass(
        "bx--search-close--hidden",
      );
    });

    it("does not clear the value from the clear button", async () => {
      const onClear = vi.fn();
      render(Search, { props: { readonly: true, value: "abc", onClear } });

      await user.click(getClearButton("Clear value"));

      expect(getSearchInput("Default search")).toHaveValue("abc");
      expect(onClear).not.toHaveBeenCalled();
    });

    it("does not clear the value on Escape", async () => {
      const onClear = vi.fn();
      render(Search, { props: { readonly: true, value: "abc", onClear } });

      await user.click(getSearchInput("Default search"));
      await user.keyboard("{Escape}");

      expect(getSearchInput("Default search")).toHaveValue("abc");
      expect(onClear).not.toHaveBeenCalled();
    });

    it("clears on Escape when not readonly", async () => {
      const onClear = vi.fn();
      render(Search, { props: { value: "abc", onClear } });

      await user.click(getSearchInput("Default search"));
      await user.keyboard("{Escape}");

      expect(getSearchInput("Default search")).toHaveValue("");
      expect(onClear).toHaveBeenCalledOnce();
    });
  });

  it("shows a busy state while loading", () => {
    render(Search, { props: { loading: true } });

    const search = getSearchInput("Default search");
    expect(search).toHaveAttribute("aria-busy", "true");
    expect(screen.getByTitle("Searching")).toBeInTheDocument();
  });

  it("does not set aria-busy when not loading", () => {
    render(Search);

    const search = getSearchInput("Default search");
    expect(search).not.toHaveAttribute("aria-busy");
  });

  it("uses a native type=search input", () => {
    render(Search);

    expect(getSearchInput("Default search")).toHaveAttribute("type", "search");
  });

  it("gives the search landmark a unique accessible name per instance", () => {
    render(Search);

    expect(
      screen.getByRole("search", { name: "Default search" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("search", { name: "Disabled search" }),
    ).toBeInTheDocument();
  });

  it("renders disabled state", () => {
    render(Search);

    const search = getSearchInput("Disabled search");
    expect(search).toBeDisabled();
  });

  it("should suppress invalid state when readonly", () => {
    render(Search, {
      props: { readonly: true, invalid: true, invalidText: "Required" },
    });

    const search = getSearchInput("Default search");
    expect(search).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByText("Required")).not.toBeInTheDocument();
  });

  it.each([false, true])(
    "should visually hide the label (fluid: %s)",
    (fluid) => {
      render(Search, { props: { hideLabel: true, fluid } });

      expect(screen.getByText("Default search")).toHaveClass(
        "bx--visually-hidden",
      );
    },
  );

  it("supports the extra-small size", () => {
    render(Search, { props: { size: "xs" } });

    const search = getSearchInput("Default search");
    expect(search.closest(".bx--search")).toHaveClass("bx--search--xs");
  });

  it("handles expandable variant", async () => {
    const onExpand = vi.fn();
    const onCollapse = vi.fn();
    render(SearchExpandable, { props: { onExpand, onCollapse } });

    const search = getSearchInput("Expandable search");
    const searchWrapper = search.closest(".bx--search");
    assert(searchWrapper);

    expect(searchWrapper).toHaveClass("bx--search--expandable");
    expect(searchWrapper).not.toHaveClass("bx--search--expanded");

    const magnifier = searchWrapper.querySelector(".bx--search-magnifier");
    assert(magnifier);

    await user.click(magnifier);
    expect(searchWrapper).toHaveClass("bx--search--expanded");
    expect(onExpand).toHaveBeenCalledOnce();

    await user.click(document.body);
    expect(searchWrapper).not.toHaveClass("bx--search--expanded");
    expect(onCollapse).toHaveBeenCalledOnce();

    await user.click(magnifier);
    await user.type(search, "test");
    await user.click(document.body);
    expect(searchWrapper).toHaveClass("bx--search--expanded");
  });

  it("hides the collapsed expandable input from assistive tech", async () => {
    render(SearchExpandable);

    const search = getSearchInput("Expandable search");
    expect(search).toHaveAttribute("inert");
    expect(search).toHaveAttribute("tabindex", "-1");

    const searchWrapper = search.closest(".bx--search");
    assert(searchWrapper);
    const magnifier = searchWrapper.querySelector(".bx--search-magnifier");
    assert(magnifier);
    await user.click(magnifier);

    expect(search).not.toHaveAttribute("inert");
    expect(search).not.toHaveAttribute("tabindex", "-1");
    expect(search).toHaveFocus();
  });

  it("renders a keyboard-reachable button to open the collapsed expandable search", () => {
    render(SearchExpandable, { props: { labelText: "", placeholder: "Find" } });

    const button = screen.getByRole("button", { name: "Find" });
    expect(button).toBeInTheDocument();

    const search = button
      .closest(".bx--search")
      ?.querySelector("input.bx--search-input");
    expect(search).toHaveAttribute("tabindex", "-1");
  });

  it("expands the search when the open button is activated from the keyboard", async () => {
    render(SearchExpandable, { props: { labelText: "", placeholder: "Find" } });

    const button = screen.getByRole("button", { name: "Find" });
    const searchWrapper = button.closest(".bx--search");
    assert(searchWrapper);

    button.focus();
    await user.keyboard("{Enter}");

    expect(searchWrapper).toHaveClass("bx--search--expanded");
  });

  it("does not expand a disabled expandable search from the open button", async () => {
    render(SearchExpandable, {
      props: { labelText: "", placeholder: "Find", disabled: true },
    });

    const button = screen.getByRole("button", { name: "Find" });
    expect(button).toBeDisabled();

    const searchWrapper = button.closest(".bx--search");
    assert(searchWrapper);

    await user.click(button);
    expect(searchWrapper).not.toHaveClass("bx--search--expanded");
  });

  it("does not render an open button when expandable is false", () => {
    render(Search);

    const magnifier = document.querySelector(".bx--search-magnifier");
    assert(magnifier);
    expect(magnifier.tagName).toBe("DIV");
  });

  it("renders skeleton states", () => {
    render(SearchSkeleton);

    const skeletons = document.querySelectorAll(".bx--skeleton");
    expect(skeletons).toHaveLength(4);

    expect(skeletons[0]).toHaveClass("bx--search--lg");

    expect(skeletons[1]).toHaveClass("bx--search--lg");

    expect(skeletons[2]).toHaveClass("bx--search--sm");

    // Search's label is always visually hidden, so no skeleton draws one.
    for (const skeleton of skeletons) {
      expect(skeleton.querySelector(".bx--label")).toBeNull();
    }
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

describe("Search loadingDelay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the spinner after the delay and holds it for the minimum", async () => {
    const { rerender } = render(Search, { props: { loadingDelay: 300 } });
    await rerender({ loading: true });
    const search = screen.getByRole("searchbox", { name: "Default search" });

    expect(search).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByTitle("Searching")).toBeNull();

    await vi.advanceTimersByTimeAsync(300);
    expect(screen.getByTitle("Searching")).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(100);
    await rerender({ loading: false });
    expect(search).not.toHaveAttribute("aria-busy");
    expect(screen.getByTitle("Searching")).toBeInTheDocument();

    // Shown at 300 ms, so the 500 ms minimum ends at 800 ms.
    await vi.advanceTimersByTimeAsync(399);
    expect(screen.getByTitle("Searching")).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(1);
    expect(screen.queryByTitle("Searching")).toBeNull();
  });

  it("never shows the spinner for loading that ends within the delay", async () => {
    const { rerender } = render(Search, { props: { loadingDelay: 300 } });
    await rerender({ loading: true });
    await vi.advanceTimersByTimeAsync(150);
    await rerender({ loading: false });
    await vi.advanceTimersByTimeAsync(1000);

    expect(screen.queryByTitle("Searching")).toBeNull();
  });
});
