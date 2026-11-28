/** The dev server's plugins, which bunfig's `[serve.static]` loads. */
import path from "node:path";
import {
  carbonAlias,
  combine,
  componentApi,
  componentMdSizes,
  importMetaGlob,
} from "./bun-plugins.ts";
import { selfHostPlex } from "./self-host-plex.ts";
import { siteModule } from "./site-module.ts";

export default combine("docs", [
  carbonAlias,
  importMetaGlob,
  componentApi,
  componentMdSizes,
  siteModule({ dev: true }),
  selfHostPlex({
    nodeModules: path.resolve(import.meta.dirname, "../node_modules"),
    build: false,
  }),
]);
