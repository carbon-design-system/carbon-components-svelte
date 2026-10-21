import { render } from "@testing-library/svelte";
import { flushDismiss } from "../utils/flush-dismiss";
import { netListenerCalls } from "../utils/net-listener-calls";
import Popover from "./Popover.test.svelte";

describe("Popover window listeners", () => {
  let add: ReturnType<typeof vi.spyOn>;
  let remove: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    add = vi.spyOn(window, "addEventListener");
    remove = vi.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    add.mockRestore();
    remove.mockRestore();
  });

  it("closed popovers register no window click listener", async () => {
    for (let i = 0; i < 5; i++) render(Popover, { props: { open: false } });
    await flushDismiss();
    expect(netListenerCalls(add, remove, "click")).toBe(0);
  });

  it("an open popover registers exactly one window click listener", async () => {
    render(Popover, { props: { open: true } });
    await flushDismiss();
    expect(netListenerCalls(add, remove, "click")).toBe(1);
  });
});
