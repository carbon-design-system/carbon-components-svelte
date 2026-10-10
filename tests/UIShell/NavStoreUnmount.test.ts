import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { get } from "svelte/store";
import {
  isHeaderRendered,
  isSideNavCollapsed,
  isSideNavRail,
} from "../../src/UIShell/nav-store.js";
import NavStoreUnmount from "./NavStoreUnmount.test.svelte";

describe("UI Shell shared state on unmount", () => {
  it("reports a header until the last one unmounts", async () => {
    const { component } = render(NavStoreUnmount, {
      props: { showSideNav: false },
    });
    expect(get(isHeaderRendered)).toBe(true);

    component.showFirstHeader = false;
    await tick();
    expect(get(isHeaderRendered)).toBe(true);

    component.showSecondHeader = false;
    await tick();
    expect(get(isHeaderRendered)).toBe(false);
  });

  it("clears the side nav's rail and collapsed state", async () => {
    const { component } = render(NavStoreUnmount);
    expect(get(isSideNavRail)).toBe(true);
    expect(get(isSideNavCollapsed)).toBe(true);

    component.showSideNav = false;
    await tick();
    expect(get(isSideNavRail)).toBe(false);
    expect(get(isSideNavCollapsed)).toBe(false);
  });
});
