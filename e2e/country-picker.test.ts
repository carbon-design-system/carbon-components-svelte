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
    // The flags load when the menu opens: Japan's disc is red.
    await expect(row.locator('svg.bx--flag path[fill="#da1e28"]')).toHaveCount(
      1,
    );
    await expect(row.locator(".bx--intl-picker__secondary")).toHaveText("日本");
  });

  test("shows the code in a box when the flag is a badge", async ({ page }) => {
    await page.goto("/country-picker.html");
    await open(page, "Badge");

    const badge = page
      .getByRole("option", { name: /Switzerland/ })
      .locator(".bx--flag--badge");
    await expect(badge).toHaveText("CH");
    expect(await badge.boundingBox()).toMatchObject({ width: 24, height: 18 });
  });

  // The box fills with `$layer-accent`, which is the selected row's own
  // `$layer-selected` in White and Gray 100, and a step from the hovered
  // row's: only the code showed.
  test("sets the code box apart from a selected or hovered row", async ({
    page,
  }) => {
    for (const theme of ["white", "g100"]) {
      // biome-ignore lint/performance/noAwaitInLoops: one theme at a time
      await page.goto(`/country-picker.html?theme=${theme}`);
      await open(page, "Badge");
      const selected = page.locator(".bx--list-box__menu-item--active");
      const hovered = selected.locator("xpath=following-sibling::*[1]");
      await hovered.hover();
      // Read the rows once their background transitions end.
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              document
                .querySelector(".bx--list-box__menu")
                ?.getAnimations({ subtree: true }).length,
          ),
        )
        .toBe(0);

      for (const [state, row] of [
        ["selected", selected],
        ["hovered", hovered],
      ] as const) {
        // biome-ignore lint/performance/noAwaitInLoops: one row at a time
        const ratio = await row.evaluate((node) => {
          const luminance = (color: string) => {
            const [r, g, b] = (color.match(/[\d.]+/g) ?? []).map((c) => {
              const v = Number(c) / 255;
              return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
            });
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
          };
          const badge = node.querySelector(".bx--flag--badge");
          if (!badge) throw new Error("no badge");
          const [a, b] = [
            getComputedStyle(node).backgroundColor,
            getComputedStyle(badge).backgroundColor,
          ].map(luminance);
          return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        });
        expect.soft(ratio, `${theme}, ${state}`).toBeGreaterThan(1.1);
      }
    }
  });

  test("draws a flag where there is one, and a box of the same size where there is not", async ({
    page,
  }) => {
    await page.goto("/country-picker.html");
    await open(page, "Automatic flag");
    const field = page.getByRole("combobox", { name: "Automatic flag" });

    async function leading(query: string, name: RegExp) {
      await field.fill(query);
      const row = page.getByRole("option", { name });
      await expect(row.locator(".bx--flag")).toBeVisible();
      return {
        flag: await row.locator(".bx--flag").boundingBox(),
        text: await row.locator(".bx--intl-picker__text").boundingBox(),
        drawn: await row.locator("svg.bx--flag").count(),
      };
    }

    const japan = await leading("japan", /Japan/);
    // Kosovo has no flag drawn yet, so a box with its code stands in.
    const kosovo = await leading("kosovo", /Kosovo/);

    expect(japan.drawn).toBe(1);
    expect(kosovo.drawn).toBe(0);
    expect(kosovo.flag).toMatchObject({ width: 20, height: 15 });
    expect(japan.flag).toMatchObject({ width: 20, height: 15 });
    // The names start at the same place in both rows.
    expect(kosovo.text?.x).toBeCloseTo(japan.text?.x ?? 0);
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
    const flag = await row.locator(".bx--flag").boundingBox();
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
