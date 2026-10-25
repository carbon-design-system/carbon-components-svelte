import { defineConfig } from "ostia";

export default defineConfig({
  bench: {
    suites: ["bench/*.dom.bench.ts"],
    // Only the component tier needs jsdom, the .svelte loader and the
    // browser condition. Pure-logic files match no project, so they run
    // without them: the preload added ~0.6 s per file and read their
    // task medians 3-10% slow.
    projects: [
      {
        suites: ["bench/*.dom.bench.ts"],
        preload: ["./bench/dom-preload.ts"],
        bunFlags: ["--conditions=browser"],
      },
    ],
    jobs: "auto",
  },
});
