/**
 * The dev server: the site at every path, with hot updates, framed
 * examples from `framed.html`, and the files in `public/` at the root, as
 * the build copies them. The plugins come from `bunfig.toml`.
 */
import path from "node:path";
import framed from "../framed.html";
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
  // Framed examples from their own page, which Bun bundles only when an
  // iframe first asks for one; see src/framed.ts.
  routes: { ...publicFiles, "/framed/*": framed, "/*": index },
});

console.log(`Docs at ${server.url}`);
