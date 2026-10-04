import { render, screen } from "@testing-library/svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
import { user } from "../utils/user";
import UiShell from "./UIShell.test.svelte";

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event("resize"));
}

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
