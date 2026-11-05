import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "./helpers/host";
import { findLayoutProblems } from "./helpers/layout";

const LOCALES = [
  ["en-US", "ltr"],
  ["de-DE", "ltr"],
  ["ar-EG", "rtl"],
  ["ja-JP", "ltr"],
  ["fr-CH", "ltr"],
] as const;

/** Formats in the page, so the browser's own ICU is the reference. */
const format = (
  page: Page,
  locale: string,
  value: number,
  options?: Intl.NumberFormatOptions,
) =>
  page.evaluate(
    ([locale, value, options]) =>
      new Intl.NumberFormat(locale, options).format(value),
    [locale, value, options] as const,
  );

const amount = (page: Page) =>
  page.getByRole("textbox", { name: "Amount", exact: true });

test.describe("LocaleProvider", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/locale-provider.html");
    await expect(amount(page)).toBeVisible();
    const ltr = await new AxeBuilder({ page }).include("#app").analyze();
    expect(ltr.violations).toEqual([]);

    await page.goto("/locale-provider-rtl.html");
    await expect(amount(page)).toBeVisible();
    const rtl = await new AxeBuilder({ page }).include("#app").analyze();
    expect(rtl.violations).toEqual([]);
  });

  test("updates every adopting component when the locale changes", async ({
    page,
  }) => {
    await page.goto("/locale-provider.html");
    const provider = page.getByTestId("provider");

    for (const [locale, dir] of LOCALES) {
      await page.getByLabel("Locale").selectOption(locale);

      await expect(provider).toHaveAttribute("dir", dir);
      await expect(provider).toHaveAttribute("lang", locale);
      await expect(amount(page)).toHaveValue(
        await format(page, locale, 1234567.89),
      );
      await expect(provider).toContainText(
        `${await format(page, locale, 12345)} item`,
      );
      await expect(provider).toContainText(
        `${await format(page, locale, 1.5, {
          maximumFractionDigits: 1,
          useGrouping: false,
        })} kB`,
      );
      // The nested provider keeps its own locale.
      await expect(
        page.getByRole("textbox", { name: "Nested (fr-CH)" }),
      ).toHaveValue(await format(page, "fr-CH", 1234567.89));
    }
  });

  test("lays out without overflow after the flip to right to left", async ({
    page,
  }) => {
    await page.goto("/locale-provider.html");
    await page.getByLabel("Locale").selectOption("ar-EG");
    await expect(page.getByTestId("provider")).toHaveAttribute("dir", "rtl");

    for (const check of ["overflow", "borders", "fits"] as const) {
      // eslint-disable-next-line no-await-in-loop -- one check at a time
      expect(await findLayoutProblems(page, check), check).toEqual([]);
    }
  });

  test("starts the calendar's week on the locale's first day", async ({
    page,
  }) => {
    await page.goto("/locale-provider.html");
    const weekdays = () =>
      page.locator(".bx--date-picker__weekday").allTextContents();

    await page.getByLabel("Locale").selectOption("de-DE");
    await page.getByRole("textbox", { name: "Date" }).click();
    await expect.poll(async () => (await weekdays())[0]?.trim()).toBe("Mo");

    await page.getByLabel("Locale").selectOption("en-US");
    await expect.poll(async () => (await weekdays())[0]?.trim()).toBe("Sun");
  });

  test("prints the same text in browsers with different defaults", async ({
    browser,
  }) => {
    const defaults = [
      { locale: "en-US", timezoneId: "America/New_York" },
      { locale: "ja-JP", timezoneId: "Asia/Tokyo" },
    ];
    const titles: { provider: string | null; runtime: string | null }[] = [];

    for (const options of defaults) {
      // eslint-disable-next-line no-await-in-loop -- one context at a time
      const context = await browser.newContext(options);
      // eslint-disable-next-line no-await-in-loop -- one context at a time
      const page = await context.newPage();
      // eslint-disable-next-line no-await-in-loop -- one context at a time
      await page.goto("/locale-provider.html");
      // eslint-disable-next-line no-await-in-loop -- one context at a time
      titles.push({
        provider: await page.getByTestId("relative-time").getAttribute("title"),
        runtime: await page.getByTestId("runtime-time").getAttribute("title"),
      });
      // eslint-disable-next-line no-await-in-loop -- one context at a time
      await context.close();
    }

    // Left to the runtime, the two browsers disagree.
    expect(titles[0].runtime).not.toBe(titles[1].runtime);
    // With a provider that sets both, they agree.
    expect(titles[0].provider).toBe(titles[1].provider);
  });
});
