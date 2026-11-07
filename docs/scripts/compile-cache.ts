/**
 * A disk cache for vite-plugin-svelte's preprocess and compile steps in
 * production builds, keyed by input code. Compile also puts the
 * component's CSS in the module's `meta`, so the cache stores that too.
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
  plugin: string;
  label: string;
  /** What changes the step's output without changing its input code. */
  salt: string;
  /** More of the key, for output that depends on files besides the code. */
  key?: (code: string, id: string) => string;
  include?: (id: string) => boolean;
};

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
      } catch {}
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
