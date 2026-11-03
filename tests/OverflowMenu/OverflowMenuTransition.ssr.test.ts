// @vitest-environment node
import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
import { renderSSR } from "../utils/ssr";

describe("OverflowMenu transition server render", () => {
  it("renders the same markup with transition set", () => {
    const props = { id: "menu-trigger", open: true, portalMenu: false };
    const plain = renderSSR(OverflowMenu, props).html;
    const animated = renderSSR(OverflowMenu, {
      ...props,
      transition: { duration: "slow01" },
    }).html;

    expect(plain).toContain("bx--overflow-menu-options");
    expect(animated).toBe(plain);
  });
});
