// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import PopoverTransition from "./PopoverTransition.test.svelte";

describe("Popover transition prop server render", () => {
  it("renders the same markup with transition set", () => {
    const plain = renderSSR(PopoverTransition as never, {} as never).html;
    const animated = renderSSR(
      PopoverTransition as never,
      { transition: { duration: "slow01" } } as never,
    ).html;

    expect(plain).toContain("bx--popover-contents");
    expect(animated).toBe(plain);
  });
});
