// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import TooltipTransition from "./TooltipTransition.test.svelte";

describe("Tooltip transition prop server render", () => {
  it("renders the same markup with transition set", () => {
    const props = { open: true };
    const plain = renderSSR(TooltipTransition as never, props as never).html;
    const animated = renderSSR(
      TooltipTransition as never,
      { ...props, transition: { duration: "slow01" } } as never,
    ).html;

    expect(plain).toContain("bx--tooltip__content");
    expect(animated).toBe(plain);
  });
});
