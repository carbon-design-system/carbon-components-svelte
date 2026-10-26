import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { type BrowserContext, type Page, test as base } from "@playwright/test";

export { expect } from "@playwright/test";

/**
 * A worker-scoped page on e2e/fixtures/host.html. Navigating to `/x.html` for a
 * fixture whose entry only mounts one component remounts that component in
 * place instead of navigating, and the page is reset between tests. Any other
 * URL navigates as usual.
 */

// Entries are read as text, to learn which component each one mounts.
// @reads e2e/fixtures/*.ts
const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "../fixtures");
const entries = new Map<string, string | null>();
const FIXTURE_IMPORT = /^import \w+ from "\.\/(\w+Fixture)\.svelte";$/gm;
const MOUNT_IMPORT = /^import \{ mount \} from "\.\/mount";$/m;
const COMMENTS = /^\s*\/\/.*$/gm;
const SINGLE_MOUNT = /^mount\(\w+\);$/m;
const FIXTURE_URL = /^\/([\w-]+)\.html(\?.*)?$/;

/** The component a fixture entry mounts, or null when the entry does more. */
function fixtureFor(entry: string) {
  if (!entries.has(entry)) {
    let name: string | null = null;
    try {
      const source = readFileSync(join(FIXTURES, `${entry}.ts`), "utf8");
      const imports = [...source.matchAll(FIXTURE_IMPORT)];
      // Anything besides the fixture import, ./mount and the mount call (an
      // extra stylesheet, setup code) only runs on a real page load.
      const rest = source
        .replace(FIXTURE_IMPORT, "")
        .replace(MOUNT_IMPORT, "")
        .replace(SINGLE_MOUNT, "")
        .replace(COMMENTS, "")
        .trim();
      if (imports.length === 1 && SINGLE_MOUNT.test(source) && rest === "")
        name = imports[0][1];
    } catch {}
    entries.set(entry, name);
  }
  return entries.get(entry) ?? null;
}

async function openHost(page: Page) {
  await page.goto("/host.html");
  await page.waitForFunction(() => window.__host !== undefined);
}

export const test = base.extend<
  { page: Page; context: BrowserContext },
  { hostPage: Page }
>({
  hostPage: [
    async ({ browser }, use, workerInfo) => {
      const {
        viewport,
        baseURL,
        deviceScaleFactor,
        userAgent,
        hasTouch,
        isMobile,
      } = workerInfo.project.use;
      const context = await browser.newContext({
        viewport,
        baseURL,
        deviceScaleFactor,
        userAgent,
        hasTouch,
        isMobile,
      });
      const page = await context.newPage();
      const navigate = page.goto.bind(page);
      let onHost = false;
      let mounted: readonly [string, string] | null = null;
      const remount = (
        fixture: readonly [string, string],
        keepStorage: boolean,
      ) =>
        page.evaluate(
          ([name, search, keep]) => window.__host.mount(name, search, keep),
          [fixture[0], fixture[1], keepStorage] as const,
        );
      const reload = page.reload.bind(page);
      // Reloading remounts the fixture and keeps storage, like a real reload.
      page.reload = async (options) => {
        if (!onHost || !mounted) return reload(options);
        await remount(mounted, true);
        return null;
      };
      page.goto = async (url, options) => {
        const match = FIXTURE_URL.exec(url);
        const name = match && fixtureFor(match[1]);
        if (!name) {
          onHost = false;
          mounted = null;
          return navigate(url, options);
        }
        if (!onHost) {
          await openHost(page);
          onHost = true;
        }
        mounted = [name, match[2] ?? ""];
        await remount(mounted, false);
        return null;
      };
      await use(page);
      await context.close();
    },
    { scope: "worker" },
  ],

  // The host page's context, so `context.grantPermissions` reaches it.
  context: async ({ hostPage }, use) => {
    await use(hostPage.context());
    await hostPage.context().clearPermissions();
  },

  page: async ({ hostPage }, use, testInfo) => {
    // Park the pointer where no fixture renders. At the origin it sits on
    // the next fixture's first control, and Chrome hovers whatever mounts
    // under a pointer it has seen, so a tooltip could open on its own.
    const size = hostPage.viewportSize() ?? { width: 1280, height: 720 };
    await hostPage.mouse.move(size.width - 1, size.height - 1);
    await use(hostPage);
    // A click leaves Chrome's focus-visible heuristic in pointer mode, so a
    // later test's `focus()` would match :focus but not :focus-visible. A
    // fresh page starts out of pointer mode, and a key press puts it back.
    // Unmount first, so no fixture hears the key.
    const onHost = await hostPage.evaluate(() => {
      window.__host?.clear();
      return window.__host !== undefined;
    });
    if (onHost) await hostPage.keyboard.press("Shift");
    const { viewport } = testInfo.project.use;
    if (viewport) await hostPage.setViewportSize(viewport);
    await hostPage.emulateMedia({
      media: null,
      colorScheme: null,
      reducedMotion: null,
      forcedColors: null,
      contrast: null,
    });
  },
});
