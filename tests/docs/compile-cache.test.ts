// @vitest-environment node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { cacheSvelteSteps } from "../../docs/scripts/compile-cache";

type FakePlugin = {
  name: string;
  configResolved(config: unknown): void;
  transform: { handler: (code: string) => Promise<{ code: string }> };
  buildStart?: () => void;
  closeBundle?: () => void;
};

function setup(command: "build" | "serve") {
  const run = vi.fn((code: string) =>
    Promise.resolve({ code: code.toUpperCase() }),
  );
  const plugin: FakePlugin = {
    name: "vite-plugin-svelte:compile",
    configResolved(_config: unknown) {},
    transform: { handler: run },
  };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "compile-cache-"));
  let extra = "";
  // The test's `vite` types are the root's, the script's the docs'.
  cacheSvelteSteps([plugin] as never, dir, [
    {
      plugin: plugin.name,
      label: "compile",
      salt: "salt",
      key: () => extra,
      include: (id) => id.endsWith(".svelte"),
    },
  ]);
  const info = vi.fn();
  plugin.configResolved({
    command,
    mode: "production",
    build: { watch: null, sourcemap: false },
    logger: { info },
  });
  plugin.buildStart?.();
  const context = { environment: { config: { consumer: "client" } } };
  const transform = (code: string, id = "/src/A.svelte") =>
    (
      plugin.transform.handler as unknown as (
        this: typeof context,
        code: string,
        id: string,
      ) => Promise<unknown>
    ).call(context, code, id);
  return {
    run,
    transform,
    info,
    setExtra: (value: string) => {
      extra = value;
    },
    end: () => plugin.closeBundle?.(),
  };
}

describe("cacheSvelteSteps", () => {
  it("reruns a build step only for new code, ids it includes, or a changed key", async () => {
    const build = setup("build");
    expect(await build.transform("<a />")).toEqual({ code: "<A />" });
    expect(await build.transform("<a />")).toEqual({ code: "<A />" });
    expect(build.run).toHaveBeenCalledTimes(1);
    build.setExtra("an example the page shows changed");
    await build.transform("<a />");
    await build.transform("<a />", "/src/a.js");
    await build.transform("<a />", "/src/a.js");
    expect(build.run).toHaveBeenCalledTimes(4);
    build.end();
    expect(build.info).toHaveBeenCalledWith("compile cache: 1 reused, 2 new");

    const dev = setup("serve");
    await dev.transform("<a />");
    await dev.transform("<a />");
    expect(dev.run).toHaveBeenCalledTimes(2);
    dev.end();
    expect(dev.info).not.toHaveBeenCalled();
  });
});
