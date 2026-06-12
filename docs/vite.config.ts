import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import routify from "@roxi/routify/vite-plugin";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import pkg from "../package.json" with { type: "json" };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const carbonRoot = path.resolve(__dirname, "..");
const outDir = path.resolve(__dirname, "dist");
const componentMdSizesPath = path.resolve(
  __dirname,
  "src/COMPONENT_MD_SIZES.json",
);
const componentMdSizesId = "\0component-md-sizes";
const prismComponentRe = /[/\\]prismjs[/\\]components[/\\]prism-(?!core)/;
const prismSvelteRe = /[/\\]prism-svelte[/\\]/;

function prismGlobalFix() {
  return {
    name: "prism-global-fix",
    transform(code: string, id: string) {
      if (prismComponentRe.test(id)) {
        return { code: `import Prism from "prismjs";\n${code}`, map: null };
      }
      if (prismSvelteRe.test(id)) {
        return { code: `import Prism from "prismjs";\n${code}`, map: null };
      }
    },
  };
}

export default defineConfig({
  resolve: {
    alias: {
      "carbon-components-svelte": carbonRoot,
    },
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
      extensions: [".svelte", ".svx"],
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
    include: ["clipboard-copy", "flatpickr/dist/plugins/rangePlugin"],
    exclude: [
      "carbon-components-svelte",
      "carbon-icons-svelte",
      "@roxi/routify",
      "prismjs/components/prism-bash",
      "prismjs/components/prism-typescript",
      "prism-svelte",
    ],
  },
  build: {
    chunkSizeWarningLimit: 700,
  },
});
