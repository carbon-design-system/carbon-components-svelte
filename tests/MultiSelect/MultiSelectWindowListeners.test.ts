import { render } from "@testing-library/svelte";
import { flushDismiss } from "../utils/flush-dismiss";
import { netListenerCalls } from "../utils/net-listener-calls";
import MultiSelect from "./MultiSelect.test.svelte";

describe("MultiSelect window listeners", () => {
  it("closed MultiSelects register no window click/focusin listeners", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    for (let i = 0; i < 5; i++) {
      render(MultiSelect, { props: { open: false } });
    }

    expect(netListenerCalls(add, remove, "click")).toBe(0);
    expect(netListenerCalls(add, remove, "focusin")).toBe(0);

    add.mockRestore();
    remove.mockRestore();
  });

  it("an open MultiSelect registers one click and one focusin listener", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");

    render(MultiSelect, { props: { open: true } });
    await flushDismiss();
    expect(netListenerCalls(add, remove, "click")).toBe(1);
    expect(netListenerCalls(add, remove, "focusin")).toBe(1);

    add.mockRestore();
    remove.mockRestore();
  });
});
