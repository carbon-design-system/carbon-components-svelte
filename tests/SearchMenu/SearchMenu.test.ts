import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import SearchMenu from "./SearchMenu.test.svelte";
import SearchMenuBar from "./SearchMenuBar.test.svelte";
import SearchMenuFooterDivider from "./SearchMenuFooterDivider.test.svelte";
import SearchMenuGroups from "./SearchMenuGroups.test.svelte";
import SearchMenuHighlight from "./SearchMenuHighlight.test.svelte";
import SearchMenuMatch from "./SearchMenuMatch.test.svelte";
import SearchMenuSkeleton from "./SearchMenuSkeleton.test.svelte";

describe("SearchMenu", () => {
  it("renders a combobox input and no menu until focused", () => {
    render(SearchMenu);
    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("aria-autocomplete", "list");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("opens the menu on focus and renders all items for an empty value", async () => {
    render(SearchMenu);
    const input = screen.getByRole("combobox");
    await user.click(input);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("option")).toHaveLength(4);
  });

  it("fuzzy-filters items by the search value", async () => {
    render(SearchMenu);
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "memcache");
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Data Store for Memcache");
  });

  it("highlights the matched portion of each item", async () => {
    render(SearchMenu);
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "Data");
    // The menu is portaled to document.body, so query the whole document.
    const highlights = document.querySelectorAll(
      ".bx--search-menu-item__highlight",
    );
    expect(highlights.length).toBeGreaterThan(0);
    expect(highlights[0]).toHaveTextContent("Data");
  });

  it("navigates with the arrow keys and selects with Enter", async () => {
    render(SearchMenu);
    const input = screen.getByRole("combobox");
    await user.click(input);
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
  });

  it("dispatches submit when Enter is pressed with no active item", async () => {
    render(SearchMenu);
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "no-match-here");
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("result")).toHaveTextContent(
      "submit:no-match-here",
    );
  });

  it("closes on Escape and preserves the value", async () => {
    render(SearchMenu);
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "Data");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input).toHaveValue("Data");
  });

  it("closes on an outside click", async () => {
    render(SearchMenu);
    const input = screen.getByRole("combobox");
    await user.click(input);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.click(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("dispatches close with the escape-key trigger", async () => {
    render(SearchMenu);
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "Data");
    await user.keyboard("{Escape}");
    expect(screen.getByTestId("close")).toHaveTextContent("escape-key");
  });

  it("dispatches close with the select trigger when an item is chosen", async () => {
    render(SearchMenu);
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{ArrowDown}{Enter}");
    expect(screen.getByTestId("close")).toHaveTextContent("select");
  });

  it("dispatches close with the outside-click trigger", async () => {
    render(SearchMenu);
    const input = screen.getByRole("combobox");
    await user.click(input);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    // fireEvent does not move focus, so the dismiss handler (not blur) closes.
    await fireEvent.click(document.body);
    expect(screen.getByTestId("close")).toHaveTextContent("outside-click");
  });

  it("dispatches close with the blur trigger when focus leaves", async () => {
    render(SearchMenu);
    const input = screen.getByRole("combobox");
    await user.click(input);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await fireEvent.blur(input);
    expect(screen.getByTestId("close")).toHaveTextContent("blur");
  });

  it("forwards the keyup input event", async () => {
    render(SearchMenu);
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("a");
    expect(screen.getByTestId("events")).toHaveTextContent("keyup");
  });

  it("dispatches select when an item is clicked", async () => {
    render(SearchMenu);
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.click(screen.getByText("Data Store for Memcache"));
    expect(screen.getByTestId("result")).toHaveTextContent(
      "Data Store for Memcache",
    );
    expect(screen.getByTestId("close")).toHaveTextContent("select");
  });

  it("highlights an item on hover", async () => {
    render(SearchMenu);
    const input = screen.getByRole("combobox");
    await user.click(input);
    const option = screen.getByText("Data Store for Memcache");
    await user.hover(option);
    expect(option.closest('[role="option"]')).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("does not open when disabled", async () => {
    render(SearchMenu, { props: { disabled: true } });
    const input = screen.getByRole("combobox");
    await user.click(input);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("uses a custom match function for filtering and highlighting", async () => {
    render(SearchMenuMatch);
    const input = screen.getByRole("combobox");
    await user.click(input);
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
    render(SearchMenuMatch, {
      props: { match: () => ({ matched: true }) },
    });
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "zzz");
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(
      document.querySelectorAll(".bx--search-menu-item__highlight"),
    ).toHaveLength(0);
  });

  it("renders a skeleton menu while loading", async () => {
    render(SearchMenu, { props: { loading: true } });
    const input = screen.getByRole("combobox");
    await user.click(input);
    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute("aria-busy", "true");
    // Default skeleton rows render, and the slot items do not.
    expect(
      document.querySelectorAll(".bx--search-menu-item--skeleton"),
    ).toHaveLength(4);
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  it("renders all items but still highlights when shouldFilter is false", async () => {
    render(SearchMenu, { props: { shouldFilter: false } });
    const input = screen.getByRole("combobox");
    await user.click(input);
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
    render(SearchMenuHighlight);
    const input = screen.getByRole("combobox");
    await user.click(input);
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
  it("defaults the input and menu to the xl size", async () => {
    render(SearchMenu);
    const input = screen.getByRole("combobox");
    await user.click(input);
    expect(document.querySelector(".bx--search--xl")).toBeInTheDocument();
    expect(screen.getByRole("listbox")).toHaveClass(
      "bx--search-menu__menu--xl",
    );
  });

  it("sizes the menu to match the input size by default", async () => {
    render(SearchMenu, { props: { size: "sm" } });
    const input = screen.getByRole("combobox");
    await user.click(input);
    expect(document.querySelector(".bx--search--sm")).toBeInTheDocument();
    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveClass("bx--search-menu__menu--sm");
    expect(listbox).not.toHaveClass("bx--search-menu__menu--xl");
  });

  it("decouples the menu size from the input size with menuSize", async () => {
    render(SearchMenu, { props: { size: "sm", menuSize: "xl" } });
    const input = screen.getByRole("combobox");
    await user.click(input);
    // The input keeps its own size; only the menu follows menuSize.
    expect(document.querySelector(".bx--search--sm")).toBeInTheDocument();
    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveClass("bx--search-menu__menu--xl");
    expect(listbox).not.toHaveClass("bx--search-menu__menu--sm");
  });
});

describe("SearchMenu groups", () => {
  it("renders group headers, a view-all link, and link items", async () => {
    render(SearchMenuGroups);
    const input = screen.getByRole("combobox");
    await user.click(input);

    expect(screen.getByText("Recent searches")).toBeInTheDocument();
    expect(screen.getByText("Catalog results")).toBeInTheDocument();

    const viewAll = screen.getByText("View all");
    expect(viewAll).toHaveAttribute("href", "/catalog");

    const link = screen.getByText("Data Store for Memcache").closest("a");
    expect(link).toHaveAttribute("href", "#memcache");
  });

  it("closes the menu when the before slot receives focus", async () => {
    render(SearchMenuBar);
    const input = screen.getByRole("combobox");
    await user.click(input);
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

  it("keeps a filter:false group unfiltered and hides empty group headers", async () => {
    render(SearchMenuGroups);
    const input = screen.getByRole("combobox");
    await user.click(input);
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
    render(SearchMenuFooterDivider);
    const input = screen.getByRole("combobox");
    await user.click(input);

    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(
      document.querySelector(".bx--search-menu-group--divider"),
    ).not.toBeInTheDocument();
  });

  it("renders the footer divider when primary results are visible", async () => {
    render(SearchMenuGroups);
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "vpc");

    expect(
      document.querySelector(".bx--search-menu-group--divider"),
    ).toBeInTheDocument();
  });
});
