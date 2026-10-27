// @vitest-environment node
import InlineLoading from "carbon-components-svelte/InlineLoading/InlineLoading.svelte";
import Loading from "carbon-components-svelte/Loading/Loading.svelte";
import { renderSSR } from "../utils/ssr";

describe("transition prop server render", () => {
  it.each([
    ["Loading with overlay", Loading, {}],
    ["Loading without overlay", Loading, { withOverlay: false }],
    ["InlineLoading", InlineLoading, { description: "Saving" }],
  ] as const)(
    "%s renders the same markup with transition set",
    (_, component, props) => {
      const plain = renderSSR(component as never, props as never).html;
      const animated = renderSSR(
        component as never,
        {
          ...props,
          transition: { duration: "slow01" },
        } as never,
      ).html;

      expect(plain).toContain("bx--");
      expect(animated).toBe(plain);
    },
  );
});
