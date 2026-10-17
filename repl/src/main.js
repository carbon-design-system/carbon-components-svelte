import "carbon-components-svelte/css/all.css";
import { mount } from "svelte";
import Console from "./Console.svelte";
import Editor from "./Editor.svelte";
import { init } from "./state.js";
import Toolbar from "./Toolbar.svelte";

/** Apply the shell stylesheet (preloaded, not render-blocking; see vite.config.ts). */
function applyShellCss() {
  const preload = document.querySelector("link[data-shell-css]");
  if (!preload) return Promise.resolve();
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = preload.href;
  if (preload.crossOrigin) link.crossOrigin = preload.crossOrigin;
  const loaded = new Promise((resolve) => {
    link.onload = link.onerror = resolve;
  });
  document.head.append(link);
  return loaded;
}

const [repl] = await Promise.all([window.__repl.ready, applyShellCss()]);
init(repl);

mount(Toolbar, { target: document.getElementById("header") });
mount(Editor, { target: document.getElementById("editor-pane") });
mount(Console, { target: document.getElementById("console") });

repl.metrics.shellMounted = performance.now();
