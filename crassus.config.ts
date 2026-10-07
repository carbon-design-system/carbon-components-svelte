import path from "node:path";
import { defineConfig, type Stylesheets } from "crassus";
import { initAsyncCompiler } from "sass-embedded";

// `bun run check:css` (crassus diff) and `bun run check:css:overrides`
// (crassus dead) compile the theme entries here, expanded and with a source
// map, so findings land on the .scss line. `root` is this checkout, or a
// temporary one of the base for `--base`.
const ENTRIES = ["all", "white"];

// The e2e fixtures as a static multi-page build, for `crassus capture` and
// `crassus usage`. Vite resolves `--outDir` from its root, e2e/fixtures.
const FIXTURES = ".crassus/fixtures";

export default defineConfig({
  async compile(root, options) {
    const compiler = await initAsyncCompiler();
    try {
      const compile = async (name: string) => {
        const { css, sourceMap } = await compiler.compileAsync(
          path.join(root, "css", `${name}.scss`),
          {
            style: "expanded",
            sourceMap: true,
            loadPaths: [path.join(root, "css/vendor")],
            quietDeps: true,
            silenceDeprecations: [
              "import",
              "global-builtin",
              "color-functions",
              "if-function",
            ],
          },
        );
        return [name, { css, map: sourceMap }] as const;
      };
      return Object.fromEntries(
        await Promise.all((options?.entries ?? ENTRIES).map(compile)),
      ) as Stylesheets;
    } finally {
      await compiler.dispose();
    }
  },
  // Every theme imports the shared partials, so `dead --fix` proves an edit
  // against all of them, not just the two it reports on.
  fixEntries: ["g10", "g80", "g90", "g100"],
  browser: {
    fixtures: {
      dir: FIXTURES,
      build: `bun run build:css && bunx vite build --config e2e/vite.config.ts --outDir ../../${FIXTURES} --emptyOutDir --minify false --logLevel warn`,
    },
    themes: ["white", "g100"],
    themeAttribute: "theme",
    sheetMarker: ".bx--",
    // Below md, md to lg, and above max (99rem), so every min-width and
    // max-width breakpoint rule applies at one of them.
    viewports: [
      { width: 320, height: 640 },
      { width: 1280, height: 900 },
      { width: 1600, height: 900 },
    ],
    // index.html is the fixture nav, not a mounted fixture.
    readySelector: "#app > *, body > nav",
  },
});
