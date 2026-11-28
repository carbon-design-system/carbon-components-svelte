import type { BunPlugin } from "bun";
import pkg from "../../package.json" with { type: "json" };

/** `virtual:site`: the package's version and repo, and whether it's dev. */
export function siteModule({ dev }: { dev: boolean }): BunPlugin {
  const repo = (pkg.repository?.url ?? "")
    .replace(/^git\+/, "")
    .replace(/\.git$/, "");
  return {
    name: "site",
    setup(build) {
      build.onResolve({ filter: /^virtual:site$/ }, () => ({
        path: "site",
        namespace: "site",
      }));
      build.onLoad({ filter: /.*/, namespace: "site" }, () => ({
        contents: [
          `export const VERSION = ${JSON.stringify(pkg.version)};`,
          `export const REPO = ${JSON.stringify(repo)};`,
          `export const DEV = ${dev};`,
        ].join("\n"),
        loader: "js",
      }));
    },
  };
}
