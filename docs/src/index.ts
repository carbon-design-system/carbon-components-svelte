import { mount } from "svelte";
import "../../css/all.css";
import "../../css/fonts.css";
import "../../css/prose.css";
import "../../css/syntax-tokens.css";
import "../../css/syntax.css";
import { route } from "./current-route";
import "./global.css";
import { FRAMED_PREFIX, framedRoute, normalizePath } from "./routes";

/** A framed example skips the site's shell, router and search. */
async function start() {
  const path = normalizePath(window.location.pathname);
  if (path.startsWith(FRAMED_PREFIX)) {
    const [{ framedPages }, { default: FramedApp }] = await Promise.all([
      import("./framed-pages"),
      import("./FramedApp.svelte"),
    ]);
    const framed = framedRoute(path);
    const load = framedPages[framed.file];
    if (load) {
      route.set(framed);
      mount(FramedApp, {
        target: document.body,
        props: { page: (await load()).default },
      });
      return;
    }
  }
  const { default: App } = await import("./App.svelte");
  mount(App, { target: document.body });
}

start();
