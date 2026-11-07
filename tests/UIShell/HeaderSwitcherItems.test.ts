import { render, screen, within } from "@testing-library/svelte";
import { user } from "../utils/user";
import HeaderSwitcherItems from "./HeaderSwitcherItems.test.svelte";

describe("HeaderSwitcher items", () => {
  it("names the trigger from the selected item and marks it as current", () => {
    render(HeaderSwitcherItems);

    expect(
      screen.getByRole("button", { name: "Acme Corp", expanded: true }),
    ).toBeInTheDocument();
    const current = document.querySelectorAll("[aria-current='true']");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("Acme Corp");
  });

  it("names each group, and renders an item with an href as a link", () => {
    render(HeaderSwitcherItems);

    const accounts = screen.getByRole("group", { name: "Accounts" });
    expect(within(accounts).getAllByRole("button")).toHaveLength(3);
    const apps = screen.getByRole("group", { name: "Apps" });
    expect(within(apps).getByRole("link")).toHaveAttribute("href", "#console");
  });

  it("selects an item: updates selectedId, dispatches select and closes", async () => {
    const onSelect = vi.fn();
    render(HeaderSwitcherItems, { props: { onSelect } });

    await user.click(screen.getByRole("button", { name: "Globex" }));

    expect(screen.getByTestId("selected")).toHaveTextContent("globex");
    expect(onSelect.mock.calls[0][0].detail).toMatchObject({
      selectedId: "globex",
      selectedItem: { id: "globex" },
    });
    expect(screen.queryByRole("group", { name: "Accounts" })).toBeNull();
  });

  it("filters the list as you type and reports the query", async () => {
    const onFilter = vi.fn();
    render(HeaderSwitcherItems, { props: { onFilter } });

    await user.type(screen.getByRole("searchbox"), "zoe");

    expect(screen.getByRole("button", { name: "Zoë Personal" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Globex" })).toBeNull();
    expect(screen.queryByRole("group", { name: "Apps" })).toBeNull();
    expect(onFilter.mock.calls.at(-1)?.[0].detail).toEqual({ query: "zoe" });
  });

  it("shows no filter field below searchThreshold", () => {
    render(HeaderSwitcherItems, { props: { searchThreshold: 5 } });

    expect(screen.queryByRole("searchbox")).toBeNull();
  });

  it("shows the empty text when nothing matches", async () => {
    render(HeaderSwitcherItems);

    await user.type(screen.getByRole("searchbox"), "zzz");

    expect(screen.getByText("No accounts found")).toBeVisible();
  });

  it("clears the field on the first Escape and closes on the second", async () => {
    render(HeaderSwitcherItems);
    const search = screen.getByRole("searchbox");

    await user.type(search, "glo");
    await user.keyboard("{Escape}");
    expect(search).toHaveValue("");
    expect(screen.getByRole("searchbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("searchbox")).toBeNull();
  });

  it("shows the current account's name and description when showDetail is set", () => {
    render(HeaderSwitcherItems, { props: { showDetail: true } });

    const detail = document.querySelector(".bx--profile-menu__header");
    expect(detail).toHaveTextContent("Acme Corp");
    expect(detail).toHaveTextContent("Engineering");
  });

  it("lists recent accounts under a heading, and adds the one left when switching", async () => {
    render(HeaderSwitcherItems, { props: { recentIds: ["zoe"] } });

    const recent = screen.getByRole("group", { name: "Recent" });
    expect(within(recent).getAllByRole("button")).toHaveLength(1);
    // It left the Accounts group, so it is read once.
    expect(
      screen.getAllByRole("button", { name: "Zoë Personal" }),
    ).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Globex" }));

    expect(screen.getByTestId("recent")).toHaveTextContent('["acme","zoe"]');
  });

  it("has no recent section unless recentIds is set", () => {
    render(HeaderSwitcherItems);

    expect(screen.queryByRole("group", { name: "Recent" })).toBeNull();
  });
});
