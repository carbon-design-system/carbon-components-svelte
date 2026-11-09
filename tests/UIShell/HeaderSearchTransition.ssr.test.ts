// @vitest-environment node
import HeaderSearch from "carbon-components-svelte/UIShell/HeaderSearch.svelte";
import { renderSSR } from "../utils/ssr";

describe("HeaderSearch transition server render", () => {
  it("renders the same markup with transition set", () => {
    const props = {
      id: "search",
      active: true,
      results: [
        { id: "a", href: "/a", text: "Alpha" },
        { href: "/b", text: "Beta" },
      ],
    };

    const plain = renderSSR(HeaderSearch as never, props as never).html;
    const animated = renderSSR(
      HeaderSearch as never,
      { ...props, transition: true } as never,
    ).html;

    expect(plain).toContain("bx--header-search-menu-item");
    expect(animated).toBe(plain);
  });
});
