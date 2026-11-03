// @vitest-environment node
import ListBoxMenu from "carbon-components-svelte/ListBox/ListBoxMenu.svelte";
import { renderSSR } from "../utils/ssr";

describe("ListBoxMenu transition server render", () => {
  it("renders the same markup with transition set", () => {
    const props = { id: "menu", "aria-label": "Options" };
    const plain = renderSSR(ListBoxMenu as never, props as never).html;
    const animated = renderSSR(
      ListBoxMenu as never,
      { ...props, transition: { duration: "slow01" } } as never,
    ).html;

    expect(plain).toContain("bx--list-box__menu");
    expect(animated).toBe(plain);
  });
});
