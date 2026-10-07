import { render } from "@testing-library/svelte";
import SideNavRailHover from "./SideNavRailHover.test.svelte";

// jsdom doesn't run CSS transitions; `e2e/side-nav-rail.test.ts` checks the
// delays in a real browser.
const ENTER = "--ccs-side-nav-rail-enter-delay";
const LEAVE = "--ccs-side-nav-rail-leave-delay";

function getNav(container: HTMLElement) {
  return container.querySelector(".bx--side-nav") as HTMLElement;
}

describe("SideNav rail hover delay", () => {
  it("sets the default delays on a rail", () => {
    const { container } = render(SideNavRailHover);
    const nav = getNav(container);
    expect(nav.style.getPropertyValue(ENTER)).toBe("100ms");
    expect(nav.style.getPropertyValue(LEAVE)).toBe("0ms");
  });

  it("sets custom delays", () => {
    const { container } = render(SideNavRailHover, {
      props: { enterDelayMs: 300, leaveDelayMs: 200 },
    });
    const nav = getNav(container);
    expect(nav.style.getPropertyValue(ENTER)).toBe("300ms");
    expect(nav.style.getPropertyValue(LEAVE)).toBe("200ms");
  });

  it("updates the delays when the props change", async () => {
    const { container, rerender } = render(SideNavRailHover);
    await rerender({ enterDelayMs: 500 });
    expect(getNav(container).style.getPropertyValue(ENTER)).toBe("500ms");
  });

  it("omits the delays without rail", () => {
    const { container } = render(SideNavRailHover, {
      props: { rail: false },
    });
    const nav = getNav(container);
    expect(nav.style.getPropertyValue(ENTER)).toBe("");
    expect(nav.style.getPropertyValue(LEAVE)).toBe("");
  });
});
