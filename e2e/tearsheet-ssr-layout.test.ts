import { expect, test } from "./helpers/host";

/**
 * The server's markup of an open Tearsheet lays out as the mounted one, as
 * in `ssr-layout.test.ts`. The Tearsheet has its own page: open, it covers
 * the window and takes the pointer from anything beside it.
 */
const rect = (page, selector: string) =>
  page.locator(selector).evaluate((el) => {
    const r = el.getBoundingClientRect();
    return [r.x, r.y, r.width, r.height].map(Math.round);
  });

test("an open Tearsheet keeps its layout when its scrolling body takes a tab stop", async ({
  page,
}) => {
  await page.goto("/tearsheet-ssr-layout.html");
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
