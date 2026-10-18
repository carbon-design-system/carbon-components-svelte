import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ContextMenu from "./ContextMenu.test.svelte";
import ContextMenuFocusReturn from "./ContextMenuFocusReturn.test.svelte";
import { rightClick } from "./helpers";

describe("ContextMenu close trigger", () => {
  it("should surface 'escape-key' when closed via Escape", async () => {
    const onclose = vi.fn();
    render(ContextMenu, { props: { open: true, x: 100, y: 100, onclose } });

    await user.keyboard("{Escape}");
    expect(onclose).toHaveBeenCalledWith("escape-key");
  });

  it("should surface 'outside-click' when closed via clicking outside", async () => {
    const onclose = vi.fn();
    render(ContextMenu, { props: { open: true, x: 100, y: 100, onclose } });

    await user.click(document.body);
    expect(onclose).toHaveBeenCalledWith("outside-click");
  });

  it("should surface 'select' when closed by selecting an option", async () => {
    const onclose = vi.fn();
    render(ContextMenu, { props: { open: true, x: 100, y: 100, onclose } });

    await user.click(screen.getByText("Option 1"));
    expect(onclose).toHaveBeenCalledWith("select");
  });

  it("should surface 'tab' and close the menu when Tab is pressed", async () => {
    const onclose = vi.fn();
    render(ContextMenu, { props: { open: true, x: 100, y: 100, onclose } });

    const menu = screen.getAllByRole("menu")[0];
    menu.focus();

    await user.keyboard("{Tab}");
    expect(onclose).toHaveBeenCalledWith("escape-key");
    expect(menu).not.toHaveClass("bx--menu--open");
  });

  it("should move focus to the element after the opener when Tab is pressed", async () => {
    render(ContextMenuFocusReturn);

    const host = screen.getByRole("button", { name: "Host" });
    await rightClick(host);
    await user.keyboard("{ArrowDown}");
    expect(screen.getAllByRole("menuitem")[0]).toHaveFocus();

    await user.keyboard("{Tab}");
    expect(screen.getByRole("button", { name: "After host" })).toHaveFocus();
  });

  it("should block scroll keys and letter keys used for typeahead", async () => {
    render(ContextMenu, { props: { open: true, x: 100, y: 100 } });

    const menu = screen.getAllByRole("menu")[0];

    expect(await fireEvent.keyDown(menu, { key: "ArrowRight" })).toBe(false);
    expect(await fireEvent.keyDown(menu, { key: "PageDown" })).toBe(false);
    // A plain letter key now drives typeahead search, so it is blocked too.
    expect(await fireEvent.keyDown(menu, { key: "a" })).toBe(false);
    // A modified letter key (e.g. a shortcut) is left alone.
    expect(await fireEvent.keyDown(menu, { key: "a", ctrlKey: true })).toBe(
      true,
    );
  });
});
