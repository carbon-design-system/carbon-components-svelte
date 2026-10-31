import { readFile, rm, writeFile } from "node:fs/promises";
import { $ } from "bun";
import { sveld } from "sveld";

const API_FILE = "docs/src/COMPONENT_API.json";
const VIZ_API_FILE = "docs/src/.COMPONENT_API_VIZ.json";

const SVELD_OPTIONS = {
  // Parse each `@example`'s markup, so a broken one fails static-checks
  // instead of reaching editor hovers and the API docs.
  checkExamples: "syntax" as const,
  glob: true,
  json: true,
  jsonOptions: {
    outFile: API_FILE,
  },
  typesOptions: {
    outDir: "src",
  },
  diagnostics: {
    ignore: [
      // Each narrows the prop it inherits on purpose. ChatButton and its
      // skeleton take Carbon's ChatButton kinds and sizes, not Button's.
      {
        code: "sveld/extend-props-override",
        component: "./SkeletonIcon/SkeletonIcon.svelte",
        name: "size",
      },
      {
        code: "sveld/extend-props-override",
        component: "./UIShell/HeaderGlobalAction.svelte",
        name: "ref",
      },
      {
        code: "sveld/extend-props-override",
        component: "./Chat/ChatButton.svelte",
        name: "kind",
      },
      {
        code: "sveld/extend-props-override",
        component: "./Chat/ChatButton.svelte",
        name: "size",
      },
      {
        code: "sveld/extend-props-override",
        component: "./Chat/ChatButtonSkeleton.svelte",
        name: "size",
      },
    ],
  },
};

// `carbon-components-svelte/viz` has its own barrel, so it needs its own
// `index.d.ts`. Its components are folded into the one API file the docs read.
const SVELD_VIZ_OPTIONS = {
  entry: "src/viz/index.js",
  glob: true,
  json: true,
  jsonOptions: {
    outFile: VIZ_API_FILE,
  },
  typesOptions: {
    outDir: "src/viz",
  },
};

type ComponentApi = {
  total: number;
  components: Array<{ moduleName: string }>;
};

async function mergeVizApi() {
  const api = JSON.parse(await readFile(API_FILE, "utf8")) as ComponentApi;
  const viz = JSON.parse(await readFile(VIZ_API_FILE, "utf8")) as ComponentApi;
  await rm(VIZ_API_FILE);
  if (viz.components.length === 0) return;

  const names = new Set(api.components.map((c) => c.moduleName));
  const clash = viz.components.find((c) => names.has(c.moduleName));
  if (clash) {
    throw new Error(
      `[build-docs] viz component "${clash.moduleName}" collides with a core component name`,
    );
  }

  api.components = [...api.components, ...viz.components].sort((a, b) =>
    a.moduleName.localeCompare(b.moduleName),
  );
  api.total = api.components.length;
  await writeFile(API_FILE, `${JSON.stringify(api, null, 2)}\n`);
}

console.time("[build-docs]");

await $`rm -f src/index.d.ts src/viz/index.d.ts && find src -name "*.svelte.d.ts" -delete`;
// `strict` fails the build on any sveld diagnostic, like a type that fell
// back to `any` or a JSDoc tag with nothing to attach to. CI's test jobs
// pass `--no-strict` because they only need the types; static-checks is the
// one job a diagnostic fails.
const strict = !process.argv.includes("--no-strict");
// In GitHub Actions, each diagnostic is also an annotation on its line in
// the PR diff.
const format = process.env.GITHUB_ACTIONS ? "github" : "text";
const { exitCode } = await sveld({ ...SVELD_OPTIONS, strict, format });
const viz = await sveld({ ...SVELD_VIZ_OPTIONS, strict, format });
await mergeVizApi();

console.timeEnd("[build-docs]");
process.exitCode = exitCode || viz.exitCode;
