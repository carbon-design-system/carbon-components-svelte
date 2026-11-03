import { fireEvent, render, screen } from "@testing-library/svelte";
import SearchMenuSkeletonMenu from "carbon-components-svelte/SearchMenu/SearchMenuSkeleton.svelte";
import { tick } from "svelte";
import { rect } from "../utils/rect";
import { user } from "../utils/user";
import SearchMenu from "./SearchMenu.test.svelte";
import SearchMenuBar from "./SearchMenuBar.test.svelte";
import SearchMenuDisabledItem from "./SearchMenuDisabledItem.test.svelte";
import SearchMenuFooterDivider from "./SearchMenuFooterDivider.test.svelte";
import SearchMenuGroups from "./SearchMenuGroups.test.svelte";
import SearchMenuHighlight from "./SearchMenuHighlight.test.svelte";
import SearchMenuMatch from "./SearchMenuMatch.test.svelte";
import SearchMenuNoResults from "./SearchMenuNoResults.test.svelte";
import SearchMenuSkeleton from "./SearchMenuSkeleton.test.svelte";
import { openMenu } from "./helpers";

describe("SearchMenu", () => {
  it("renders a combobox input and no menu until focused", () => {
    render(SearchMenu);
    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("aria-autocomplete", "list");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("selects the full value on focus when selectTextOnFocus is true", async () => {
    render(SearchMenu, {
      props: { selectTextOnFocus: true, value: "memcache" },
    });

    const input = screen.getByRole("combobox");
    assert(input instanceof HTMLInputElement);
    await user.click(input);
    await tick();

    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe("memcache".length);
  });

  it("does not select text on focus when disabled", async () => {
    render(SearchMenu, {
      props: { selectTextOnFocus: true, disabled: true, value: "memcache" },
    });

    const input = screen.getByRole("combobox");
    assert(input instanceof HTMLInputElement);
    const select = vi.spyOn(input, "select");
    await fireEvent.focus(input);

    expect(select).not.toHaveBeenCalled();
  });

  it("does not open the menu or submit when readonly", async () => {
    render(SearchMenu, { props: { readonly: true } });

    const input = screen.getByRole("combobox");
    await user.click(input);

    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.keyboard("{Enter}");
    expect(screen.getByTestId("result")).not.toHaveTextContent("submit:");
  });

  it("announces a read-only description", () => {
    render(SearchMenu, { props: { readonly: true } });

    const input = screen.getByRole("combobox");
    const describedById = input.getAttribute("aria-describedby");
    assert(describedById);
    expect(document.getElementById(describedById)).toHaveTextContent(
      "Read-only",
    );
  });

  it("hides the label visually", () => {
    render(SearchMenu, { props: { hideLabel: true } });

    expect(screen.getByText("Search")).toHaveClass("bx--visually-hidden");
  });

  it("opens the menu on focus and renders all items for an empty value", async () => {
    const input = await openMenu();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("option")).toHaveLength(4);
    expect(document.querySelectorAll('[role="option"][hidden]')).toHaveLength(
      0,
    );
  });

  it("keeps unmatched items mounted and hidden while filtering", async () => {
    const input = await openMenu();
    await user.type(input, "memcache");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option")).toHaveTextContent(
      "Data Store for Memcache",
    );
    expect(document.querySelectorAll('[role="option"]')).toHaveLength(4);
    expect(document.querySelectorAll('[role="option"][hidden]')).toHaveLength(
      3,
    );
  });

  it("highlights the matched portion of each item", async () => {
    const input = await openMenu();
    await user.type(input, "Data");
    // The menu is portaled to document.body, so query the whole document.
    const highlights = document.querySelectorAll(
      ".bx--search-menu-item__highlight",
    );
    expect(highlights.length).toBeGreaterThan(0);
    expect(highlights[0]).toHaveTextContent("Data");
  });

  it("navigates with the arrow keys and selects with Enter", async () => {
    const input = await openMenu();
    await user.keyboard("{ArrowDown}");

    const firstOption = screen.getAllByRole("option")[0];
    expect(firstOption).toHaveAttribute("aria-selected", "true");
    expect(input).toHaveAttribute("aria-activedescendant", firstOption.id);

    await user.keyboard("{Enter}");
    expect(screen.getByTestId("result")).toHaveTextContent(
      "Databases for TestSQL",
    );
    expect(input).toHaveValue("Databases for TestSQL");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByTestId("close")).toHaveTextContent("select");
  });

  it("fills the field with the picked text and sends the item's value", async () => {
    const input = await openMenu(undefined, { itemValues: true });
    await user.keyboard("{ArrowDown}{Enter}");

    expect(input).toHaveValue("Databases for TestSQL");
    expect(screen.getByTestId("result")).toHaveTextContent("item-0");
  });

  it("clears aria-activedescendant when typing hides the highlighted option", async () => {
    const input = await openMenu();
    await user.keyboard("{ArrowDown}");
    expect(input).toHaveAttribute("aria-activedescendant");
    await user.type(input, "memcache");
    expect(input).not.toHaveAttribute("aria-activedescendant");
  });

  it("scrolls the highlighted option within the menu, not the page", async () => {
    await openMenu();
    const listbox = screen.getByRole("listbox");
    Object.defineProperty(listbox, "scrollHeight", { value: 400 });
    Object.defineProperty(listbox, "clientHeight", { value: 100 });
    vi.spyOn(listbox, "getBoundingClientRect").mockReturnValue(
      rect({ top: 0, height: 100 }),
    );
    for (const option of screen.getAllByRole("option")) {
      vi.spyOn(option, "getBoundingClientRect").mockReturnValue(
        rect({ top: 120, height: 40 }),
      );
    }
    vi.mocked(Element.prototype.scrollIntoView).mockClear();

    await user.keyboard("{ArrowDown}");

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    expect(listbox.scrollTop).toBe(60);
  });

  it("dispatches submit when Enter is pressed with no active item", async () => {
    const input = await openMenu();
    await user.type(input, "no-match-here");
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("result")).toHaveTextContent(
      "submit:no-match-here",
    );
  });

  it.each([{ isComposing: true }, { keyCode: 229 }])(
    "ignores Enter while an IME composition is active (%o)",
    async (init) => {
      const input = await openMenu();
      await user.type(input, "ni");
      await fireEvent.keyDown(input, { key: "Enter", ...init });
      expect(screen.getByTestId("result")).not.toHaveTextContent("submit:");
    },
  );

  it("submits the typed value when Enter follows a hover highlight", async () => {
    const input = await openMenu();
    await user.type(input, "Data");
    await user.hover(screen.getByRole("option", { name: /Memcache/ }));
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("result")).toHaveTextContent("submit:Data");
  });

  it.each([
    ["{ArrowDown}{ArrowUp}", "HazardHub Property Risk Data API"],
    ["{End}", "HazardHub Property Risk Data API"],
    ["{ArrowDown}{ArrowDown}{Home}", "Databases for TestSQL"],
  ])("moves the highlight with %s", async (keys, label) => {
    const input = await openMenu();
    await user.keyboard(keys);

    const active = screen.getByRole("option", { name: label });
    expect(active).toHaveAttribute("aria-selected", "true");
    expect(input).toHaveAttribute("aria-activedescendant", active.id);
  });

  it("shows the noResults slot and keeps the menu open when nothing matches", async () => {
    render(SearchMenuNoResults);
    const input = screen.getByRole("combobox");
    await user.type(input, "zzz");

    expect(screen.getByText("Nothing matches")).toBeVisible();
    expect(input).toHaveAttribute("aria-expanded", "true");
  });

  it("does not select a disabled item on click", async () => {
    const onSelect = vi.fn();
    await openMenu(SearchMenuDisabledItem, { onSelect });

    await user.click(screen.getByRole("option", { name: "Disabled item" }));

    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("does not highlight a disabled item on hover", async () => {
    await openMenu(SearchMenuDisabledItem);
    const option = screen.getByRole("option", { name: "Disabled item" });

    await user.hover(option);

    expect(option).toHaveAttribute("aria-selected", "false");
  });

  it("closes on Escape and preserves the value", async () => {
    const input = await openMenu();
    await user.type(input, "Data");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input).toHaveValue("Data");
    expect(screen.getByTestId("close")).toHaveTextContent("escape-key");
  });

  it("closes on an outside click", async () => {
    await openMenu();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.click(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("dispatches close with the outside-click trigger", async () => {
    await openMenu();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    // fireEvent does not move focus, so the dismiss handler (not blur) closes.
    await fireEvent.click(document.body);
    expect(screen.getByTestId("close")).toHaveTextContent("outside-click");
  });

  it("dispatches close with the blur trigger when focus leaves", async () => {
    const input = await openMenu();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await fireEvent.blur(input);
    expect(screen.getByTestId("close")).toHaveTextContent("blur");
  });

  it("forwards the keyup input event", async () => {
    await openMenu();
    await user.keyboard("a");
    expect(screen.getByTestId("events")).toHaveTextContent("keyup");
  });

  it("dispatches select when an item is clicked", async () => {
    await openMenu();
    await user.click(screen.getByText("Data Store for Memcache"));
    expect(screen.getByTestId("result")).toHaveTextContent(
      "Data Store for Memcache",
    );
    expect(screen.getByTestId("close")).toHaveTextContent("select");
  });

  it("clears the highlight when the mouse leaves the item", async () => {
    await openMenu();
    const option = screen.getByText("Data Store for Memcache");
    await user.hover(option);
    expect(option.closest('[role="option"]')).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await user.unhover(option);
    expect(option.closest('[role="option"]')).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("does not open when disabled", async () => {
    await openMenu(SearchMenu, { disabled: true });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("uses a custom match function for filtering and highlighting", async () => {
    const input = await openMenu(SearchMenuMatch);
    // Case-sensitive matcher: "Data" matches only "Data Store".
    await user.type(input, "Data");
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Data Store");
    const highlights = document.querySelectorAll(
      ".bx--search-menu-item__highlight",
    );
    expect(highlights).toHaveLength(1);
    expect(highlights[0]).toHaveTextContent("Data");
  });

  it("renders every item with a no-op matcher and no highlights", async () => {
    const input = await openMenu(SearchMenuMatch, {
      match: () => ({ matched: true }),
    });
    await user.type(input, "zzz");
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(
      document.querySelectorAll(".bx--search-menu-item__highlight"),
    ).toHaveLength(0);
  });

  it("renders a skeleton menu while loading", async () => {
    await openMenu(SearchMenu, { loading: true });
    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute("aria-busy", "true");
    // Default skeleton rows render, and the slot items do not.
    expect(
      document.querySelectorAll(".bx--search-menu-item--skeleton"),
    ).toHaveLength(4);
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  it("appends one loading row below existing results while loading", async () => {
    const { rerender } = render(SearchMenu);
    await user.click(screen.getByRole("combobox"));
    expect(screen.getAllByRole("option")).toHaveLength(4);

    await rerender({ loading: true });

    expect(screen.getByRole("listbox")).toHaveAttribute("aria-busy", "true");
    expect(screen.getAllByRole("option")).toHaveLength(4);
    expect(
      document.querySelectorAll(".bx--search-menu-item--skeleton"),
    ).toHaveLength(1);
  });

  it("shows a busy state on the search input via searchLoading, independent of loading", () => {
    render(SearchMenu, { props: { searchLoading: true } });
    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("aria-busy", "true");
    expect(screen.getByTitle("Searching")).toBeInTheDocument();
    // Menu-level loading is untouched by searchLoading.
    expect(
      document.querySelectorAll(".bx--search-menu-item--skeleton"),
    ).toHaveLength(0);
  });

  it("renders all items but still highlights when shouldFilter is false", async () => {
    const input = await openMenu(SearchMenu, { shouldFilter: false });
    await user.type(input, "Data");
    // No client-side filtering: every server-provided item is rendered.
    expect(screen.getAllByRole("option")).toHaveLength(4);
    // The default matcher still highlights the query within each result.
    const highlights = document.querySelectorAll(
      ".bx--search-menu-item__highlight",
    );
    expect(highlights.length).toBeGreaterThan(0);
    expect(highlights[0]).toHaveTextContent("Data");
  });

  it("exposes segments to the slot for custom highlighting without corrupting text", async () => {
    const input = await openMenu(SearchMenuHighlight);
    await user.type(input, "Data");
    // The slot renders matched runs as <mark> with no @html and no stray
    // whitespace splitting the words.
    const option = screen.getByRole("option", {
      name: "Data Store for Memcache",
    });
    const label = option.querySelector(".bx--search-menu-item__label");
    // Internal text must be intact: matched/unmatched segments are not split by
    // stray whitespace (a double space would still fail this). Trim only the
    // ends, since the {#if}/{:else} block renders a trailing text node on
    // Svelte 3 that does not appear on Svelte 5.
    expect(label?.textContent?.trim()).toBe("Data Store for Memcache");
    const mark = option.querySelector('[data-testid="mark"]');
    expect(mark).toHaveTextContent("Data");
  });
});

describe("SearchMenu sizes", () => {
  it.each([
    ["defaults the input and menu to xl", {}, "xl", "xl", "sm"],
    [
      "sizes the menu to match the input size",
      { size: "sm" },
      "sm",
      "sm",
      "xl",
    ],
    [
      "decouples the menu size from the input size with menuSize",
      { size: "sm", menuSize: "xl" },
      "sm",
      "xl",
      "sm",
    ],
  ])("%s", async (_, props, inputSize, menuSize, otherMenuSize) => {
    await openMenu(SearchMenu, props);

    expect(
      document.querySelector(`.bx--search--${inputSize}`),
    ).toBeInTheDocument();
    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveClass(`bx--search-menu__menu--${menuSize}`);
    expect(listbox).not.toHaveClass(`bx--search-menu__menu--${otherMenuSize}`);
  });
});

describe("SearchMenu groups", () => {
  it("renders group headers, a view-all link, and link items", async () => {
    await openMenu(SearchMenuGroups);

    expect(screen.getByText("Recent searches")).toBeInTheDocument();
    expect(screen.getByText("Catalog results")).toBeInTheDocument();

    const viewAll = screen.getByText("View all");
    expect(viewAll).toHaveAttribute("href", "/catalog");

    const link = screen.getByText("Data Store for Memcache").closest("a");
    expect(link).toHaveAttribute("href", "#memcache");
  });

  it("closes the menu when the before slot receives focus", async () => {
    await openMenu(SearchMenuBar);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.click(screen.getByTestId("scope"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("renders composed skeleton state with search and menu placeholders", () => {
    render(SearchMenuSkeleton);
    expect(
      document.querySelector(".bx--search-menu .bx--search-input"),
    ).toBeInTheDocument();
    const skeletonItems = document.querySelectorAll(
      ".bx--search-menu-item--skeleton",
    );
    expect(skeletonItems).toHaveLength(3);
    expect(
      document.querySelectorAll(
        ".bx--search-menu-item--skeleton .bx--skeleton__text",
      ),
    ).toHaveLength(3);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("merges a custom class with the skeleton menu classes", () => {
    const { container } = render(SearchMenuSkeletonMenu, {
      props: { size: "sm", class: "custom" },
    });
    const menu = container.querySelector(".bx--search-menu__menu");
    assert(menu);
    expect(menu).toHaveClass(
      "custom",
      "bx--search-menu__menu--inline",
      "bx--search-menu__menu--sm",
    );
    expect(menu).not.toHaveClass("bx--search-menu__menu--xl");
  });

  it("keeps a filter:false group unfiltered and hides empty group headers", async () => {
    const input = await openMenu(SearchMenuGroups);
    await user.type(input, "vpc");

    // Recent searches group opts out of filtering, so both items remain.
    expect(
      screen.getByRole("option", { name: "virtual servers" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "vpc" })).toBeInTheDocument();

    // The catalog group has no matches, so its header is removed.
    expect(screen.queryByText("Catalog results")).not.toBeInTheDocument();

    // Persistent footer action is always shown.
    expect(screen.getByText(/Search .* in Docs/)).toBeInTheDocument();
  });

  it("omits the footer divider when only footer items are visible", async () => {
    await openMenu(SearchMenuFooterDivider);

    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(
      document.querySelector(".bx--search-menu-group--divider"),
    ).not.toBeInTheDocument();
  });

  it("renders the footer divider when primary results are visible", async () => {
    const input = await openMenu(SearchMenuGroups);
    await user.type(input, "vpc");

    expect(
      document.querySelector(".bx--search-menu-group--divider"),
    ).toBeInTheDocument();
  });
});

describe("SearchMenu loadingDelay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function getSkeletons() {
    return document.querySelectorAll(".bx--search-menu-item--skeleton");
  }

  it("shows the loading row after the delay and holds it for the minimum", async () => {
    const { rerender } = render(SearchMenu, { props: { loadingDelay: 300 } });
    screen.getByRole("combobox").focus();
    await rerender({ loading: true });

    expect(screen.getByRole("listbox")).toHaveAttribute("aria-busy", "true");
    expect(getSkeletons()).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(300);
    expect(getSkeletons()).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(100);
    await rerender({ loading: false });
    expect(screen.getByRole("listbox")).not.toHaveAttribute("aria-busy");
    expect(getSkeletons()).toHaveLength(1);

    // Shown at 300 ms, so the 500 ms minimum ends at 800 ms.
    await vi.advanceTimersByTimeAsync(399);
    expect(getSkeletons()).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(getSkeletons()).toHaveLength(0);
  });

  it("delays the searchLoading spinner too", async () => {
    const { rerender } = render(SearchMenu, { props: { loadingDelay: 300 } });
    await rerender({ searchLoading: true });

    expect(screen.getByRole("combobox")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByTitle("Searching")).toBeNull();

    await vi.advanceTimersByTimeAsync(300);
    expect(screen.getByTitle("Searching")).toBeInTheDocument();
  });
});
