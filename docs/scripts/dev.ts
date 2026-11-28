/**
 * The dev server: the site at every path, with hot updates, and the files
 * in `public/` at the root, as the build copies them. The plugins come
 * from `bunfig.toml`.
 *
 * The theme sheets and their Plex fonts are served as the build writes
 * them, outside the bundle (`carbon-sheets.ts`). A change to `css/`
 * shows on reload, not as a hot update.
 */
import fs from "node:fs";
import path from "node:path";
import index from "../index.html";
import { DEV_URL, readCarbonSheets } from "./carbon-sheets.ts";
import { PLEX_URL, plexFile } from "./self-host-plex.ts";

const PUBLIC = path.resolve(import.meta.dirname, "../public");
const NODE_MODULES = path.resolve(import.meta.dirname, "../node_modules");
const PLEX_PATH = /^\/(sans|mono)\/fonts\/[\w./-]+\.woff2$/;

/** Read at startup: restart to serve a file added since. */
const publicFiles = Object.fromEntries(
  Array.from(new Bun.Glob("**/*").scanSync(PUBLIC), (file) => [
    `/${file.split(path.sep).join("/")}`,
    Bun.file(path.join(PUBLIC, file)),
  ]),
);

const server = Bun.serve({
  port: Number(process.env.PORT ?? 5173),
  development: { hmr: true, console: true },
  routes: {
    ...publicFiles,
    [DEV_URL]: () =>
      new Response(readCarbonSheets().join("\n"), {
        headers: { "Content-Type": "text/css; charset=utf-8" },
      }),
    [`${PLEX_URL}/*`]: (request) => {
      const font = new URL(request.url).pathname.slice(PLEX_URL.length);
      const file = plexFile(NODE_MODULES, font.slice(1));
      return PLEX_PATH.test(font) && !font.includes("..") && fs.existsSync(file)
        ? new Response(Bun.file(file))
        : new Response("Not found", { status: 404 });
    },
    "/*": index,
  },
});

console.log(`Docs at ${server.url}`);
