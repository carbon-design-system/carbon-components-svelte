import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import pkg from "../package.json" with { type: "json" };
import { carbonAlias } from "./carbon-alias.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const componentMdSizesPath = path.resolve(
  __dirname,
  "src/COMPONENT_MD_SIZES.json",
);
const componentMdSizesId = "\0component-md-sizes";
export default defineConfig({
  resolve: {
    alias: carbonAlias,
  },
  plugins: [
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
    svelte(),
  ],
  define: {
    __PKG_VERSION: JSON.stringify(pkg.version),
    __PKG_REPO: JSON.stringify(
      (pkg.repository?.url ?? "").replace(/^git\+/, "").replace(/\.git$/, ""),
    ),
  },
  optimizeDeps: {
    exclude: ["carbon-components-svelte", "carbon-icons-svelte"],
  },
  build: {
    chunkSizeWarningLimit: 700,
  },
});
