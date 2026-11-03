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

  it("open popovers share one window resize listener, removed on close", async () => {
    const first = render(Popover, { props: { open: true } });
    render(Popover, { props: { open: true } });
    render(Popover, { props: { open: false } });
    expect(netListenerCalls(add, remove, "resize")).toBe(1);
    await first.rerender({ open: false });
    expect(netListenerCalls(add, remove, "resize")).toBe(1);
    first.unmount();
    expect(netListenerCalls(add, remove, "resize")).toBe(1);
  });

  it("a closed or relative popover listens for no resize", () => {
    render(Popover, { props: { open: false } });
    render(Popover, { props: { open: true, relative: true } });
    expect(netListenerCalls(add, remove, "resize")).toBe(0);
  });
});
