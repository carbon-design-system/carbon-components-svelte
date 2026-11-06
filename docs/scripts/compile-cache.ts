/**
 * A disk cache for vite-plugin-svelte's preprocess and compile steps in
 * production builds. Each step's transform turns code into code (compile
 * also puts the component's CSS in the module's `meta`), so caching its
 * result, keyed by the code it was given, skips the work for unchanged
 * pages and components: editing one page preprocesses and compiles only
 * that page. Dev and watch builds run as before. A build ends by logging
 * how many results each step reused.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Plugin, ResolvedConfig } from "vite";

type Handler = (
  this: { environment: { config: { consumer: string } } },
  code: string,
  id: string,
  ...rest: unknown[]
) => Promise<unknown>;

export type CachedStep = {
  /** The vite-plugin-svelte plugin, such as `vite-plugin-svelte:compile`. */
  plugin: string;
  /** What the step is called in the build's log, such as `compile`. */
  label: string;
  /** What changes the step's output without changing its input code. */
  salt: string;
  /** More of the key, for output that depends on files besides the code. */
  key?: (code: string, id: string) => string;
  /** The ids worth caching; the step runs as usual for the rest. */
  include?: (id: string) => boolean;
};

/**
 * Wraps each step's plugin among `plugins` so a production build reads its
 * result from `dir` when the code, id, salt and extra key match, and
 * writes it there otherwise.
 */
export function cacheSvelteSteps(
  plugins: Plugin[],
  dir: string,
  steps: CachedStep[],
): Plugin[] {
  let dirReady: Promise<unknown> | undefined;
  for (const step of steps) {
    const plugin = plugins.find((p) => p.name === step.plugin);
    const transform = plugin?.transform as { handler?: Handler } | undefined;
    const run = transform?.handler;
    if (!plugin || !transform || !run) {
      throw new Error(`${step.plugin} changed shape; update compile-cache.ts`);
    }

    let configSalt = "";
    let logger: ResolvedConfig["logger"] | undefined;
    let reused = 0;
    let ran = 0;

    const configResolved = plugin.configResolved as
      ((this: unknown, config: ResolvedConfig) => unknown) | undefined;
    plugin.configResolved = function (config: ResolvedConfig) {
      configSalt =
        config.command === "build" && !config.build.watch
          ? JSON.stringify([step.salt, config.mode, config.build.sourcemap])
          : "";
      logger = config.logger;
      return configResolved?.call(this, config) as void | Promise<void>;
    };

    const buildStart = plugin.buildStart as
      ((this: unknown, ...args: unknown[]) => unknown) | undefined;
    plugin.buildStart = function (...args: unknown[]) {
      reused = 0;
      ran = 0;
      return buildStart?.apply(this, args) as void | Promise<void>;
    };
    // After the build's progress line, which `buildEnd` would print onto.
    plugin.closeBundle = () => {
      if (configSalt) {
        logger?.info(`${step.label} cache: ${reused} reused, ${ran} new`);
      }
    };

    transform.handler = async function (code, id, ...rest) {
      if (!configSalt || (step.include && !step.include(id))) {
        return run.call(this, code, id, ...rest);
      }
      const key = createHash("sha256")
        .update(configSalt)
        .update("\0")
        .update(this.environment.config.consumer)
        .update("\0")
        .update(id)
        .update("\0")
        .update(step.key?.(code, id) ?? "")
        .update("\0")
        .update(code)
        .digest("hex");
      const file = path.join(dir, `${key}.json`);
      try {
        const cached = JSON.parse(await fs.promises.readFile(file, "utf8"));
        reused++;
        return cached;
      } catch {
        // Not cached yet, or unreadable: run the step.
      }
      const result = await run.call(this, code, id, ...rest);
      ran++;
      // A unique temp file, then a rename, so a parallel build never reads
      // a partial entry.
      const tmp = `${file}.${process.pid}.${Math.random().toString(36).slice(2)}`;
      try {
        dirReady ??= fs.promises.mkdir(dir, { recursive: true });
        await dirReady;
        await fs.promises.writeFile(tmp, JSON.stringify(result ?? null));
        await fs.promises.rename(tmp, file);
      } catch {
        await fs.promises.rm(tmp, { force: true }).catch(() => {});
      }
      return result;
    };
  }
  return plugins;
}
