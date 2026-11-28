/** The dev server's plugins, which bunfig's `[serve.static]` loads. */
import {
  carbonAlias,
  combine,
  componentApi,
  componentMdSizes,
  importMetaGlob,
} from "./bun-plugins.ts";
import { noCarbonSheetImports } from "./carbon-sheets.ts";
import { selfHostPlex } from "./self-host-plex.ts";
import { siteModule } from "./site-module.ts";

export default combine("docs", [
  carbonAlias,
  importMetaGlob,
  componentApi,
  componentMdSizes,
  siteModule({ dev: true }),
  noCarbonSheetImports,
  selfHostPlex,
]);
