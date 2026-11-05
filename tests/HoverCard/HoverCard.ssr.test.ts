// @vitest-environment node
import { renderRaw } from "../utils/ssr";
import HoverCard from "./HoverCard.ssr.test.svelte";

describe("HoverCard server render", () => {
  it("renders only the trigger while closed", () => {
    const html = renderRaw(HoverCard, {});

    expect(html).toContain('href="/octocat"');
    expect(html).not.toContain('role="dialog"');
  });

  it("renders an open card as a dialog named by its trigger", () => {
    const html = renderRaw(HoverCard, { open: true });

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-labelledby="hc-trigger"');
    expect(html).toContain('id="hc-card"');
    expect(html).toContain("Card body");
  });

  it("does not call load on the server", () => {
    const load = vi.fn(() => Promise.resolve({}));
    const html = renderRaw(HoverCard, { open: true, load });

    expect(load).not.toHaveBeenCalled();
    expect(html).not.toContain("Card body");
  });
});
