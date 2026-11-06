/**
 * A disk cache for vite-plugin-svelte's compile step in production builds.
 * Its transform turns a preprocessed component into JavaScript, with the
 * component's CSS in the module's `meta`, so caching that one result,
 * keyed by the code it was given, skips compiling unchanged components.
 * Dev and watch builds compile as before. A build ends by logging how many
 * components it reused and compiled.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Plugin, ResolvedConfig } from "vite";

const COMPILE_PLUGIN = "vite-plugin-svelte:compile";

type Handler = (
  this: { environment: { config: { consumer: string } } },
  code: string,
  id: string,
  ...rest: unknown[]
) => Promise<unknown>;

/**
 * Wraps the compile plugin among `plugins` so a production build reads a
 * component's compiled result from `dir` when its code, id and `salt`
 * match, and writes it there otherwise. Anything that changes compiled
 * output without changing the code, such as the Svelte version or the
 * compiler options, belongs in `salt`.
 */
export function cacheSvelteCompile(
  plugins: Plugin[],
  dir: string,
  salt: string,
): Plugin[] {
  const plugin = plugins.find((p) => p.name === COMPILE_PLUGIN);
  const transform = plugin?.transform as { handler?: Handler } | undefined;
  const compile = transform?.handler;
  if (!plugin || !transform || !compile) {
    throw new Error(`${COMPILE_PLUGIN} changed shape; update compile-cache.ts`);
  }

  let configSalt = "";
  let logger: ResolvedConfig["logger"] | undefined;
  let reused = 0;
  let compiled = 0;
  const configResolved = plugin.configResolved as
    ((this: unknown, config: ResolvedConfig) => unknown) | undefined;
  plugin.configResolved = function (config: ResolvedConfig) {
    configSalt =
      config.command === "build" && !config.build.watch
        ? JSON.stringify([salt, config.mode, config.build.sourcemap])
        : "";
    logger = config.logger;
    return configResolved?.call(this, config) as void | Promise<void>;
  };

  plugin.buildStart = () => {
    reused = 0;
    compiled = 0;
  };
  // After the build's progress line, which `buildEnd` would print onto.
  plugin.closeBundle = () => {
    if (configSalt) {
      logger?.info(`compile cache: ${reused} reused, ${compiled} compiled`);
    }
  };

  let dirReady: Promise<unknown> | undefined;

  transform.handler = async function (code, id, ...rest) {
    if (!configSalt) return compile.call(this, code, id, ...rest);
    const key = createHash("sha256")
      .update(configSalt)
      .update("\0")
      .update(this.environment.config.consumer)
      .update("\0")
      .update(id)
      .update("\0")
      .update(code)
      .digest("hex");
    const file = path.join(dir, `${key}.json`);
    try {
      const cached = JSON.parse(await fs.promises.readFile(file, "utf8"));
      reused++;
      return cached;
    } catch {
      // Not cached yet, or unreadable: compile.
    }
    const result = await compile.call(this, code, id, ...rest);
    compiled++;
    // A unique temp file, then a rename, so a parallel build never reads a
    // partial entry.
    const tmp = `${file}.${process.pid}.${Math.random().toString(36).slice(2)}`;
    try {
      dirReady ??= fs.promises.mkdir(dir, { recursive: true });
      await dirReady;
      await fs.promises.writeFile(tmp, JSON.stringify(result));
      await fs.promises.rename(tmp, file);
    } catch {
      await fs.promises.rm(tmp, { force: true }).catch(() => {});
    }
    return result;
  };
  return plugins;
}
