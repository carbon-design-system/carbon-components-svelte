import { defineConfig } from "ostia";

export default defineConfig({
  bench: {
    suites: ["bench/*.dom.bench.ts"],
    preload: ["./bench/dom-preload.ts"],
    jobs: "auto",
  },
});
