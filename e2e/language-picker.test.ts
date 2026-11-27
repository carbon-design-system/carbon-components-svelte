import { expect, test } from "./helpers/host";
import { missing, open, optionTexts } from "./helpers/intl-picker";

test.describe("LanguagePicker", () => {
  test("opens, searches by endonym and picks with the keyboard alone", async ({
    page,
  }) => {
    await page.goto("/language-picker.html");
    const field = page.getByRole("combobox", { name: "Language", exact: true });
    await field.focus();

    await page.keyboard.press("ArrowDown");
    await page.keyboard.type("deutsch");
    await page.keyboard.press("Enter");

    await expect(field).toHaveValue("German");
    await expect(page.getByTestId("language-value")).toHaveText("de");
    await expect(page.getByTestId("language-changes")).toHaveText("de");
  });

  test("finds every language and variant by typing its name", async ({
    page,
  }) => {
    await page.goto("/language-picker.html");
    const field = await open(page, "With variants");

    const languages = await page.evaluate(() => {
      const names = new Intl.DisplayNames("en", {
        type: "language",
        fallback: "none",
        languageDisplay: "standard",
      });
      const picked: { id: string; query: string }[] = [];
      for (const tag of [
        "en",
        "fr",
        "ar",
        "he",
        "zh",
        "ja",
        "pt",
        "es",
        "de",
        "ru",
        "fil",
        "yue",
        "pt-BR",
        "pt-PT",
        "es-419",
        "es-MX",
        "zh-Hans",
        "zh-Hant",
        "sr-Cyrl",
        "sr-Latn",
        "fr-CA",
        "en-GB",
      ]) {
        const name = names.of(tag);
        if (name) picked.push({ id: tag, query: name });
      }
      return picked;
    });
    expect(languages.length).toBeGreaterThan(15);

    expect(await missing(field, languages)).toEqual([]);
  });

  test("shows the endonym in its own language and direction", async ({
    page,
  }) => {
    await page.goto("/language-picker.html");
    await open(page, "Language");
    await page.keyboard.type("arab");

    const endonym = page
      .getByRole("option", { name: /Arabic/ })
      .locator(".bx--intl-picker__secondary");
    await expect(endonym).toHaveText("العربية");
    await expect(endonym).toHaveAttribute("lang", "ar");
    await expect(endonym).toHaveAttribute("dir", "rtl");
  });

  test("names script and region variants", async ({ page }) => {
    await page.goto("/language-picker.html");
    const field = page.getByRole("combobox", {
      name: "With variants",
      exact: true,
    });
    await expect(field).toHaveValue("Portuguese (Brazil)");
    await field.click();
    await field.fill("chinese");

    await expect
      .poll(() => optionTexts(page))
      .toEqual(
        expect.arrayContaining([
          "Chinese",
          "Chinese (Simplified)",
          "Chinese (Traditional)",
        ]),
      );
  });

  test("renames the names when the locale changes at runtime", async ({
    page,
  }) => {
    await page.goto("/language-picker.html");
    for (const [locale, name] of [
      ["he", "צרפתית"],
      ["ar", "الفرنسية"],
      ["ja", "フランス語"],
    ]) {
      // biome-ignore lint/performance/noAwaitInLoops: one locale at a time
      await page.getByTestId(`locale-${locale}`).click();
      const field = page.getByRole("combobox", {
        name: "Supported",
        exact: true,
      });
      await field.click();
      await field.fill(name);
      await expect.poll(() => optionTexts(page)).toEqual([name]);
      await page.keyboard.press("Escape");
    }
  });

  test("keeps the tag left to right under dir=rtl", async ({ page }) => {
    await page.goto("/language-picker.html?dir=rtl&locale=ar");
    await open(page, "Language");

    const row = page.getByRole("option").first();
    const tag = row.locator(".bx--intl-picker__trailing bdi");
    await expect(tag).toHaveCSS("direction", "ltr");
    await expect(tag).toHaveCSS("unicode-bidi", "isolate");
    // The tag sits at the end of the row, which is the left edge.
    const rowBox = await row.boundingBox();
    const box = await tag.boundingBox();
    expect(rowBox && box && box.x < rowBox.x + 64).toBe(true);
  });

  test("opens above a Modal and picks", async ({ page }) => {
    await page.goto("/language-picker.html");
    await page.getByTestId("open-modal").click();
    const field = page.getByRole("combobox", {
      name: "Modal language",
      exact: true,
    });
    await field.fill("japan");
    await page.keyboard.press("Enter");

    await expect(page.getByTestId("modal-value")).toHaveText("ja");
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
