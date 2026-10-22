import { $ } from "bun";
import { sveld } from "sveld";

const SVELD_OPTIONS = {
  glob: true,
  documentExports: true,
  json: true,
  jsonOptions: {
    outFile: "docs/src/COMPONENT_API.json",
  },
  typesOptions: {
    outDir: "src",
  },
  diagnostics: {
    ignore: [
      // Both narrow the prop they inherit on purpose.
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
    ],
  },
};

console.time("[build-docs]");

await $`rm -f src/index.d.ts && find src -name "*.svelte.d.ts" -delete`;
// `strict` fails the build on any sveld diagnostic, like a type that fell
// back to `any` or a JSDoc tag with nothing to attach to.
const { exitCode } = await sveld({ ...SVELD_OPTIONS, strict: true });

console.timeEnd("[build-docs]");
process.exitCode = exitCode;
