import { mount } from "svelte";
import { route } from "./current-route";
import "./global.css";
import { DEV } from "virtual:site";
import { FRAMED_PREFIX, framedRoute, normalizePath } from "./routes";
import { reloadForNewBuild } from "./stale-build";

/**
 * The dev server serves the theme sheets outside its bundle; link them
 * ahead of the bundle's sheets, as the build does
 * (`scripts/carbon-sheets.ts`).
 */
function linkThemeSheets(): Promise<unknown> {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/assets/carbon.css";
  const loaded = new Promise((resolve) => {
    link.onload = link.onerror = resolve;
  });
  document.head.insertBefore(
    link,
    document.head.querySelector('link[rel="stylesheet"]'),
  );
  return loaded;
}

/** A framed example skips the site's shell, router and search. */
async function start() {
  if (DEV) await linkThemeSheets();
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
