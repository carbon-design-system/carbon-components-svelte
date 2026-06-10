import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import ContextMenu from "./ContextMenu.test.svelte";

const net = (
  add: ReturnType<typeof vi.spyOn>,
  remove: ReturnType<typeof vi.spyOn>,
  type: string,
) =>
  add.mock.calls.filter((c: unknown[]) => c[0] === type).length -
  remove.mock.calls.filter((c: unknown[]) => c[0] === type).length;

describe("ContextMenu window listeners", () => {
  test("closed menus register no click/keydown listeners", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    const N = 5;
    for (let i = 0; i < N; i++) render(ContextMenu, { props: { open: false } });

    expect(net(add, remove, "click")).toBe(0);
    expect(net(add, remove, "keydown")).toBe(0);
    expect(net(add, remove, "contextmenu")).toBe(N);

    add.mockRestore();
    remove.mockRestore();
  });

  test("an open menu registers one click and one keydown listener", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    render(ContextMenu, { props: { open: true } });
    expect(net(add, remove, "click")).toBe(1);
    expect(net(add, remove, "keydown")).toBe(1);

    add.mockRestore();
    remove.mockRestore();
  });

  test("submenu options register the hover mousemove listener only while open", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    render(ContextMenu, { props: { open: true, withSubmenu: true } });
    // The parent option's global mousemove handler is idle until its submenu opens.
    expect(net(add, remove, "mousemove")).toBe(0);

    await fireEvent.click(screen.getByText("Option with submenu"));
    await tick();
    expect(net(add, remove, "mousemove")).toBe(1);

    add.mockRestore();
    remove.mockRestore();
  });
});
