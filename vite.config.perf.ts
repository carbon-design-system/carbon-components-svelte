// Production-mode config for perf probes: `dev: false` disables Svelte 5's
// dev-mode instrumentation (stack capture on every state write), which
// inflates jsdom timings ~10x and skews which suspect looks slowest. Counts
// are unaffected by dev mode; only use this config when timing.
//
// `compilerOptions.dev: false` alone is not enough — the runtime `DEV` flag
// (used by shared internals like get_stack/get_error) comes from `esm-env`,
// which resolves off `NODE_ENV` at import time, not off how a given
// component was compiled. Run with `bun run test:perf`, which sets
// `NODE_ENV=production` for you.
//
// See "Counting redundant work" in CONTRIBUTING.md.
import { createConfig } from "./vite.config.ts";

export default createConfig({ dev: false });
