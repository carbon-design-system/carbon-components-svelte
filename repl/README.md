# Carbon REPL (spike)

Phase-0 spike of the Carbon-specific REPL. Design docs live in the workspace
`.context/repl/` (architecture, link shortener).

```sh
bun run build:css        # at the repo root, once (css/all.css is gitignored)
cd repl
bun run start            # build artifacts + shell, then serve
```

- App: http://localhost:5180
- Sandbox + artifacts: http://127.0.0.1:5181 (different site → cross-site preview)

| Path | Role |
|---|---|
| `scripts/build-artifacts.ts` | Compiles `../src` and `carbon-icons-svelte` 1:1, bundles the Svelte runtime + flatpickr, writes the manifest, sandbox document and import map |
| `index.html` | Inline bootstrap: decodes the hash, shows code, starts the compiler worker and the preview iframe before the shell loads |
| `public/worker.js` | Compiler worker: compile, rewrite imports against the manifest, post modules straight to the iframe |
| `sandbox/sandbox.js` | Preview runtime: keep-alive remount, side-effect teardown, console/error relay, storage shim |
| `src/` | Shell UI built from carbon-components-svelte |
| `server.ts` | Two-origin static server (CSP, CORS, brotli, optional network shaping) |
| `scripts/smoke.ts` | End-to-end check of every example, the edit loop and shared links |
| `scripts/perf.ts` | Desktop / Phone cold + warm load and edit-loop measurements |

Not in the spike: syntax highlighting, completions, service worker, version
picker, npm tarball builds, URL format freeze.
