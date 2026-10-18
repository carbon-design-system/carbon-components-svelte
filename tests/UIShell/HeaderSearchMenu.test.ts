import { render, screen } from "@testing-library/svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
import { user } from "../utils/user";
import HeaderSearchMenu from "./HeaderSearchMenu.test.svelte";

describe("HeaderSearch (menu slot)", () => {
  it("renders a listbox when active instead of the results menu", async () => {
    render(HeaderSearchMenu, { props: { active: true } });

    const listbox = await screen.findByRole("listbox");
    expect(listbox).toBeInTheDocument();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    // Four filterable items + one persistent footer item.
    expect(screen.getAllByRole("option")).toHaveLength(5);
    expect(screen.getByText("Results")).toBeInTheDocument();
  });

  it("fuzzy-filters items while keeping persistent items visible", async () => {
    render(HeaderSearchMenu, { props: { active: true } });
    const input = screen.getByRole("combobox");
    await user.type(input, "memcache");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent("Data Store for Memcache");
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

  it("keeps focus in the input when a group header is pressed", async () => {
    render(HeaderSearchMenu, { props: { active: true } });
    const input = screen.getByRole("combobox");
    input.focus();

    await user.click(screen.getByText("Results"));

    expect(input).toHaveFocus();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("navigates with the arrow keys and selects with Enter", async () => {
    const onSelect = vi.fn();
    const onSubmit = vi.fn();
    render(HeaderSearchMenu, { props: { active: true, onSelect, onSubmit } });
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{ArrowDown}");

    const firstOption = screen.getAllByRole("option")[0];
    expect(firstOption).toHaveAttribute("aria-selected", "true");
    expect(input).toHaveAttribute("aria-activedescendant", firstOption.id);

    await user.keyboard("{Enter}");

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ value: "Databases for TestSQL" }),
    );
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("dispatches submit when Enter is pressed with no active item", async () => {
    const onSubmit = vi.fn();
    render(HeaderSearchMenu, { props: { active: true, onSubmit } });
    const input = screen.getByRole("combobox");
    await user.type(input, "free text");
    await user.keyboard("{Enter}");

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ value: "free text" }),
    );
  });

  it("closes the menu on Escape but preserves the value and active state", async () => {
    const onClose = vi.fn();
    render(HeaderSearchMenu, { props: { active: true, onClose } });
    const input = screen.getByRole("combobox");
    await user.type(input, "Data");
    expect(await screen.findByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input).toHaveValue("Data");
    expect(screen.getByRole("search")).toHaveClass(
      "bx--header__search--active",
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it("moves the highlight up with ArrowUp", async () => {
    render(HeaderSearchMenu, { props: { active: true } });
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowUp}");

    const first = screen.getAllByRole("option")[0];
    expect(input).toHaveAttribute("aria-activedescendant", first.id);
  });

  it.each([
    ["Home", 0],
    ["End", 4],
  ])("jumps the highlight with %s", async (key, index) => {
    render(HeaderSearchMenu, { props: { active: true } });
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{ArrowDown}{ArrowDown}");
    await user.keyboard(`{${key}}`);

    const option = screen.getAllByRole("option")[index];
    expect(input).toHaveAttribute("aria-activedescendant", option.id);
  });

  it("closes the search and returns focus when Escape is pressed on an empty value", async () => {
    const onClose = vi.fn();
    render(HeaderSearchMenu, { props: { active: true, onClose } });
    await user.click(screen.getByRole("combobox"));

    // The first Escape only dismisses the open menu.
    await user.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
    await user.keyboard("{Escape}");
    await flushMacrotask();

    expect(onClose).toHaveBeenCalledWith({ trigger: "escape-key" });
    expect(screen.getByRole("search")).not.toHaveClass(
      "bx--header__search--active",
    );
    expect(screen.getByRole("button", { name: "Search" })).toHaveFocus();
  });

  it.each([
    ["ArrowDown", "{ArrowDown}"],
    ["typing", "x"],
  ])("reopens the menu after Escape when %s", async (_, keys) => {
    render(HeaderSearchMenu, { props: { active: true } });
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{Escape}");
    expect(input).toHaveAttribute("aria-expanded", "false");

    await user.keyboard(keys);

    expect(input).toHaveAttribute("aria-expanded", "true");
  });

  it("shows a busy skeleton menu while loading", async () => {
    const { container } = render(HeaderSearchMenu, {
      props: { active: true, loading: true },
    });

    expect(await screen.findByRole("listbox")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(
      container.querySelectorAll(".bx--search-menu-item--skeleton"),
    ).toHaveLength(4);
  });

  it("renders skeletonCount skeleton rows while loading", async () => {
    const { container } = render(HeaderSearchMenu, {
      props: { active: true, loading: true, skeletonCount: 2 },
    });
    await screen.findByRole("listbox");

    expect(
      container.querySelectorAll(".bx--search-menu-item--skeleton"),
    ).toHaveLength(2);
  });

  it("renders the noResults slot when nothing matches", async () => {
    render(HeaderSearchMenu, { props: { active: true, footer: false } });
    await user.type(screen.getByRole("combobox"), "zzzznomatch");

    expect(screen.getByText("No results")).toBeVisible();
  });

  it("keeps non-matching items when shouldFilter is false", async () => {
    render(HeaderSearchMenu, { props: { active: true, shouldFilter: false } });
    await user.type(screen.getByRole("combobox"), "zzzznomatch");

    expect(screen.getAllByRole("option")).toHaveLength(5);
  });

  it("filters with a custom match function", async () => {
    const match = (text: string, query: string) => ({
      matched: text.startsWith(query),
    });
    render(HeaderSearchMenu, { props: { active: true, match } });
    await user.type(screen.getByRole("combobox"), "Data");

    // Fuzzy matching would also keep "AT&T IoT Data Plans" and the API row.
    expect(
      screen.getAllByRole("option").map((option) => option.textContent?.trim()),
    ).toEqual([
      "Databases for TestSQL",
      "Data Store for Memcache",
      "Search everywhere",
    ]);
  });

  it("sets aria-expanded and aria-controls on the input", async () => {
    render(HeaderSearchMenu, { props: { active: true } });
    const input = screen.getByRole("combobox");
    const listbox = await screen.findByRole("listbox");

    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(input).toHaveAttribute("aria-controls", listbox.id);
  });

  it.each([
    [undefined, "sm"],
    ["lg", "lg"],
    ["xl", "xl"],
  ] as const)(
    "renders the %s size with the %s modifier",
    async (size, modifier) => {
      const { container } = render(HeaderSearchMenu, {
        props: { active: true, size },
      });
      await screen.findByRole("listbox");

      const menu = container.querySelector(".bx--header__search-menu-rich");
      expect(menu).toHaveClass(`bx--header__search-menu-rich--${modifier}`);
    },
  );
});
