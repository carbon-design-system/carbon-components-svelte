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
