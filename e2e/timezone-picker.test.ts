import { expect, test } from "./helpers/host";
import { missing, open, optionTexts } from "./helpers/intl-picker";
import { expectSingleRing } from "./helpers/layout";

test.describe("TimezonePicker", () => {
  test("opens, searches and picks with the keyboard alone", async ({
    page,
  }) => {
    await page.goto("/timezone-picker.html");
    await page.getByTestId("outside-target").focus();

    // The four locale buttons come between the outside target and the field.
    // biome-ignore lint/performance/noAwaitInLoops: key presses go in order
    for (let tab = 0; tab < 5; tab++) await page.keyboard.press("Tab");
    const field = page.getByRole("combobox", {
      name: "Time zone",
      exact: true,
    });
    await expect(field).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.type("tokyo");
    await expect(page.getByRole("option")).toHaveCount(1);
    await page.keyboard.press("Enter");

    await expect(field).toHaveValue("Tokyo");
    await expect(page.getByTestId("tz-value")).toHaveText("Asia/Tokyo");
    await expect(page.getByTestId("tz-changes")).toHaveText("Asia/Tokyo");
    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(field).toBeFocused();
  });

  test("walks the whole list with the arrow keys, a group header at a time", async ({
    page,
  }) => {
    await page.goto("/timezone-picker.html");
    const field = await open(page, "Time zone");

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    const active = await field.getAttribute("aria-activedescendant");
    expect(active).toMatch(/Africa\/Abidjan$/);
    await page.keyboard.press("End");
    await expect(field).toHaveAttribute(
      "aria-activedescendant",
      /Pacific\/Wallis$/,
    );
    await page.keyboard.press("Home");
    await expect(field).toHaveAttribute("aria-activedescendant", /-UTC$/);
  });

  test("finds a zone by city, offset, abbreviation and name", async ({
    page,
  }) => {
    await page.goto("/timezone-picker.html");
    const field = await open(page, "Time zone");

    const cases: [string, string[]][] = [
      ["kolkata", ["Kolkata"]],
      ["calcutta", ["Kolkata"]],
      ["+5:30", ["Colombo", "Kolkata"]],
      ["utc+0530", ["Colombo", "Kolkata"]],
      ["pst", ["Los Angeles", "Tijuana", "Vancouver"]],
      ["pdt", ["Los Angeles", "Tijuana", "Vancouver"]],
      ["aest", ["Brisbane", "Hobart", "Lindeman", "Melbourne", "Sydney"]],
      ["india standard", ["Colombo", "Kolkata"]],
      ["sao paulo", ["Sao Paulo"]],
      ["zzzz", []],
    ];
    for (const [query, cities] of cases) {
      // biome-ignore lint/performance/noAwaitInLoops: one query at a time
      await field.fill(query);
      if (cities.length === 0) {
        await expect(page.getByText("No results")).toBeVisible();
        continue;
      }
      await expect
        .poll(() => optionTexts(page), { message: query })
        .toEqual(expect.arrayContaining(cities));
    }
  });

  test("finds every zone the browser lists by typing its city", async ({
    page,
  }) => {
    await page.goto("/timezone-picker.html");
    const field = await open(page, "Time zone");

    const zones = await page.evaluate(() => [
      "UTC",
      ...Intl.supportedValuesOf("timeZone"),
    ]);
    expect(zones.length).toBeGreaterThan(400);
    const entries = zones.map((zone) => ({
      id: zone,
      query: zone.slice(zone.lastIndexOf("/") + 1).replace(/_/g, " "),
    }));

    expect(await missing(field, entries)).toEqual([]);
  });

  test("shows daylight time in July and standard time in January", async ({
    page,
  }) => {
    await page.goto("/timezone-picker.html");
    await open(page, "Selected");
    await expect(page.getByRole("option", { name: /Kolkata/ })).toContainText(
      "UTC+05:30",
    );
    await page.keyboard.press("Escape");

    await page
      .getByRole("combobox", { name: "Time zone", exact: true })
      .fill("los angeles");
    await expect(
      page.getByRole("option", { name: /Los Angeles/ }),
    ).toContainText("UTC-08:00");
  });

  test("renames the field and the menu when the locale changes at runtime", async ({
    page,
  }) => {
    await page.goto("/timezone-picker.html");
    const secondary = () =>
      page
        .getByRole("option", { name: /Kolkata/ })
        .locator(".bx--intl-picker__secondary")
        .textContent();

    await open(page, "Selected");
    expect(await secondary()).toBe("India Standard Time");

    for (const [locale, name] of [
      ["ar", "توقيت الهند"],
      ["he", "שעון הודו"],
      ["ja", "インド標準時"],
      ["en", "India Standard Time"],
    ]) {
      // biome-ignore lint/performance/noAwaitInLoops: one locale at a time
      await page.getByTestId(`locale-${locale}`).click();
      await open(page, "Selected").catch(() => {});
      await expect(page.getByRole("option", { name: /Kolkata/ })).toBeVisible();
      expect(await secondary()).toBe(name);
    }
  });

  test("keeps the city whole in a narrow menu and trims the zone name first", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/timezone-picker.html");
    const field = await open(page, "Time zone");
    // Narrower than the row needs in any font, so the result does not
    // depend on the fonts a runner has.
    await page.addStyleTag({
      content: ".bx--list-box__menu { max-inline-size: 190px; }",
    });
    await field.fill("adak");

    const row = page.getByRole("option", { name: /Adak/ });
    const widths = await row.evaluate((el) => {
      const measure = (selector: string) => {
        const part = el.querySelector(selector);
        if (!part) throw new Error(`no ${selector}`);
        return { shown: part.clientWidth, needed: part.scrollWidth };
      };
      return {
        city: measure(".bx--intl-picker__text"),
        name: measure(".bx--intl-picker__secondary"),
      };
    });
    expect(widths.city.needed - widths.city.shown).toBeLessThanOrEqual(1);
    expect(widths.name.needed).toBeGreaterThan(widths.name.shown);
  });

  test("fills the browser's zone after mount", async ({ page }) => {
    await page.goto("/timezone-picker.html");

    const zone = await page.evaluate(
      () =>
        new Intl.DateTimeFormat("en-US", {
          timeZone: new Intl.DateTimeFormat().resolvedOptions().timeZone,
        }).resolvedOptions().timeZone,
    );
    await expect(page.getByTestId("tz-detected")).toHaveText(zone);
    await expect(
      page.getByRole("combobox", { name: "Detected", exact: true }),
    ).not.toHaveValue("");
  });

  test("keeps offsets left to right under dir=rtl with an Arabic locale", async ({
    page,
  }) => {
    await page.goto("/timezone-picker.html?dir=rtl&locale=ar");
    await open(page, "Selected");

    const row = page.getByRole("option", { name: /Kolkata/ });
    const rowBox = await row.boundingBox();
    const text = await row.locator(".bx--intl-picker__text").boundingBox();
    const offset = await row
      .locator(".bx--intl-picker__trailing")
      .boundingBox();
    // The name starts at the right edge and the offset ends at the left.
    expect(rowBox && text && offset).toBeTruthy();
    expect(
      text && rowBox && text.x + text.width > rowBox.x + rowBox.width - 48,
    ).toBe(true);
    expect(offset && rowBox && offset.x < rowBox.x + 64).toBe(true);
    const style = await row
      .locator(".bx--intl-picker__trailing bdi")
      .evaluate((el) => {
        const s = getComputedStyle(el);
        return { direction: s.direction, bidi: s.unicodeBidi };
      });
    expect(style).toEqual({ direction: "ltr", bidi: "isolate" });
    await expect(row.locator(".bx--intl-picker__trailing")).toHaveText(
      "UTC+05:30",
    );
  });

  test("shows the highlighted row in system colors in forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/timezone-picker.html");
    const field = await open(page, "Time zone");
    await field.press("ArrowDown");
    await field.press("ArrowDown");

    await expectSingleRing(page.getByRole("listbox"));
    // The row's text color eases in, so wait for it to settle.
    await expect
      .poll(() =>
        page
          .locator(".bx--list-box__menu-item--highlighted")
          .evaluate((row) => {
            const probe = document.createElement("div");
            probe.style.color = "HighlightText";
            document.body.append(probe);
            const highlightText = getComputedStyle(probe).color;
            probe.remove();
            const pick = (selector: string) => {
              const el = row.querySelector(selector);
              return el ? getComputedStyle(el).color === highlightText : null;
            };
            return {
              text: pick(".bx--intl-picker__text"),
              secondary: pick(".bx--intl-picker__secondary"),
              trailing: pick(".bx--intl-picker__trailing"),
            };
          }),
      )
      .toEqual({ text: true, secondary: true, trailing: true });
  });

  test("opens above a Modal, closes before it on Escape, and returns focus", async ({
    page,
  }) => {
    await page.goto("/timezone-picker.html");
    await page.getByTestId("open-modal").click();
    const field = page.getByRole("combobox", {
      name: "Modal time zone",
      exact: true,
    });
    await field.click();
    const list = page.getByRole("listbox");
    await expect(list).toBeVisible();

    const covered = await page
      .getByRole("option")
      .first()
      .evaluate((el) => {
        const { x, y, width, height } = el.getBoundingClientRect();
        const top = document.elementFromPoint(x + width / 2, y + height / 2);
        return top === el || el.contains(top);
      });
    expect(covered).toBe(true);

    await field.fill("berlin");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("modal-value")).toHaveText("Europe/Berlin");
    await expect(page.getByRole("dialog")).toBeVisible();

    await field.click();
    await expect(list).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(list).toBeHidden();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(field).toBeFocused();
  });
});
