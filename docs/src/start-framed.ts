import { mount } from "svelte";
import { route } from "./current-route";
import { framedRoute } from "./routes";
import { reloadForNewBuild } from "./stale-build";

/**
 * Mounts the framed example at `path`, without the site's shell, router
 * and search. Resolves false when no example has that path.
 */
export async function startFramed(path: string): Promise<boolean> {
  const [{ framedPages }, { default: FramedApp }] = await Promise.all([
    import("./framed-pages"),
    import("./FramedApp.svelte"),
  ]).catch(reloadForNewBuild);
  const framed = framedRoute(path);
  const load = framedPages[framed.file];
  if (!load) return false;
  const { default: page } = await load().catch(reloadForNewBuild);
  route.set(framed);
  mount(FramedApp, { target: document.body, props: { page } });
  return true;
}
