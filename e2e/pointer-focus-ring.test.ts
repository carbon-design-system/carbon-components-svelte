// The sweep opens every fixture page, so it depends on all of them.
// @depends-on e2e/fixtures/*.html
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// The focus ring follows the keyboard. Hover and clicks draw fills, never
// the ring, as in Carbon React. A region that takes focus so the keyboard
// can scroll it (a tab panel, a wide table, a log) rings on
// `:focus-visible`, so a click on its text leaves it plain.

const HERE = dirname(fileURLToPath(import.meta.url));

/** Pages that are not fixtures to sweep. */
const SKIP_PAGES: Record<string, string> = {
  "host.html": "the shared host page, with no fixture of its own",
  "index.html": "a list of links to the fixtures",
  "layout-checks.html": "the layout helpers' own failing cases",
};

const fixtures = readdirSync(join(HERE, "fixtures"))
  .filter((file) => file.endsWith(".html") && !(file in SKIP_PAGES))
  .sort();

/**
 * Opens a fixture page. bivium reads only literal URLs, and `@depends-on`
 * at the top of the file already names every page this opens.
 */
function open(page: Page, fixture: string) {
  const navigate = page.goto.bind(page);
  return navigate(`/${fixture}`);
}

/** A table scrolls sideways, and so takes focus, only when narrow. */
const WIDTHS = [1280, 360];

/**
 * Elements that show a ring in the white theme's `$focus` and that no
 * keyboard focus explains. A ring on a `:focus-visible` element or an
 * ancestor of one is the keyboard's. With `clicked`, a ring on the focused
 * control or its wrapper is the control's own, as a click rings a Carbon
 * React field. Leave it off where the user did not click what has focus.
 */
function strayRings(page: Page, { clicked = true } = {}) {
  return page.evaluate((clicked) => {
    const FOCUS = "rgb(15, 98, 254)";
    const CONTROL =
      "button, a[href], input, select, textarea, summary, [contenteditable=''], [contenteditable=true], [role=button], [role=combobox], [role=checkbox], [role=radio], [role=switch], [role=slider], [role=spinbutton], [role=tab], [role=option], [role=menuitem], [role=treeitem], [role=link], [role=searchbox], [role=textbox]";
    const active = document.activeElement;
    const activeControl = clicked && active?.matches(CONTROL) ? active : null;
    const visible = document.querySelector(":focus-visible");
    const describe = (el: Element) =>
      `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${[...el.classList]
        .map((name) => `.${name}`)
        .join("")}`;
    const found: string[] = [];
    for (const el of document.querySelectorAll("*")) {
      const style = getComputedStyle(el);
      const outlined =
        style.outlineStyle !== "none" &&
        Number.parseFloat(style.outlineWidth) >= 1 &&
        style.outlineColor === FOCUS;
      const bordered = (["Top", "Right", "Bottom", "Left"] as const).every(
        (side) =>
          style[`border${side}Style`] !== "none" &&
          Number.parseFloat(style[`border${side}Width`]) >= 1 &&
          style[`border${side}Color`] === FOCUS,
      );
      if (!(outlined || bordered || style.boxShadow.includes(FOCUS))) continue;
      if (visible && (el === visible || el.contains(visible))) continue;
      if (activeControl && (el === activeControl || el.contains(activeControl)))
        continue;
      found.push(describe(el));
    }
    return found;
  }, clicked);
}

const CONTROL =
  "button, a[href], input, select, textarea, summary, label, [contenteditable], [role=button], [role=combobox], [role=checkbox], [role=radio], [role=switch], [role=slider], [role=spinbutton], [role=tab], [role=option], [role=menuitem], [role=treeitem], [role=link], [role=searchbox], [role=textbox]";

/** How many focusable elements on the page are not controls. */
function countRegions(page: Page) {
  return page.evaluate(
    (control) =>
      [...document.querySelectorAll("[tabindex='0']")].filter(
        (el) => !el.matches(control),
      ).length,
    CONTROL,
  );
}

/**
 * Scrolls the `index`th focusable element that is not a control into view,
 * and returns a point on its first visible text away from any control or
 * other focusable element inside it.
 */
function regionTextPoint(page: Page, index: number) {
  return page.evaluate(
    ({ control, index }) => {
      const region = [
        ...document.querySelectorAll<HTMLElement>("[tabindex='0']"),
      ].filter((el) => !el.matches(control))[index];
      if (!region) return null;
      region.scrollIntoView({ block: "center", inline: "nearest" });
      const inner = `${control}, [tabindex]`;
      const walker = document.createTreeWalker(region, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent?.trim()) continue;
        const owner = node.parentElement?.closest(inner);
        if (owner && owner !== region && region.contains(owner)) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const rect = range.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) continue;
        const x = rect.left + Math.min(rect.width / 2, 20);
        const y = rect.top + rect.height / 2;
        if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue;
        // The point must land on the region's own content, not on a
        // control or a layer above it.
        if (document.elementFromPoint(x, y)?.closest(inner) !== region)
          continue;
        return {
          region: `${region.tagName.toLowerCase()}.${[...region.classList].join(".")}`,
          x,
          y,
        };
      }
      return null;
    },
    { control: CONTROL, index },
  );
}

test.describe("pointer focus ring sweep", () => {
  test.beforeAll(({ browserName }) => {
    test.skip(browserName !== "chromium", "one engine is enough for a sweep");
  });

  for (const fixture of fixtures) {
    test(fixture, async ({ page }) => {
      const stray: string[] = [];
      for (const width of WIDTHS) {
        // biome-ignore lint/performance/noAwaitInLoops: one width at a time
        await page.setViewportSize({ width, height: 720 });
        await open(page, fixture);
        const regions = await countRegions(page);
        for (let index = 0; index < regions; index++) {
          // biome-ignore lint/performance/noAwaitInLoops: one click at a time
          const point = await regionTextPoint(page, index);
          if (!point) continue;
          const before = new Set(await strayRings(page));
          await page.mouse.click(point.x, point.y);
          for (const ring of await strayRings(page)) {
            if (!before.has(ring))
              stray.push(`${width}px, click in ${point.region}: ${ring}`);
          }
          await page.evaluate(() =>
            (document.activeElement as HTMLElement | null)?.blur(),
          );
        }
      }
      expect(stray).toEqual([]);
    });
  }
});

test.describe("pointer focus ring", () => {
  test("hovering a list box option rings nothing", async ({ page }) => {
    await page.goto("/list-box-icons.html");
    for (const testId of ["combobox", "dropdown", "multiselect"]) {
      const wrapper = page.getByTestId(testId);
      // biome-ignore lint/performance/noAwaitInLoops: one menu at a time
      await wrapper.locator(".bx--list-box__field").click();
      const before = new Set(await strayRings(page));
      for (const option of await wrapper
        .locator(".bx--list-box__menu-item")
        .all()) {
        // biome-ignore lint/performance/noAwaitInLoops: one hover at a time
        await option.hover();
        const after = (await strayRings(page)).filter((r) => !before.has(r));
        expect(after, `${testId}: hover`).toEqual([]);
      }
      await page.keyboard.press("Escape");
    }
  });

  test("closing the mobile SideNav from its overlay rings nothing", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 600, height: 720 });
    await page.goto("/uishell.html");
    await page.getByRole("button", { name: /menu/i }).first().click();
    await page.evaluate(() =>
      (document.activeElement as HTMLElement | null)?.blur(),
    );
    const overlay = page.locator(".bx--side-nav__overlay-active");
    await expect(overlay).toBeVisible();

    const box = await overlay.boundingBox();
    if (!box) throw new Error("overlay has no box");
    await page.mouse.click(box.x + box.width - 10, box.y + box.height / 2);

    await expect(overlay).toHaveCount(0);
    expect(await strayRings(page, { clicked: false })).toEqual([]);
  });

  test("clicking an AILabel's revert rings nothing", async ({ page }) => {
    await page.goto("/ai-label-list-box.html");
    const revert = page.getByRole("button", { name: /revert/i }).first();
    await revert.click();
    // The revert button unmounts with the click.
    expect(await strayRings(page, { clicked: false })).toEqual([]);
  });
});

test("the keyboard still rings a focusable region", async ({ page }) => {
  await page.goto("/tabs.html");
  await page.getByRole("tab", { selected: true }).first().focus();
  await page.keyboard.press("Tab");

  const panel = page.locator(".bx--tab-content:focus");
  await expect(panel).toHaveCount(1);
  await expect(panel).toHaveCSS("outline-style", "solid");
});
