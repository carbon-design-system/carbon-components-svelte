import { render } from "@testing-library/svelte";
import { flushDismiss } from "../utils/flush-dismiss";
import { netListenerCalls } from "../utils/net-listener-calls";
import ContextMenu from "./ContextMenu.test.svelte";

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
