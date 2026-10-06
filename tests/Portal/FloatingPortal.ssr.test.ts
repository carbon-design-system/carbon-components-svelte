// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import FloatingPortal from "./FloatingPortal.test.svelte";
import Portal from "./Portal.test.svelte";

describe("Portal server render", () => {
  // The content mounts on the client, already moved to `document.body`.
  // Rendering it inline would show it in normal flow until hydration.
  it("renders no portal or content", () => {
    expect(renderSSR(Portal).html).toBe("");
  });
});

describe("FloatingPortal server render", () => {
  // Without a layout to measure, an open portal would render at
  // `top: 0; left: 0; width: 0` next to its anchor.
  it("renders no portal or content while open", () => {
    const { html } = renderSSR(FloatingPortal, { open: true });

    expect(html).toBe('<div data-testid="anchor">Anchor element</div>');
  });
});
