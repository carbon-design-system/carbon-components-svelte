import { mount } from "svelte";
import "../../css/all.css";
import "../../css/prose.css";
import "../../css/syntax-tokens.css";
import "../../css/syntax.css";
import "./global.css";
import { FRAMED_PREFIX, normalizePath } from "./routes";
import { reloadForNewBuild } from "./stale-build";

/**
 * A framed example skips the site's shell, router and search. The dev
 * server serves framed paths from `framed.html` instead, and resolves
 * `virtual:framed-start` to nothing, so this page doesn't compile them.
 */
async function start() {
  const path = normalizePath(window.location.pathname);
  if (path.startsWith(FRAMED_PREFIX)) {
    const { startFramed } = await import("virtual:framed-start").catch(
      reloadForNewBuild,
    );
    if (await startFramed(path)) return;
  }
  const { default: App } = await import("./App.svelte").catch(
    reloadForNewBuild,
  );
  mount(App, { target: document.body });
}

start();
