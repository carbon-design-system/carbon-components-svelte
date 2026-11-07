export type Route = {
  path: string;
  name: string;
  /** `""` at the root. */
  parentName: string;
  file: string;
};

const PAGE_FILE_RE = /^\.\/pages\/(.*)\.(svelte|md)$/;
const NOT_FOUND = "[...404]";

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

export const normalizePath = (pathname: string) =>
  decodeURI(pathname).replace(/(.)\/$/, "$1");

export const FRAMED_PREFIX = "/framed/";

/** Its file may not exist. */
export function framedRoute(path: string): Route {
  const segments = path.slice(1).split("/");
  return {
    path,
    name: segments.at(-1) ?? "",
    parentName: segments.at(-2) ?? "",
    file: `./pages${path}.svelte`,
  };
}
