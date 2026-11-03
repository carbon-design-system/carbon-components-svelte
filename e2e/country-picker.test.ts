import { expect, test } from "./helpers/host";
import { missing, open, optionTexts } from "./helpers/intl-picker";

test.describe("CountryPicker", () => {
  test("opens, searches and picks with the keyboard alone", async ({
    page,
  }) => {
    await page.goto("/country-picker.html");
    const field = page.getByRole("combobox", { name: "Country", exact: true });
    await field.focus();

    await page.keyboard.press("ArrowDown");
    await page.keyboard.type("switz");
    await page.keyboard.press("Enter");

    await expect(field).toHaveValue("Switzerland");
    await expect(page.getByTestId("country-value")).toHaveText("CH");
    await expect(page.getByTestId("country-native")).toHaveText("Schweiz");
    await expect(page.getByTestId("country-changes")).toHaveText("CH");
  });

  test("finds every region the browser names by typing its name", async ({
    page,
  }) => {
    await page.goto("/country-picker.html");
    const field = await open(page, "Country");

    // Found from the browser's own data, apart from the codes that are not
    // countries: reserved and pseudo codes, and the deprecated ones that
    // `Intl` canonicalizes to a successor.
    const regions = await page.evaluate(() => {
      const names = new Intl.DisplayNames("en", {
        type: "region",
        fallback: "none",
      });
      const notCountries = new Set(
        "AC CP DG EA EU EZ IC TA UN QO XA XB ZZ".split(" "),
      );
      const picked: { id: string; query: string }[] = [];
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      for (const a of letters) {
        for (const b of letters) {
          const code = a + b;
          const name = names.of(code);
          const current = Intl.getCanonicalLocales(`und-${code}`)[0].slice(4);
          if (name && !notCountries.has(code) && current === code) {
            picked.push({ id: code, query: name });
          }
        }
      }
      return picked;
    });
    expect(regions.length).toBeGreaterThan(240);
    await expect(page.getByRole("option").first()).toHaveAttribute(
      "aria-setsize",
      String(regions.length),
    );

    expect(await missing(field, regions)).toEqual([]);
  });

  test("shows the flag, the name and the name in the region's own language", async ({
    page,
  }) => {
    await page.goto("/country-picker.html");
    await open(page, "Country");
    await page.keyboard.type("japan");

    const row = page.getByRole("option", { name: /Japan/ });
    await expect(row.locator(".bx--intl-picker__flag")).toHaveText(
      "\u{1F1EF}\u{1F1F5}",
    );
    await expect(row.locator(".bx--intl-picker__secondary")).toHaveText("日本");
  });

  test("shows the code in a box when the flag is a badge", async ({ page }) => {
    await page.goto("/country-picker.html");
    await open(page, "Badge");

    const badge = page
      .getByRole("option", { name: /Switzerland/ })
      .locator(".bx--intl-picker__badge");
    await expect(badge).toHaveText("CH");
    const border = await badge.evaluate(
      (el) => getComputedStyle(el).borderTopWidth,
    );
    expect(border).toBe("1px");
  });

  test("lists flags automatically where the platform draws them", async ({
    page,
  }) => {
    await page.goto("/country-picker.html");
    await open(page, "Automatic flag");

    // Headless Chromium paints the emoji, so `auto` must pick the flag.
    await expect(page.locator(".bx--intl-picker__flag").first()).toBeVisible();
    await expect(page.locator(".bx--intl-picker__badge")).toHaveCount(0);
  });

  test("renames the names when the locale changes at runtime", async ({
    page,
  }) => {
    await page.goto("/country-picker.html");
    await open(page, "Country");
    await page.keyboard.type("germ");
    await expect(optionTexts(page)).resolves.toEqual(["Germany"]);
    await page.keyboard.press("Escape");

    for (const [locale, name] of [
      ["ar", "ألمانيا"],
      ["he", "גרמניה"],
      ["ja", "ドイツ"],
    ]) {
      // biome-ignore lint/performance/noAwaitInLoops: one locale at a time
      await page.getByTestId(`locale-${locale}`).click();
      const field = page.getByRole("combobox", {
        name: "Country",
        exact: true,
      });
      await field.click();
      await field.fill(name);
      await expect.poll(() => optionTexts(page)).toEqual([name]);
      await page.keyboard.press("Escape");
    }
  });

  test("lists in Arabic with the flag at the start edge under dir=rtl", async ({
    page,
  }) => {
    await page.goto("/country-picker.html?dir=rtl&locale=ar");
    await open(page, "Country");

    const row = page.getByRole("option").first();
    const flag = await row.locator(".bx--intl-picker__flag").boundingBox();
    const text = await row.locator(".bx--intl-picker__text").boundingBox();
    expect(flag && text && flag.x > text.x).toBe(true);
    const sorted = await optionTexts(page);
    const collator = new Intl.Collator("ar");
    expect(sorted).toEqual([...sorted].sort(collator.compare));
  });

  test("detects the region of the locale after mount", async ({ page }) => {
    await page.goto("/country-picker.html");

    await expect(
      page.getByRole("combobox", { name: "Detected", exact: true }),
    ).toHaveValue("United States");
  });

  test("opens above a Modal and picks", async ({ page }) => {
    await page.goto("/country-picker.html");
    await page.getByTestId("open-modal").click();
    const field = page.getByRole("combobox", {
      name: "Modal country",
      exact: true,
    });
    await field.fill("peru");
    await page.keyboard.press("Enter");

    await expect(page.getByTestId("modal-value")).toHaveText("PE");
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
