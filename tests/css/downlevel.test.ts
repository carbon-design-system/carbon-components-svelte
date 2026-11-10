// @vitest-environment node
// @depends-on scripts/lib/css-targets.ts
import { transform } from "lightningcss";
import { targets } from "../../scripts/lib/css-targets";

// At the browser baseline, Lightning CSS passes these through as written.
// Under the old Safari 14 floor, flow-relative insets and corner radii
// expanded to `:lang()` RTL twins (~900 bytes per declaration) and
// selector lists in `:is()`/`:not()` gained a `:-webkit-any` twin, so the
// sources avoided them. A target change that brings the twins back fails
// here.
const SOURCE = `
.a { inset-inline-start: 0; border-start-start-radius: 4px; }
.b:is(.c, .d) { color: red; }
.e:not(.f, .g) { color: red; }
.h:has(> .i) { color: red; }
`;

describe("css downlevel cost", () => {
  it("passes baseline features through without twins", () => {
    const { code } = transform({
      filename: "downlevel.css",
      code: Buffer.from(SOURCE),
      targets,
      minify: true,
    });
    const css = code.toString();
    expect(css).not.toMatch(/:lang\(|:-webkit-any|-webkit-/);
    expect(css).toContain("inset-inline-start:0");
    expect(css).toContain(":has(>.i)");
  });
});
