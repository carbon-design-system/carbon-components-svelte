import { render } from "@testing-library/svelte";
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
});
