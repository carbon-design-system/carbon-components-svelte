// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import AILabelSurface from "./AILabel.surface.test.svelte";
import { surfaceHosts } from "./helpers";

describe("AILabel server render", () => {
  it.each(surfaceHosts)(
    "renders the AI surface on the %s",
    (testId, selector, name) => {
      const { document } = renderSSR(AILabelSurface);
      const host = document.querySelector(`[data-testid="${testId}"]`);
      const surface = host?.querySelector(selector);

      assert(surface);
      expect(surface.classList.contains(name)).toBe(true);
    },
  );

  it("leaves hosts without a decorator unmarked", () => {
    const { document } = renderSSR(AILabelSurface);
    const plain = document.querySelector('[data-testid="plain"]');

    expect(plain?.querySelector('[class*="--ai-label"]')).toBeNull();
  });
});
