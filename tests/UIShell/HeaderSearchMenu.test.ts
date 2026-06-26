import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import HeaderSearchMenu from "./HeaderSearchMenu.test.svelte";

describe("HeaderSearch (menu slot)", () => {
  it("renders a listbox when active instead of the results menu", async () => {
    render(HeaderSearchMenu, { props: { active: true } });

    const listbox = await screen.findByRole("listbox");
    expect(listbox).toBeInTheDocument();
    // role="menu" is not used when the menu slot is present.
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    // Four filterable items + one persistent footer item.
    expect(screen.getAllByRole("option")).toHaveLength(5);
    expect(screen.getByText("Results")).toBeInTheDocument();
  });

  it("does not render the menu when inactive", () => {
    render(HeaderSearchMenu, { props: { active: false } });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("fuzzy-filters items while keeping persistent items visible", async () => {
    render(HeaderSearchMenu, { props: { active: true } });
    const input = screen.getByRole("combobox");
    await user.type(input, "memcache");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent("Data Store for Memcache");
    // Persistent footer item stays visible when other items match.
    expect(options[1]).toHaveTextContent("Search everywhere");
  });

  it("keeps only persistent items for a no-match query", async () => {
    render(HeaderSearchMenu, { props: { active: true } });
    const input = screen.getByRole("combobox");
    await user.type(input, "zzzznomatch");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Search everywhere");
  });

  it("highlights the matched portion of each item", async () => {
    const { container } = render(HeaderSearchMenu, { props: { active: true } });
    const input = screen.getByRole("combobox");
    await user.type(input, "Data");

    const highlights = container.querySelectorAll(
      ".bx--search-menu-item__highlight",
    );
    expect(highlights.length).toBeGreaterThan(0);
    expect(highlights[0]).toHaveTextContent("Data");
  });

  it("navigates with the arrow keys and selects with Enter", async () => {
    render(HeaderSearchMenu, { props: { active: true } });
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
    // Selecting an item closes the menu (the bar collapses).
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("dispatches submit when Enter is pressed with no active item", async () => {
    render(HeaderSearchMenu, { props: { active: true } });
    const input = screen.getByRole("combobox");
    await user.type(input, "free text");
    await user.keyboard("{Enter}");

    expect(screen.getByTestId("result")).toHaveTextContent("submit:free text");
  });

  it("closes the menu on Escape but preserves the value and active state", async () => {
    render(HeaderSearchMenu, { props: { active: true } });
    const input = screen.getByRole("combobox");
    await user.type(input, "Data");
    expect(await screen.findByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input).toHaveValue("Data");
    expect(screen.getByRole("search")).toHaveClass(
      "bx--header__search--active",
    );
    expect(screen.getByTestId("close")).toHaveTextContent("");
  });

  it("sets aria-expanded and aria-controls on the input", async () => {
    render(HeaderSearchMenu, { props: { active: true } });
    const input = screen.getByRole("combobox");
    const listbox = await screen.findByRole("listbox");

    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(input).toHaveAttribute("aria-controls", listbox.id);
  });

  it("defaults to the small (compact) size", async () => {
    const { container } = render(HeaderSearchMenu, { props: { active: true } });
    await screen.findByRole("listbox");

    const menu = container.querySelector(".bx--header__search-menu-rich");
    expect(menu).toHaveClass("bx--header__search-menu-rich--sm");
  });

  it("applies the requested size", async () => {
    const { container } = render(HeaderSearchMenu, {
      props: { active: true, size: "xl" },
    });
    await screen.findByRole("listbox");

    const menu = container.querySelector(".bx--header__search-menu-rich");
    expect(menu).toHaveClass("bx--header__search-menu-rich--xl");
  });
});
