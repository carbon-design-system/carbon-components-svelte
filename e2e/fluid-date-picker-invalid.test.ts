import type { Browser, Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

/**
 * A fluid single date picker's invalid outline is drawn once. The wrapper and
 * the container inside it sit on boxes a pixel apart, so outlining both drew
 * two red lines along the bottom edge. A 1px divider separates the field from
 * its message, as in the warn state.
 */
test("a fluid invalid date picker draws one outline and a divider", async ({
  page,
}) => {
  await page.goto("/fluid-date-picker.html");

  const picker = page.getByTestId("fluid-date-picker-single-invalid");
  expect.soft(await outlined(picker)).toHaveLength(1);

  const divider = await picker
    .locator(".bx--date-picker__input")
    .evaluate((el) => {
      const { borderBlockEndStyle, borderBlockEndWidth } = getComputedStyle(el);
      return `${borderBlockEndWidth} ${borderBlockEndStyle}`;
    });
  expect(divider).toBe("1px solid");
});

const RED = "rgb(218, 30, 40)";
const TRANSPARENT = "rgba(0, 0, 0, 0)";

/** The elements of `root` (and `root`) that draw a visible outline. */
async function outlined(root: Locator) {
  const all = await root.evaluate((el) =>
    [el, ...el.querySelectorAll("*")].map((node) => {
      const { outlineStyle, outlineWidth, outlineColor } =
        getComputedStyle(node);
      return {
        cls: String(node.getAttribute("class")),
        outlineStyle,
        outlineWidth,
        outlineColor,
      };
    }),
  );
  return all.filter(
    (node) =>
      node.outlineStyle !== "none" &&
      Number.parseFloat(node.outlineWidth) &&
      node.outlineColor !== TRANSPARENT,
  );
}

/**
 * The fixture as the server writes it, with JavaScript off. The picker's own
 * status classes come from its cells, which register after the picker's markup
 * is written, so the server's picker is always `--neutral`; the cells mark
 * their own containers. Reloading the mounted DOM with the picker's classes
 * put back to the server's stands in for that markup (`DatePickerFluid.ssr`
 * checks the real markup).
 */
async function serverMarkup(
  page: Page,
  browser: Browser,
  baseURL: string | undefined,
) {
  await page.goto("/fluid-date-picker.html");
  await expect(
    page.getByTestId("fluid-date-picker-single-invalid"),
  ).toBeVisible();
  const html = await page.evaluate(() => {
    for (const script of document.querySelectorAll("script")) script.remove();
    for (const picker of document.querySelectorAll(".bx--date-picker--fluid")) {
      picker.classList.remove(
        "bx--date-picker--fluid--invalid",
        "bx--date-picker--fluid--warn",
        "bx--date-picker--fluid--readonly",
      );
      picker.classList.add("bx--date-picker--fluid--neutral");
    }
    return document.documentElement.outerHTML;
  });

  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
  });
  const staticPage = await context.newPage();
  // Load the page URL first so stylesheet links still resolve.
  await staticPage.goto("/fluid-date-picker.html");
  await staticPage.setContent(html);
  return { staticPage, context };
}

test("server markup of a fluid invalid date picker is outlined once", async ({
  page,
  browser,
  baseURL,
}) => {
  await page.goto("/fluid-date-picker.html");
  const hydrated = page.getByTestId("fluid-date-picker-single-invalid");
  await expect(hydrated).toBeVisible();
  const height = (await hydrated.boundingBox())?.height;

  const { staticPage, context } = await serverMarkup(page, browser, baseURL);
  const picker = staticPage.getByTestId("fluid-date-picker-single-invalid");
  const drawn = await outlined(picker);
  expect(drawn).toHaveLength(1);
  expect(drawn[0].outlineColor).toBe(RED);
  // No jump when the picker hydrates and its wrapper takes the outline.
  expect((await picker.boundingBox())?.height).toBe(height);
  await context.close();
});

test("server markup of a fluid range with one status cell keeps the divider off the next cell", async ({
  page,
  browser,
  baseURL,
}) => {
  const { staticPage, context } = await serverMarkup(page, browser, baseURL);
  const divider = (id: string) =>
    staticPage
      .getByTestId(`fluid-date-picker-${id}`)
      .locator(".bx--date-picker-container")
      .last()
      .evaluate((el) => getComputedStyle(el).borderBlockEndColor);

  // Transparent, as after hydration, not the neutral `$border-strong` line.
  expect(await divider("range-invalid")).toBe(TRANSPARENT);
  expect(await divider("range-warn")).toBe(TRANSPARENT);
  expect(await divider("range-neutral")).not.toBe(TRANSPARENT);

  // The range keeps its per-cell outline on the invalid cell.
  const drawn = await outlined(
    staticPage.getByTestId("fluid-date-picker-range-invalid"),
  );
  expect(drawn).toHaveLength(1);
  expect(drawn[0].outlineColor).toBe(RED);
  await context.close();
});
