import { render } from "@testing-library/svelte";
import { flushDismiss } from "../utils/flush-dismiss";
import { netListenerCalls } from "../utils/net-listener-calls";
import { user } from "../utils/user";
import ComboBox from "./ComboBox.test.svelte";

describe("ComboBox window listeners", () => {
  it("closed combo boxes register no window click listener", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    for (let i = 0; i < 5; i++) render(ComboBox, { props: { open: false } });
    expect(netListenerCalls(add, remove, "click")).toBe(0);

    add.mockRestore();
    remove.mockRestore();
  });

  it("an open combo box registers exactly one window click listener", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    render(ComboBox, { props: { open: true } });
    await flushDismiss();
    expect(netListenerCalls(add, remove, "click")).toBe(1);

    add.mockRestore();
    remove.mockRestore();
  });

  it("closing a combo box removes the window click listener", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    render(ComboBox, { props: { open: true } });
    await flushDismiss();
    expect(netListenerCalls(add, remove, "click")).toBe(1);

    // An outside click closes the menu, which must tear down the listener.
    await user.click(document.body);
    expect(netListenerCalls(add, remove, "click")).toBe(0);

    add.mockRestore();
    remove.mockRestore();
  });
});
