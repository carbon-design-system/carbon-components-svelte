import { render, screen } from "@testing-library/svelte";
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
