import { render, screen } from "@testing-library/svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
import { user } from "../utils/user";
import { setViewportWidth } from "../utils/viewport";
import UiShell from "./UIShell.test.svelte";

describe("SideNav overlay click", () => {
  afterEach(() => {
    setViewportWidth(1024);
  });

  it("closes the mobile side nav and refocuses the hamburger", async () => {
    setViewportWidth(500);
    const { component, container } = render(UiShell, {
      props: { sideNavIsOpen: true },
    });
    await flushMacrotask();

    const hamburger = screen.getByRole("button", { name: /menu/i });
    const overlay = container.querySelector(".bx--side-nav__overlay");
    assert(overlay instanceof HTMLElement);
    await user.click(overlay);

    expect(component.sideNavIsOpen).toBe(false);
    expect(hamburger).toHaveFocus();
  });
});
