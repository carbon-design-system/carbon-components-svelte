import { $ } from "bun";
import { sveld } from "sveld";

const SVELD_OPTIONS = {
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
const { exitCode } = await sveld({ ...SVELD_OPTIONS, strict });

console.timeEnd("[build-docs]");
process.exitCode = exitCode;
