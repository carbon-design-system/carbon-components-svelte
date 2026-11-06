// @vitest-environment node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { cacheSvelteCompile } from "../../docs/scripts/compile-cache";

function setup(command: "build" | "serve") {
  const compile = vi.fn((code: string) =>
    Promise.resolve({ code: code.toUpperCase() }),
  );
  const plugin = {
    name: "vite-plugin-svelte:compile",
    configResolved(_config: unknown) {},
    transform: { handler: compile },
  } as {
    name: string;
    configResolved(config: unknown): void;
    transform: { handler: typeof compile };
    buildStart?: () => void;
    closeBundle?: () => void;
  };
  const info = vi.fn();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "compile-cache-"));
  // The test's `vite` types are the root's, the script's the docs'.
  cacheSvelteCompile([plugin] as never, dir, "salt");
  plugin.configResolved({
    command,
    mode: "production",
    build: { watch: null, sourcemap: false },
    logger: { info },
  });
  plugin.buildStart?.();
  const context = { environment: { config: { consumer: "client" } } };
  const transform = (code: string) =>
    (
      plugin.transform.handler as unknown as (
        this: typeof context,
        code: string,
        id: string,
      ) => Promise<unknown>
    ).call(context, code, "/src/A.svelte");
  const end = () => plugin.closeBundle?.();
  return { compile, transform, end, info };
}

describe("cacheSvelteCompile", () => {
  it("compiles unchanged code once in a build, and every time in dev", async () => {
    const build = setup("build");
    expect(await build.transform("<a />")).toEqual({ code: "<A />" });
    expect(await build.transform("<a />")).toEqual({ code: "<A />" });
    expect(await build.transform("<b />")).toEqual({ code: "<B />" });
    expect(build.compile).toHaveBeenCalledTimes(2);
    build.end();
    expect(build.info).toHaveBeenCalledWith(
      "compile cache: 1 reused, 2 compiled",
    );

    const dev = setup("serve");
    await dev.transform("<a />");
    await dev.transform("<a />");
    expect(dev.compile).toHaveBeenCalledTimes(2);
    dev.end();
    expect(dev.info).not.toHaveBeenCalled();
  });
});
