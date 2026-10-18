import { fireEvent, render, screen } from "@testing-library/svelte";
import { flushDismiss } from "../utils/flush-dismiss";
import { netListenerCalls } from "../utils/net-listener-calls";
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

describe("ContextMenu focus return", () => {
  it("should return focus to the opener when closed via Escape", async () => {
    render(ContextMenuFocusReturn);

    const host = screen.getByRole("button", { name: "Host" });
    await rightClick(host);
    await user.keyboard("{ArrowDown}");
    expect(screen.getAllByRole("menuitem")[0]).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(host).toHaveFocus();
  });

  it("should return focus to the opener when closed by selecting an option", async () => {
    render(ContextMenuFocusReturn);

    const host = screen.getByRole("button", { name: "Host" });
    await rightClick(host);

    await user.click(screen.getByText("Option 1"));
    expect(host).toHaveFocus();
  });

  it("should release focus when the opener can't take it", async () => {
    render(ContextMenuFocusReturn);

    const nonFocusable = screen.getByText("Non-focusable target");
    await rightClick(nonFocusable);
    await user.keyboard("{ArrowDown}");
    expect(screen.getAllByRole("menuitem")[0]).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryAllByRole("menuitem")).not.toContain(
      document.activeElement,
    );
  });

  it("should return focus to the enclosing button when an icon is right-clicked", async () => {
    const { container } = render(ContextMenuFocusReturn);

    const iconHost = container.querySelector<HTMLElement>("#icon-host");
    assert(iconHost);
    const icon = container.querySelector<SVGElement>("#icon");
    assert(icon);
    await rightClick(icon);
    await user.keyboard("{ArrowDown}");
    expect(screen.getAllByRole("menuitem")[0]).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(iconHost).toHaveFocus();
  });

  it("should return focus to the button that opened the menu programmatically", async () => {
    render(ContextMenuFocusReturn);

    // Open and close once via right click on the host, so `openDetail`
    // holds a stale reference to it.
    const host = screen.getByRole("button", { name: "Host" });
    await rightClick(host);
    await user.keyboard("{Escape}");
    expect(host).toHaveFocus();

    const trigger = screen.getByRole("button", { name: "Open via code" });
    await user.click(trigger);
    await user.keyboard("{ArrowDown}");
    expect(screen.getAllByRole("menuitem")[0]).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
  });
});

describe("ContextMenu window listeners", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("closed menus register no click/keydown listeners", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    const N = 5;
    for (let i = 0; i < N; i++) render(ContextMenu, { props: { open: false } });

    expect(netListenerCalls(add, remove, "click")).toBe(0);
    expect(netListenerCalls(add, remove, "keydown")).toBe(0);
    expect(netListenerCalls(add, remove, "contextmenu")).toBe(N);
  });

  it("an open menu registers one click and one keydown listener", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    render(ContextMenu, { props: { open: true } });
    await flushDismiss();
    expect(netListenerCalls(add, remove, "click")).toBe(1);
    expect(netListenerCalls(add, remove, "keydown")).toBe(1);
  });
});
