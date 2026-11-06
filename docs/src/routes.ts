/**
 * Routes for the docs site's page files: one per file under `src/pages`.
 * `index` is its directory's path, `[...404]` matches anything no other
 * route does, and `_module.svelte` files are layouts, not routes.
 */

export type Route = {
  /** URL path, such as `/components/Button`. */
  path: string;
  /** File name without its extension, such as `Button`. */
  name: string;
  /** Name of the directory the file is in, such as `components`; `""` at the root. */
  parentName: string;
  /** Module path, as `import.meta.glob` keys it. */
  file: string;
};

const PAGE_FILE_RE = /^\.\/pages\/(.*)\.(svelte|md)$/;
const NOT_FOUND = "[...404]";

/** Routes for page files, keyed by path, and the not-found route. */
export function buildRoutes(files: string[]) {
  const routes = new Map<string, Route>();
  let notFound: Route | undefined;
  for (const file of files) {
    const match = PAGE_FILE_RE.exec(file);
    if (!match) continue;
    const segments = match[1].split("/");
    const name = segments.at(-1) ?? "";
    if (name.startsWith("_")) continue;
    const route: Route = {
      path: `/${(name === "index" ? segments.slice(0, -1) : segments).join("/")}`,
      name,
      parentName: segments.at(-2) ?? "",
      file,
    };
    if (name === NOT_FOUND) notFound = route;
    else routes.set(route.path, route);
  }
  return { routes, notFound };
}
