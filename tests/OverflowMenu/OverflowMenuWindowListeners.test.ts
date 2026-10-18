import { render, screen } from "@testing-library/svelte";
import { netListenerCalls } from "../utils/net-listener-calls";
import { user } from "../utils/user";
import OverflowMenu from "./OverflowMenu.test.svelte";

describe("OverflowMenu window listeners", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opening adds one window click listener, closing removes it", async () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    for (let i = 0; i < 5; i++) {
      render(OverflowMenu, { props: { id: `menu-${i}` } });
    }
    expect(netListenerCalls(addSpy, removeSpy, "click")).toBe(0);

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);
    expect(netListenerCalls(addSpy, removeSpy, "click")).toBe(1);

    await user.keyboard("{Escape}");
    expect(netListenerCalls(addSpy, removeSpy, "click")).toBe(0);
  });
});
