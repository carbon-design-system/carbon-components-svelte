import { $ } from "bun";
import { sveld } from "sveld";

const API_FILE = "docs/src/COMPONENT_API.json";
const BOUNDARY_API_FILE = "docs/src/.COMPONENT_API_BOUNDARY.json";

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

console.time("[build-docs]");

await $`rm -f src/index.d.ts && find src -name "*.svelte.d.ts" -delete`;
// `strict` fails the build on any sveld diagnostic, like a type that fell
// back to `any` or a JSDoc tag with nothing to attach to. CI's test jobs
// pass `--no-strict` because they only need the types; static-checks is the
// one job a diagnostic fails.
const strict = !process.argv.includes("--no-strict");
// In GitHub Actions, each diagnostic is also an annotation on its line in
// the PR diff.
const format = process.env.GITHUB_ACTIONS ? "github" : "text";
const main = await sveld({ ...SVELD_OPTIONS, strict, format });

// `carbon-components-svelte/boundary` needs Svelte 5, so its components
// stay out of the root barrel that sveld reads. The first pass already wrote
// their types; this one adds them to the API data the docs read.
const boundary = await sveld({
  entry: "src/ErrorBoundary/index.js",
  types: false,
  json: true,
  jsonOptions: { outFile: BOUNDARY_API_FILE },
  strict,
  format,
});
const api = await Bun.file(API_FILE).json();
const boundaryApi = await Bun.file(BOUNDARY_API_FILE).json();
api.components = [...api.components, ...boundaryApi.components].sort((a, b) =>
  a.moduleName.localeCompare(b.moduleName),
);
api.total = api.components.length;
await Bun.write(API_FILE, `${JSON.stringify(api, null, 2)}\n`);
await $`rm -f ${BOUNDARY_API_FILE}`;

console.timeEnd("[build-docs]");
process.exitCode = main.exitCode || boundary.exitCode;
