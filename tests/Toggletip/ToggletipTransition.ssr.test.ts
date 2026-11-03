// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import ToggletipTransition from "./ToggletipTransition.test.svelte";

describe("Toggletip transition prop server render", () => {
  it("renders the same markup with transition set", () => {
    const props = { open: true };
    const plain = renderSSR(ToggletipTransition as never, props as never).html;
    const animated = renderSSR(
      ToggletipTransition as never,
      { ...props, transition: { duration: "slow01" } } as never,
    ).html;

    expect(plain).toContain("bx--popover-contents");
    expect(animated).toBe(plain);
  });
});
