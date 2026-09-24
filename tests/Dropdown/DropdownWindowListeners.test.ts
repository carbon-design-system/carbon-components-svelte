import { render } from "@testing-library/svelte";
import { flushDismiss } from "../utils/flush-dismiss";
import { netListenerCalls } from "../utils/net-listener-calls";
import Dropdown from "./Dropdown.test.svelte";

describe("Dropdown window listeners", () => {
  it("closed dropdowns register no window click listener", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    for (let i = 0; i < 5; i++) render(Dropdown, { props: { open: false } });
    expect(netListenerCalls(add, remove, "click")).toBe(0);

    add.mockRestore();
    remove.mockRestore();
  });

  it("an open dropdown registers exactly one window click listener", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    render(Dropdown, { props: { open: true } });
    await flushDismiss();
    expect(netListenerCalls(add, remove, "click")).toBe(1);

    add.mockRestore();
    remove.mockRestore();
  });
});
