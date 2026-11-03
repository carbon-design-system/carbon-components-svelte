import { expect, test } from "./helpers/host";

// A collapsed expandable ToolbarSearch is a 32px square in a small
// toolbar. Beside a persistent search that asks for the full width, it
// shrank below its magnifier, which then ran past the page edge.
test("a collapsed toolbar search keeps the page from scrolling sideways", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/data-table-variants.html");
  const read = await page.evaluate(() => {
    const search = document.querySelector(
      "[data-testid=toolbar] .bx--table-toolbar--small .bx--toolbar-search-container-disabled",
    );
    const icon = search?.querySelector(".bx--search-magnifier-icon");
    const { scrollWidth, clientWidth } = document.documentElement;
    return {
      searchWidth: search?.getBoundingClientRect().width,
      iconRight: icon?.getBoundingClientRect().right,
      scrollWidth,
      clientWidth,
    };
  });
  expect.soft(read.searchWidth, "search width").toBe(32);
  expect.soft(read.iconRight, "magnifier right").toBe(read.clientWidth);
  expect.soft(read.scrollWidth, "page scrollWidth").toBe(read.clientWidth);
});
