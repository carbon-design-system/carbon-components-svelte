/**
 * The dev server: the site at every path, with hot updates, and the files
 * in `public/` at the root, as the build copies them. The plugins come
 * from `bunfig.toml`.
 */
import path from "node:path";
import index from "../index.html";

const PUBLIC = path.resolve(import.meta.dirname, "../public");

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
  routes: { ...publicFiles, "/*": index },
});

console.log(`Docs at ${server.url}`);
