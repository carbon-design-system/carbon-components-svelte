import { tmpdir } from "node:os";
import { $ } from "bun";
import { sveld } from "sveld";

const SVELD_OPTIONS = {
  // Parse each `@example`'s markup, so a broken one fails static-checks
  // instead of reaching editor hovers and the API docs.
  checkExamples: "syntax" as const,
  glob: true,
  json: true,
  jsonOptions: {
    outFile: "docs/src/COMPONENT_API.json",
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
const { exitCode } = await sveld({ ...SVELD_OPTIONS, strict, format });

// The JSON lists the main entry's components only. The `devtools` sub-path
// is its own entry, so read it too and add its components, which the docs
// need for their API tables.
const devtoolsJson = `${tmpdir()}/ccs-devtools-api.json`;
const devtools = await sveld({
  ...SVELD_OPTIONS,
  entry: "src/devtools/index.js",
  types: false,
  jsonOptions: { outFile: devtoolsJson },
  quiet: true,
  strict,
  format,
});
const api = await Bun.file(SVELD_OPTIONS.jsonOptions.outFile).json();
const extra = await Bun.file(devtoolsJson).json();
api.components.push(...extra.components);
api.total = api.components.length;
await Bun.write(
  SVELD_OPTIONS.jsonOptions.outFile,
  `${JSON.stringify(api, null, 2)}\n`,
);

console.timeEnd("[build-docs]");
process.exitCode = exitCode || devtools.exitCode;
