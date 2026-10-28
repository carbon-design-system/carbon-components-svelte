import type { Config } from "bivium";
import { cssNarrower } from "./scripts/lib/css-narrower";

// Types only, so `bivium plan` runs before an install: CI's changes job
// plans every PR without one.
export default {
  base: "origin/master",
  // CI plans before the install, when there is no node_modules to cache in.
  cache: ".bivium/cache",
  suites: {
    unit: {
      tests: "tests/**/*.{test,spec}.{js,jsx,ts,tsx,mjs,mts,cjs,cts}",
      run: "bunx vitest run {files}",
      root: "tests",
      // Read only by `test:types` (svelte-check), which runs whenever the
      // unit job does. `tests/tsconfig.json` isn't one: Vite reads it to
      // transform the tests.
      nonInputs: ["**/*.test-d.ts", "**/tsconfig.compat-check.json"],
      // The Svelte 3/4 harnesses run the same unit tests.
      wiring: ["tests-svelte{3,4}/**"],
    },
    e2e: {
      tests: "e2e/**/*.{test,spec}.{js,jsx,ts,tsx,mjs,mts,cjs,cts}",
      // Chromium only, as CI runs it.
      run: "bunx playwright test --project=chromium {files}",
      root: "e2e",
      urls: { "/*": "e2e/fixtures/*" },
      pages: "e2e/fixtures/**/*.html",
    },
  },
  // The framed DatePicker and sortable pages are examples an e2e test renders
  // from `src`.
  roots: [
    "src",
    "tests",
    "e2e",
    "css",
    "scripts",
    "docs/src/pages/framed/DatePicker",
    "docs/src/pages/framed/ContainedList",
    "docs/src/pages/framed/DataTable/DataTableSortableRows.svelte",
    "crassus.config.ts",
    "docs/src/token-reference.ts",
  ],
  ignore: [
    "**/*.md",
    "docs/**",
    "examples/**",
    "bench/**",
    "thumbnails/**",
    "ostia.config.ts",
    "biome.json",
    "carbon.yml",
    "telemetry.yml",
    "LICENSE",
    ".gitignore",
    ".github/FUNDING.yml",
    // Workflows that run no tests, and config only they read. checks.yml is
    // left out: a change to it has to run the suites it runs.
    ".github/labeler.yml",
    ".github/workflows/{deploy-docs,docs-examples,perf,pr-labels,release}.yml",
  ],
  // Vite aliases the package name to `src/`.
  alias: { "carbon-components-svelte": "src" },
  // Installed by a dependency, imported without being declared.
  external: [
    "playwright",
    "axe-core",
    "dom-accessibility-api",
    "@carbon/colors",
  ],
  edges: { "css/*.css": ["css/**", "scripts/build-css.ts"] },
  self: [
    "bivium.config.ts",
    "scripts/lib/css-narrower.ts",
    "scripts/lib/css-delta.ts",
  ],
  // An importer left pointing at a deleted component can't resolve it, so it
  // already runs as unknown.
  importOnly: ["**/*.svelte"],
  hermetic: [
    // The e2e host reads only the fixture entry of the URL each test opens,
    // which the test's own navigation already reaches. A blanket `@reads` on
    // every entry made any fixture change select every e2e test.
    "e2e/helpers/host.ts",
    // The hydration harness builds and imports only the fixtures its caller
    // passes. Each `*.hydrate.test.ts` names them in `@depends-on`, so it
    // runs when they or a component they render changes.
    "tests/utils/hydrate.ts",
    "tests/utils/hydrate-build.ts",
  ],
  narrowers: [cssNarrower],
  // Globs that select nothing on purpose. A docs-only PR skips this workflow,
  // and master runs every test after a docs change.
  deadGlobs: [
    {
      file: "tests/css/v11-tokens.test.ts",
      glob: "docs/src/**",
      reason: "docs-only changes skip CI; master runs every test after one",
    },
    {
      file: "tests/css/v11-tokens.test.ts",
      glob: "docs/svelte.config.ts",
      reason: "docs-only changes skip CI; master runs every test after one",
    },
  ],
} satisfies Config<"unit" | "e2e">;
