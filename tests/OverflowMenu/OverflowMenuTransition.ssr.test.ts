// @vitest-environment node
import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
import { renderSSR } from "../utils/ssr";

describe("OverflowMenu menuTransition server render", () => {
  it("renders the same markup with menuTransition set", () => {
    const props = { id: "menu-trigger", open: true, portalMenu: false };
    const plain = renderSSR(OverflowMenu, props).html;
    const animated = renderSSR(OverflowMenu, {
      ...props,
      menuTransition: { duration: "slow01" },
    }).html;

    expect(plain).toContain("bx--overflow-menu-options");
    expect(animated).toBe(plain);
  });
});
