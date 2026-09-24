import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ContextMenuClose from "./ContextMenuClose.test.svelte";
import ContextMenuFocusReturn from "./ContextMenuFocusReturn.test.svelte";

describe("ContextMenu close trigger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should surface 'escape-key' when closed via Escape", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContextMenuClose, { props: { open: true, x: 100, y: 100 } });

    await user.keyboard("{Escape}");
    expect(consoleLog).toHaveBeenCalledWith("close", "escape-key");
  });

  it("should surface 'outside-click' when closed via clicking outside", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContextMenuClose, { props: { open: true, x: 100, y: 100 } });

    await user.click(document.body);
    expect(consoleLog).toHaveBeenCalledWith("close", "outside-click");
  });

  it("should surface 'select' when closed by selecting an option", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContextMenuClose, { props: { open: true, x: 100, y: 100 } });

    await user.click(screen.getByText("Option 1"));
    expect(consoleLog).toHaveBeenCalledWith("close", "select");
  });

  it("should surface 'tab' and close the menu when Tab is pressed", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContextMenuClose, { props: { open: true, x: 100, y: 100 } });

    const menu = screen.getAllByRole("menu")[0];
    menu.focus();

    await user.keyboard("{Tab}");
    expect(consoleLog).toHaveBeenCalledWith("close", "escape-key");
    expect(menu).not.toHaveClass("bx--menu--open");
  });

  it("should not close the menu when ArrowDown is pressed", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ContextMenuClose, { props: { open: true, x: 100, y: 100 } });

    const menu = screen.getAllByRole("menu")[0];
    menu.focus();

    await user.keyboard("{ArrowDown}");
    expect(consoleLog).not.toHaveBeenCalledWith("close", expect.anything());
    expect(menu).toHaveClass("bx--menu--open");
  });

  it("should move focus to the element after the opener when Tab is pressed", async () => {
    render(ContextMenuFocusReturn);

    const host = screen.getByRole("button", { name: "Host" });
    await user.pointer({
      target: host,
      coords: { x: 100, y: 100 },
      keys: "[MouseRight]",
    });
    await user.keyboard("{ArrowDown}");
    expect(screen.getAllByRole("menuitem")[0]).toHaveFocus();

    await user.keyboard("{Tab}");
    expect(screen.getByRole("button", { name: "After host" })).toHaveFocus();
  });

  it("should block scroll keys and letter keys used for typeahead", async () => {
    render(ContextMenuClose, { props: { open: true, x: 100, y: 100 } });

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
