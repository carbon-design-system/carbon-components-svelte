import { mount } from "svelte";
import "../../css/all.css";
import "../../css/devtools.css";
import "../../css/prose.css";
import "../../css/syntax-tokens.css";
import "../../css/syntax.css";
import { route } from "./current-route";
import "./global.css";
import { FRAMED_PREFIX, framedRoute, normalizePath } from "./routes";
import { reloadForNewBuild } from "./stale-build";

/** A framed example skips the site's shell, router and search. */
async function start() {
  const path = normalizePath(window.location.pathname);
  if (path.startsWith(FRAMED_PREFIX)) {
    const [{ framedPages }, { default: FramedApp }] = await Promise.all([
      import("./framed-pages"),
      import("./FramedApp.svelte"),
    ]).catch(reloadForNewBuild);
    const framed = framedRoute(path);
    const load = framedPages[framed.file];
    if (load) {
      const { default: page } = await load().catch(reloadForNewBuild);
      route.set(framed);
      mount(FramedApp, { target: document.body, props: { page } });
      return;
    }
  }
  const { default: App } = await import("./App.svelte").catch(
    reloadForNewBuild,
  );
  mount(App, { target: document.body });
}

start();
