import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ContextMenuOptionKeepOpenFixture from "./ContextMenuOption.keepOpen.test.svelte";

describe("ContextMenuOption keep open on selection", () => {
  const getSelectedIds = () =>
    JSON.parse(screen.getByTestId("selected-ids").textContent || "[]");
  const getSelectedId = () => screen.getByTestId("selected-id").textContent;

  it("keeps the menu open when click is prevented and still toggles selection", async () => {
    render(ContextMenuOptionKeepOpenFixture, {
      props: { open: true, x: 100, y: 100 },
    });

    await user.click(screen.getByRole("menuitemcheckbox", { name: "Date" }));

    expect(screen.getAllByRole("menu")[0]).toHaveClass("bx--menu--open");
    expect(getSelectedIds()).toEqual(["date"]);
  });

  it("keeps nested and root menus open when a radio click is prevented", async () => {
    render(ContextMenuOptionKeepOpenFixture, {
      props: { open: true, x: 100, y: 100 },
    });

    await user.hover(screen.getByRole("menuitem", { name: "View as" }));
    const gridOption = await screen.findByRole("menuitemradio", {
      name: "Grid",
    });
    await user.click(gridOption);

    expect(getSelectedId()).toBe("grid");

    const menus = screen.getAllByRole("menu");
    for (const menu of menus) {
      expect(menu).toHaveClass("bx--menu--open");
    }
  });
});
