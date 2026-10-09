import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import routify from "@roxi/routify/vite-plugin";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import pkg from "../package.json" with { type: "json" };
import { carbonAlias } from "./carbon-alias.ts";
import { PAGE_EXTENSION } from "./scripts/constants.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "dist");
const componentMdSizesPath = path.resolve(
  __dirname,
  "src/COMPONENT_MD_SIZES.json",
);
const componentMdSizesId = "\0component-md-sizes";
// Prism language components expect a global `Prism`. Only the
// CodeSnippet third-party highlighter example still loads one.
const prismComponentRe = /[/\\]prismjs[/\\]components[/\\]prism-(?!core)/;

function prismGlobalFix() {
  return {
    name: "prism-global-fix",
    transform(code: string, id: string) {
      if (prismComponentRe.test(id)) {
        return { code: `import Prism from "prismjs";\n${code}`, map: null };
      }
    },
  };
}

export default defineConfig({
  resolve: {
    alias: carbonAlias,
  },
  plugins: [
    prismGlobalFix(),
    {
      name: "component-md-sizes",
      resolveId(source) {
        if (source.endsWith("COMPONENT_MD_SIZES.json")) {
          return componentMdSizesId;
        }
      },
      load(id) {
        if (id !== componentMdSizesId) return;

        const json = fs.existsSync(componentMdSizesPath)
          ? fs.readFileSync(componentMdSizesPath, "utf8")
          : "{}";

        return `export default ${JSON.stringify(JSON.parse(json))}`;
      },
    },
    routify({
      routesDir: { default: "src/pages" },
      extensions: [".svelte", PAGE_EXTENSION],
    }),
    svelte(),
    /**
     * Routify 3 sets `build.outDir` to `<outDir>/client` for CSR.
     * Override this so the static build is emitted to `dist/`.
     */
    {
      name: "outdir",
      config() {
        return { build: { outDir } };
      },
    },
  ],
  define: {
    __PKG_VERSION: JSON.stringify(pkg.version),
    __PKG_REPO: JSON.stringify(
      (pkg.repository?.url ?? "").replace(/^git\+/, "").replace(/\.git$/, ""),
    ),
  },
  optimizeDeps: {
    include: ["clipboard-copy"],
    exclude: [
      "carbon-components-svelte",
      "carbon-icons-svelte",
      "@roxi/routify",
      "prismjs/components/prism-typescript",
    ],
  },
  build: {
    chunkSizeWarningLimit: 700,
  },
});
