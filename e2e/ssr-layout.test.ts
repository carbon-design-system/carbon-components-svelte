import { expect, test } from "./helpers/host";

/**
 * Parts of a layout that settle once a component mounts (a class from its
 * children, a measured height, a computed position) render the same in
 * the server's markup. Each case measures the mounted component, puts it
 * back in its server state, and checks that nothing moved.
 */
const rect = (page, selector: string) =>
  page.locator(selector).evaluate((el) => {
    const r = el.getBoundingClientRect();
    return [r.x, r.y, r.width, r.height].map(Math.round);
  });

test.beforeEach(async ({ page }) => {
  await page.goto("/ssr-layout.html");
});

test("a collapsed ExpandableTile is its collapsed height before it measures", async ({
  page,
}) => {
  const selector = "[data-testid=tile] .bx--tile--expandable";
  const mounted = await rect(page, selector);
  await page.locator(selector).evaluate((el) => {
    el.classList.add("bx--tile--unmeasured");
    (el as HTMLElement).style.maxHeight = "none";
  });
  expect(await rect(page, selector)).toEqual(mounted);
});

test("an open OverflowMenu sits under its button before it's positioned", async ({
  page,
}) => {
  const selector = "[data-testid=menu] .bx--overflow-menu-options";
  const mounted = await rect(page, selector);
  await page.locator(selector).evaluate((el) => {
    (el as HTMLElement).style.top = "";
    (el as HTMLElement).style.left = "";
  });
  expect(await rect(page, selector)).toEqual(mounted);
});

test("an open Tearsheet keeps its layout when its scrolling body takes a tab stop", async ({
  page,
}) => {
  const container = ".bx--tearsheet__container";
  const main = `${container} .bx--tearsheet__main`;
  const mounted = [await rect(page, container), await rect(page, main)];
  // The server renders the body before it measures an overflow, so it has
  // no tab stop or region role yet.
  await page.locator(main).evaluate((el) => {
    el.removeAttribute("tabindex");
    el.removeAttribute("role");
    el.removeAttribute("aria-labelledby");
  });
  expect([await rect(page, container), await rect(page, main)]).toEqual(
    mounted,
  );
});

test("an above-header ShellBanner is the height the server reserves", async ({
  page,
}) => {
  // The server writes `--ccs-shell-offset: 2.5rem` before the page measures
  // the banner, and the banner is one line, so the shell does not move.
  const { banner, estimate } = await page.evaluate(() => {
    const rem = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );
    return {
      banner: document
        .querySelector(".bx--shell-banner")
        ?.getBoundingClientRect().height,
      estimate: 2.5 * rem,
    };
  });
  expect(banner).toBe(estimate);
});

test("a LanguagePicker row keeps its height when the name in its own script arrives", async ({
  page,
}) => {
  // The endonym is looked up while the browser is idle, in the language's
  // own direction. Arabic is written right to left, English is not, and
  // both rows are the same height. The picker starts open: the open
  // Tearsheet above takes the pointer.
  const rows = page.locator("[data-testid=language] [role=option]");
  await expect(rows).toHaveCount(2);
  const heights = await rows.evaluateAll((els) =>
    els.map((el) => Math.round(el.getBoundingClientRect().height)),
  );
  expect(heights[0]).toBe(heights[1]);
});
