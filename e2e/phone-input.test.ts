import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const group = (page: Page, name: string) =>
  page.getByRole("group", { name, exact: true });
const number = (page: Page, name = "Phone") =>
  group(page, name).getByRole("textbox");
const country = (page: Page, name = "Phone") =>
  group(page, name).getByRole("combobox");

/** Put the caret at `index` without moving it by keys. */
const caretAt = (field: Locator, index: number, end = index) =>
  field.evaluate(
    (el: HTMLInputElement, [a, b]) => el.setSelectionRange(a, b),
    [index, end],
  );

const shown = (field: Locator) =>
  field.evaluate((el: HTMLInputElement) => {
    const [start = 0] = [el.selectionStart];
    return `${el.value.slice(0, start)}|${el.value.slice(start)}`;
  });

test.beforeEach(async ({ page }) => {
  await page.goto("/phone-input.html");
  await expect(number(page)).toBeVisible();
});

test.describe("the number", () => {
  test("is masked for the country and bound as E.164", async ({ page }) => {
    await number(page).click();
    await page.keyboard.type("4155550123");

    await expect(number(page)).toHaveValue("(415) 555-0123");
    await expect(page.getByTestId("value")).toHaveText("+14155550123");
    await expect(page.getByTestId("complete")).toHaveText("true");
    await expect(page.getByTestId("changes")).toHaveText("10");
  });

  test("starts from an E.164 value", async ({ page }) => {
    await expect(country(page, "Work phone")).toHaveValue("+44");
    await expect(number(page, "Work phone")).toHaveValue("020 7946 0958");
  });

  test("takes a typed trunk prefix without keeping it", async ({ page }) => {
    await number(page, "Work phone").fill("");
    await number(page, "Work phone").click();
    await page.keyboard.type("07911123456");

    await expect(number(page, "Work phone")).toHaveValue("079 1112 3456");
    await expect(page.getByTestId("uk")).toHaveText("+447911123456");
  });

  test("Backspace over literals deletes digits and keeps the E.164 value in step", async ({
    page,
  }) => {
    await number(page).click();
    await page.keyboard.type("4155550123");
    await caretAt(number(page), 6);
    await page.keyboard.press("Backspace");

    expect(await shown(number(page))).toBe(
      "(41|5) 555-0123".replace("5) 555-0123", "5) 550-123"),
    );
    await expect(page.getByTestId("value")).toHaveText("+1415550123");
  });

  test("a selection is replaced by what is typed", async ({ page }) => {
    await number(page).click();
    await page.keyboard.type("4155550123");
    await caretAt(number(page), 0, 14);
    await page.keyboard.type("2");

    await expect(number(page)).toHaveValue("(2");
    await expect(page.getByTestId("value")).toHaveText("+12");
  });
});

test.describe("pasting an international number", () => {
  test("switches the country and fills the number", async ({ page }) => {
    await number(page).click();
    await page.keyboard.insertText("+44 20 7946 0958");

    await expect(country(page)).toHaveValue("+44");
    await expect(number(page)).toHaveValue("020 7946 0958");
    await expect(page.getByTestId("value")).toHaveText("+442079460958");
    await expect(page.getByTestId("country")).toHaveText("GB");
  });

  test("a real clipboard paste does the same", async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "grants clipboard access in Chromium",
    );
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.evaluate(() =>
      navigator.clipboard.writeText("+41 79 123 45 67"),
    );
    await number(page).click();
    await page.keyboard.press("ControlOrMeta+v");

    await expect(country(page)).toHaveValue("+41");
    await expect(number(page)).toHaveValue("079 123 45 67");
    await expect(page.getByTestId("country")).toHaveText("CH");
  });

  test("a national number pasted with its formatting fills the same digits", async ({
    page,
  }) => {
    await number(page).click();
    await page.keyboard.insertText("415.555.0123");

    await expect(number(page)).toHaveValue("(415) 555-0123");
    await expect(page.getByTestId("country")).toHaveText("US");
  });

  test("a code the list leaves out changes nothing", async ({ page }) => {
    const small = number(page, "Small phone");
    await small.click();
    await page.keyboard.insertText("+1 415 555 0123");

    await expect(country(page, "Small phone")).toHaveValue("+41");
  });
});

test.describe("the country selector", () => {
  test("shows the flag and the calling code, and filters by name or code", async ({
    page,
  }) => {
    await expect(country(page)).toHaveValue("+1");
    await country(page).click();
    await page.keyboard.type("swit");
    await expect(
      page.getByRole("option", { name: /Switzerland/ }),
    ).toBeVisible();
    await expect(page.getByRole("option")).toHaveCount(1);

    await country(page).fill("+49");
    await expect(page.getByRole("option", { name: /Germany/ })).toBeVisible();
  });

  test("choosing a country with the keyboard re-masks the number", async ({
    page,
  }) => {
    await number(page).click();
    await page.keyboard.type("4155550123");
    await country(page).click();
    await page.keyboard.type("switz");
    await page.keyboard.press("Enter");

    await expect(country(page)).toHaveValue("+41");
    await expect(number(page)).toHaveValue("041 555 50 12");
    await expect(page.getByTestId("value")).toHaveText("+41415555012");
    await expect(page.getByTestId("country")).toHaveText("CH");
  });

  test("the menu is wider than the field and stays on screen", async ({
    page,
  }) => {
    await country(page).click();
    const box = await page.getByRole("listbox").boundingBox();
    const field = await country(page).boundingBox();
    expect(box?.width).toBeGreaterThan((field?.width ?? 0) + 40);
    const viewport = page.viewportSize();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
      viewport?.width ?? 0,
    );
  });
});

test.describe("forms", () => {
  test("submits the E.164 value under name, not the text that is shown", async ({
    page,
  }) => {
    await number(page).click();
    await page.keyboard.type("4155550123");

    const submitted = await page.evaluate(() => {
      const form = document.querySelector("form");
      return form ? new FormData(form).get("phone") : null;
    });
    expect(submitted).toBe("+14155550123");
  });
});

test.describe("IME", () => {
  test("fullwidth digits from a composition become digits in the mask", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "drives Chromium's IME through CDP");
    await number(page).click();
    const client = await page.context().newCDPSession(page);
    await client.send("Input.imeSetComposition", {
      text: "４１５",
      selectionStart: 3,
      selectionEnd: 3,
    });
    await client.send("Input.insertText", { text: "４１５５" });

    await expect(number(page)).toHaveValue("(415) 5");
    await expect(page.getByTestId("value")).toHaveText("+14155");
  });
});

test.describe("right to left", () => {
  test("the code and the number stay left to right, at the end edge", async ({
    page,
  }) => {
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    await number(page).click();
    await page.keyboard.type("4155550123");
    await expect(number(page)).toHaveValue("(415) 555-0123");

    const style = await number(page).evaluate((el) => {
      const { direction, textAlign } = getComputedStyle(el);
      return { direction, textAlign };
    });
    expect(style).toEqual({ direction: "ltr", textAlign: "right" });

    // The selector sits at the start edge (the right), the number after it.
    const selector = await country(page).boundingBox();
    const field = await number(page).boundingBox();
    expect(selector?.x).toBeGreaterThan(field?.x ?? 0);
  });
});

test.describe("a11y", () => {
  test("names the group, the selector and the number, and describes the number", async ({
    page,
  }) => {
    await expect(group(page, "Phone")).toBeVisible();
    await expect(country(page)).toHaveAccessibleName("Country calling code");
    await expect(number(page)).toHaveAccessibleName("Phone number");
    await expect(number(page)).toHaveAccessibleDescription(
      "Choose a country, then enter the number",
    );
    await expect(number(page)).toHaveAttribute("type", "tel");
  });

  test("marks the number invalid and points at the message", async ({
    page,
  }) => {
    const field = number(page, "Invalid phone");
    await expect(field).toHaveAttribute("aria-invalid", "true");
    await expect(field).toHaveAccessibleDescription("Enter a complete number");
  });

  for (const theme of ["white", "g100"] as const) {
    test(`has no axe violations on ${theme}`, async ({ page }) => {
      if (theme === "g100") {
        await page.evaluate(() => {
          document.documentElement.className = "bx--g100";
        });
      }
      await number(page).click();
      await page.keyboard.type("415");
      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test("has no axe violations with the menu open", async ({ page }) => {
    await country(page).click();
    await expect(page.getByRole("listbox")).toBeVisible();
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });

  test("has no axe violations right to left", async ({ page }) => {
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });

  test("forced colors keep both fields outlined", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    const styles = await page
      .locator("input[type=text], input[type=tel]")
      .evaluateAll((els) =>
        els.slice(0, 2).map((el) => getComputedStyle(el).outlineStyle),
      );
    expect(styles).toHaveLength(2);
    for (const style of styles) expect(style).not.toBe("none");
  });
});
