// @vitest-environment node
// @depends-on css/vendor/carbon-components/scss/globals/scss/vendor/@carbon/elements/scss/type/font-face/**
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { compileEntry } from "./compile";

// The only weights the type tokens and component CSS use. Faces for the rest
// (100/200/450/500/700) were ~54 KB per CSS file.
const WEIGHTS = ["300", "400", "600"];

const FONT_FACE_DIR = join(
  __dirname,
  "../../css/vendor/carbon-components/scss/globals/scss/vendor/@carbon/elements/scss/type/font-face",
);

/** The body of each `@font-face { ... }` block, its braces matched. */
function fontFaceBlocks(scss: string): string[] {
  const blocks: string[] = [];
  for (const match of scss.matchAll(/@font-face\s*\{/g)) {
    let depth = 1;
    let i = match.index + match[0].length;
    while (depth > 0 && i < scss.length) {
      if (scss[i] === "{") depth++;
      else if (scss[i] === "}") depth--;
      i++;
    }
    blocks.push(scss.slice(match.index, i));
  }
  return blocks;
}

describe("@font-face sources", () => {
  it("only lists woff2, which every supported browser loads first", () => {
    let woff2Sources = 0;
    for (const file of readdirSync(FONT_FACE_DIR)) {
      const scss = readFileSync(join(FONT_FACE_DIR, file), "utf8");
      // Either quote style, so reformatting the vendored file keeps the guard.
      expect(scss, file).not.toMatch(/format\(["']woff["']\)/);
      expect(scss, file).not.toMatch(/\.woff["']/);
      woff2Sources += scss.match(/format\(["']woff2["']\)/g)?.length ?? 0;
    }
    // Fails if the patterns above stop matching how sources are written.
    expect(woff2Sources).toBeGreaterThan(0);
  });

  // A face without one covers every character, so text Plex has no glyph
  // for, such as CJK, downloaded its complete file to find none.
  it("gives every face a unicode-range", () => {
    let faces = 0;
    for (const file of readdirSync(FONT_FACE_DIR)) {
      const scss = readFileSync(join(FONT_FACE_DIR, file), "utf8");
      for (const face of fontFaceBlocks(scss)) {
        faces++;
        expect(face, file).toMatch(/unicode-range:/);
      }
    }
    expect(faces).toBeGreaterThan(0);
  });

  it("declares only the weights the CSS uses", () => {
    for (const file of readdirSync(FONT_FACE_DIR)) {
      const scss = readFileSync(join(FONT_FACE_DIR, file), "utf8");
      for (const [, weight] of scss.matchAll(/font-weight: (\w+);/g)) {
        expect(WEIGHTS, file).toContain(weight);
      }
    }
  });

  it("has a face for every weight the compiled CSS asks for", async () => {
    const css = await compileEntry("all.scss");
    const faces = css.match(/@font-face\s*\{[^}]*\}/g) ?? [];
    const rest = css.replace(/@font-face\s*\{[^}]*\}/g, "");
    const declared = new Set(
      faces.map((face) => face.match(/font-weight:\s*(\w+)/)?.[1]),
    );
    const used = new Set(
      [...rest.matchAll(/font-weight:\s*(\d+)/g)].map(([, weight]) => weight),
    );

    expect([...declared].sort()).toEqual(WEIGHTS);
    expect(used.size).toBeGreaterThan(0);
    for (const weight of used) expect(WEIGHTS).toContain(weight);
  }, 30_000);
});
