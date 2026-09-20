import { compileEntry } from "./compile";

describe("any-hover media query grouping", () => {
  it("does not regress back to one block per hover rule", async () => {
    const css = await compileEntry("all.scss");
    // Grouped adjacent `(any-hover: hover)` rules per component close one
    // @media block instead of N. Was 72 blocks before grouping (see
    // .context/css-size-followup-results.md); this caps well below that so
    // a future change re-scattering the blocks gets caught. Raised from 40
    // when the hand-authored partials adopted the guard (one block each,
    // more only where moving a hover rule would reorder the cascade).
    // Whitespace-tolerant so the count holds for expanded and compressed
    // output; the lower bound fails the test if the pattern stops matching.
    const blocks = css.match(/@media\s*\(any-hover:\s*hover\)\s*\{/g) ?? [];
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks.length).toBeLessThanOrEqual(55);
  }, 30_000);
});
