import { resolve } from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig, type Plugin } from "vite";

/**
 * Inline scripts wait for pending stylesheets, so a render-blocking shell
 * stylesheet would delay the bootstrap (code, worker, iframe). Downgrade it to
 * a preload; main.js applies it before mounting the shell.
 */
function nonBlockingShellCss(): Plugin {
  return {
    name: "repl:non-blocking-shell-css",
    transformIndexHtml: {
      order: "post",
      handler: (html) =>
        html.replace(
          /<link rel="stylesheet"([^>]*?)href="([^"]+\.css)"([^>]*)>/g,
          '<link rel="preload" as="style"$1href="$2"$3 data-shell-css>',
        ),
    },
  };
}

export default defineConfig({
  root: import.meta.dirname,
  plugins: [svelte(), nonBlockingShellCss()],
  resolve: {
    alias: { "carbon-components-svelte": resolve(import.meta.dirname, "..") },
  },
  build: {
    outDir: "dist/app",
    emptyOutDir: true,
    target: "es2022",
    modulePreload: { polyfill: false },
  },
});
