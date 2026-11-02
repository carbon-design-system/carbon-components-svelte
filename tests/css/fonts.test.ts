// @vitest-environment node
import { compileEntry } from "./compile";

const FONT_FACE = /@font-face\s*\{[^}]*\}/g;

/** Every `font-family` declaration outside `@font-face`, deduplicated. */
function familyDeclarations(css: string) {
  const rest = css.replace(FONT_FACE, "");
  return [
    ...new Set(
      [...rest.matchAll(/font-family:\s*([^;}]+)/g)].map(([, value]) =>
        value.trim(),
      ),
    ),
  ];
}

describe("fonts.css", () => {
  it("holds only Plex @font-face rules that swap in", async () => {
    const css = await compileEntry("fonts.scss");
    const faces = css.match(FONT_FACE) ?? [];

    expect(faces.length).toBeGreaterThan(0);
    expect(css.replace(FONT_FACE, "").trim()).toBe("");
    for (const face of faces) expect(face).toMatch(/font-display:\s*swap/);

    const families = new Set(
      faces.map((face) => face.match(/font-family:\s*"?([^";]+)"?/)?.[1]),
    );
    expect([...families].sort()).toEqual([
      "IBM Plex Mono",
      "IBM Plex Sans",
      "IBM Plex Serif",
    ]);
  }, 30_000);
});

describe("theme sheets", () => {
  it("leave the @font-face rules to fonts.css", async () => {
    for (const entry of ["all.scss", "white.scss", "g100.scss"]) {
      // biome-ignore lint/performance/noAwaitInLoops: the compile cache is per entry
      expect(await compileEntry(entry), entry).not.toMatch(/@font-face/);
    }
  }, 60_000);
});

describe("font family variables", () => {
  it("routes every sans, mono and serif stack through --ccs-font-*", async () => {
    const css = await compileEntry("all.scss");
    const plex = familyDeclarations(css).filter((value) =>
      /IBM Plex (Sans|Mono|Serif)\b(?! (Condensed|Hebrew))/.test(value),
    );

    expect(plex.length).toBeGreaterThan(0);
    for (const value of plex) {
      expect(value).toMatch(/^var\(--ccs-font-(sans|mono|serif),/);
    }
  }, 30_000);
});
