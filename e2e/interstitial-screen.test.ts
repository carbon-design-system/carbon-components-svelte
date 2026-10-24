import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

test("InterstitialScreen (full screen) sets the titled header on a layer and sizes the footer buttons", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/interstitial-screen.html?fullScreen");
  await expectLayout(page, "H1");
});

test("InterstitialScreen (modal) sets the titled header on a layer and sizes the footer buttons", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/interstitial-screen.html");
  await expectLayout(page, "H2");
});

async function expectLayout(page: Page, level: string) {
  await page.evaluate(() => document.fonts.ready);

  const read = () =>
    page.evaluate(() => {
      const style = (selector: string) => {
        const el = document.querySelector(selector);
        if (!el) throw new Error(`no ${selector}`);
        return getComputedStyle(el);
      };
      const width = (selector: string) =>
        document.querySelector(selector)?.getBoundingClientRect().width ?? 0;
      const title = document.querySelector(".bx--interstitial-screen__title");
      return {
        titleTag: title?.tagName,
        titleSize: style(".bx--interstitial-screen__title").fontSize,
        subtitleSize: style(".bx--interstitial-screen__subtitle").fontSize,
        header: style(".bx--interstitial-screen__header").backgroundColor,
        headerBorder: style(".bx--interstitial-screen__header")
          .borderBottomWidth,
        surface: style(".bx--interstitial-screen").backgroundColor,
        footerBorder: style(".bx--interstitial-screen__footer").borderTopWidth,
        footer: width(".bx--interstitial-screen__footer"),
        skip: width(".bx--interstitial-screen__footer .bx--btn--ghost"),
        next: width(".bx--interstitial-screen__footer .bx--btn--primary"),
      };
    });

  const wide = await read();
  expect(wide).toMatchObject({
    titleTag: level,
    titleSize: "28px",
    subtitleSize: "20px",
    // layer-01 over the background, with a border-subtle rule.
    header: "rgb(244, 244, 244)",
    headerBorder: "1px",
    surface: "rgb(255, 255, 255)",
    footerBorder: "1px",
    next: 240,
  });
  expect(wide.skip).toBeCloseTo(wide.footer - wide.next, 0);

  // Below md, the buttons share the row.
  await page.setViewportSize({ width: 375, height: 800 });
  await expect
    .poll(async () => {
      const narrow = await read();
      return Math.round(narrow.skip - narrow.next);
    })
    .toBe(0);
}
