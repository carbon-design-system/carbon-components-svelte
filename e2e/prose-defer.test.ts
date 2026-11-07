import { expect, test } from "./helpers/host";

// With `deferOffscreen`, a skipped code block reserves a height until it
// first renders. If that differs from its rendered height, a block above
// the reader changes height as it renders and moves the page in Safari,
// which doesn't anchor the scroll.
test("a deferred code block reserves the height it renders at", async ({
  page,
}) => {
  await page.goto("/prose-defer.html");
  const blocks = page.locator("[data-testid^=pre-]");
  await expect(blocks).toHaveCount(18);

  const heights = await blocks.evaluateAll((pres) =>
    pres.map((pre) => {
      // A skipped block keeps its own box; what it skips is its content.
      const skipped = !pre.firstElementChild?.checkVisibility({
        contentVisibilityAuto: true,
      });
      const reserved = pre.getBoundingClientRect().height;
      (pre as HTMLElement).style.contentVisibility = "visible";
      const rendered = pre.getBoundingClientRect().height;
      return {
        skipped,
        reserved,
        rendered,
        difference: Math.abs(rendered - reserved),
      };
    }),
  );
  // Most blocks start below the viewport, skipped.
  expect(heights.filter((h) => h.skipped).length).toBeGreaterThan(10);
  for (const [i, { difference, reserved, rendered }] of heights.entries()) {
    // Line boxes round to a fraction of a pixel, so a long block can be off
    // by part of one.
    expect(difference, `block ${i}: ${reserved} vs ${rendered}`).toBeLessThan(
      1,
    );
  }
});

test("scrolling up through deferred code blocks doesn't move the page", async ({
  page,
}) => {
  await page.goto("/prose-defer.html");
  // Without scroll anchoring, as in Safari.
  await page.addStyleTag({ content: "html { overflow-anchor: none; }" });
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));

  const moves: number[] = [];
  for (let step = 0; step < 40; step++) {
    const shift = await page.evaluate(async () => {
      if (scrollY < 200) return null;
      const anchor = document.elementFromPoint(innerWidth / 2, 300);
      if (!anchor) return null;
      const before = anchor.getBoundingClientRect().top;
      scrollBy(0, -200);
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      return anchor.getBoundingClientRect().top - before - 200;
    });
    if (shift === null) break;
    // Sub-pixel rounding moves less than a pixel; a block that renders
    // taller or shorter than it reserved moves the page by the difference.
    if (Math.abs(shift) >= 1) moves.push(Math.round(shift));
  }
  expect(moves).toEqual([]);
});

// Chrome and Safari have no lines to measure in a skipped block, so its tab
// stop can wait until it renders.
test("a deferred wide code block gets a tab stop", async ({ page }) => {
  await page.goto("/prose-defer.html");
  const wide = page.getByTestId("wide-pre");
  await wide.scrollIntoViewIfNeeded();
  await expect(wide).toHaveAttribute("tabindex", "0");
  await expect(page.getByTestId("pre-0")).not.toHaveAttribute("tabindex");
});
