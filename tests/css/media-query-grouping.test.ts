// @vitest-environment node
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
    // Raised again from 55 to 61 when Tabs guarded its base and patch hover
    // rules (components/tabs/_tabs.scss): 1 block for the base mixin, 1 each
    // for tabs-container-disabled-hover, tabs-dismissible, and vertical
    // tabs' two breakpoint scopes, and 4 (one per size, from the `@each`
    // loop) for tabs-size.
    // Raised again from 61 to 62 for ToggleButtonGroup's one hover block
    // (_toggle-button-group.scss).
    // Raised again from 62 to 63 for the resizable SideNav handle's one
    // hover block (side-nav-resize in components/ui-shell/_side-nav.scss).
    // Raised again from 63 to 64 for the DatePicker clear button's one
    // hover block (date-picker-clear in
    // components/date-picker/_date-picker.scss).
    // Whitespace-tolerant so the count holds for expanded and compressed
    // output; the lower bound fails the test if the pattern stops matching.
    const blocks = css.match(/@media\s*\(any-hover:\s*hover\)\s*\{/g) ?? [];
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks.length).toBeLessThanOrEqual(64);
  }, 30_000);
});
