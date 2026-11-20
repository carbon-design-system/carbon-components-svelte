import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const label = (page: Page, text: string) =>
  page.getByLabel(text, { exact: true });
const usd = (page: Page) => label(page, "Price (USD)");
const eur = (page: Page) => label(page, "Preis (EUR)");
const jpy = (page: Page) => label(page, "Price (JPY)");
const inr = (page: Page) => label(page, "Price (INR)");
const chf = (page: Page) => label(page, "Preis (CHF)");
const egp = (page: Page) => page.getByLabel("السعر (EGP)");
const accounting = (page: Page) => label(page, "Balance");
const weight = (page: Page) => label(page, "Weight");
const percent = (page: Page) => label(page, "Discount");
const timeout = (page: Page) => label(page, "Timeout");
const direct = (page: Page) => label(page, "Direct (action)");

const NBSP = String.fromCodePoint(0xa0);
const arabic = (s: string) =>
  s.replace(/\d/g, (d) => String.fromCodePoint(0x660 + Number(d)));

/** Put the caret at `index` without moving it by keys. */
const caretAt = (field: Locator, index: number, end = index) =>
  field.evaluate(
    (el: HTMLInputElement, [a, b]) => el.setSelectionRange(a, b),
    [index, end],
  );

/** The field's text with `|` where the caret is. */
const shown = (field: Locator) =>
  field.evaluate((el: HTMLInputElement) => {
    const [start = 0, end = 0] = [el.selectionStart, el.selectionEnd];
    return start === end
      ? `${el.value.slice(0, start)}|${el.value.slice(start)}`
      : `${el.value.slice(0, start)}[${el.value.slice(start, end)}]${el.value.slice(end)}`;
  });

test.beforeEach(async ({ page }) => {
  await page.goto("/number-entry.html");
  await expect(usd(page)).toBeVisible();
});

test.describe("typing", () => {
  test("groups as each digit is typed and binds the decimal string", async ({
    page,
  }) => {
    await usd(page).click();
    await page.keyboard.type("1234567.8");
    await expect(usd(page)).toHaveValue("$1,234,567.8");
    expect(await shown(usd(page))).toBe("$1,234,567.8|");
    await expect(page.getByTestId("usd")).toHaveText("1234567.8");
    // One input event per key.
    await expect(page.getByTestId("usd-events")).toHaveText("9");
  });

  test("refuses letters, an exponent, a minus and a third fraction digit", async ({
    page,
  }) => {
    await usd(page).click();
    await page.keyboard.type("-1a2e3 4.567");
    await expect(usd(page)).toHaveValue("$1,234.56");
  });

  test("pads the fraction when the field is left, and fires change once", async ({
    page,
  }) => {
    await usd(page).click();
    await page.keyboard.type("12.5");
    await expect(page.getByTestId("usd-changes")).toHaveText("0");
    await page.keyboard.press("Tab");
    await expect(usd(page)).toHaveValue("$12.50");
    await expect(page.getByTestId("usd")).toHaveText("12.50");
    await expect(page.getByTestId("usd-changes")).toHaveText("1");
  });

  test("keeps the caret among the digits when typing in the middle", async ({
    page,
  }) => {
    await usd(page).click();
    await page.keyboard.type("123456");
    await caretAt(usd(page), 3);
    expect(await shown(usd(page))).toBe("$12|3,456");
    await page.keyboard.type("9");
    expect(await shown(usd(page))).toBe("$1,29|3,456");
  });

  test("de-DE: a comma is the decimal mark, a period is a numpad decimal, the symbol follows", async ({
    page,
  }) => {
    await eur(page).click();
    await page.keyboard.type("1234567,89");
    await expect(eur(page)).toHaveValue(`1.234.567,89${NBSP}€`);
    expect(await shown(eur(page))).toBe(`1.234.567,89|${NBSP}€`);
    await expect(page.getByTestId("eur")).toHaveText("1234567.89");

    await eur(page).fill("");
    await eur(page).click();
    await page.keyboard.type("1234.5");
    await expect(eur(page)).toHaveValue(`1.234,5${NBSP}€`);
  });

  test("ja-JP: no fraction for yen", async ({ page }) => {
    await jpy(page).click();
    await page.keyboard.type("1234.56");
    await expect(jpy(page)).toHaveValue(/^[¥￥]123,456$/);
    await expect(page.getByTestId("jpy")).toHaveText("123456");
  });

  test("en-IN: groups by lakh and crore", async ({ page }) => {
    await inr(page).click();
    await page.keyboard.type("12345678.9");
    await expect(inr(page)).toHaveValue("₹1,23,45,678.9");
  });

  test("fr-CH: the apostrophe group, a period decimal and the code after", async ({
    page,
  }) => {
    await chf(page).click();
    await page.keyboard.type("1234567.5");
    const value = await chf(page).inputValue();
    expect(value).toMatch(/^(CHF.)?1.234.567\.5(.CHF)?$/);
  });

  test("ar-EG: Arabic-Indic digits from ASCII keys, and from Arabic keys", async ({
    page,
  }) => {
    await egp(page).click();
    await page.keyboard.type("1234.5");
    const text = await egp(page).inputValue();
    expect(text).toContain(arabic("1"));
    expect(text).toContain(arabic("234"));
    expect(text).toContain(arabic("5"));
    await expect(page.getByTestId("egp")).toHaveText("1234.5");

    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type(arabic("987"));
    await expect(page.getByTestId("egp")).toHaveText("987");
  });

  test("an accounting field writes a negative amount in brackets", async ({
    page,
  }) => {
    await accounting(page).click();
    await page.keyboard.type("-12.5");
    await expect(accounting(page)).toHaveValue("($12.5)");
    expect(await shown(accounting(page))).toBe("($12.5|)");
    await expect(page.getByTestId("accounting")).toHaveText("-12.5");
  });
});

test.describe("units", () => {
  test("writes the unit after the number and keeps the caret before it", async ({
    page,
  }) => {
    await weight(page).click();
    await page.keyboard.type("1234.5");
    await expect(weight(page)).toHaveValue("1,234.5 kg");
    expect(await shown(weight(page))).toBe("1,234.5| kg");
    await expect(page.getByTestId("weight")).toHaveText("1234.5");
  });

  test("writes the percent sign the way the locale does", async ({ page }) => {
    await percent(page).click();
    await page.keyboard.type("12,5");
    await expect(percent(page)).toHaveValue(`12,5${NBSP}%`);
    await expect(page.getByTestId("percent")).toHaveText("12.5");
    await expect(percent(page)).not.toHaveAttribute("aria-invalid");
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("1001");
    await expect(percent(page)).toHaveAttribute("aria-invalid", "true");
  });

  test("takes ms and groups it", async ({ page }) => {
    await timeout(page).click();
    await page.keyboard.type("1500");
    await expect(timeout(page)).toHaveValue("1,500 ms");
  });
});

test.describe("Backspace, Delete, selection and paste", () => {
  test("Backspace removes the digit before a group mark and never stops on it", async ({
    page,
  }) => {
    await usd(page).click();
    await page.keyboard.type("1234.56");
    for (const expected of [
      "$1,234.5|",
      "$1,234.|",
      "$1,234|",
      "$123|",
      "$12|",
      "$1|",
    ]) {
      // biome-ignore lint/performance/noAwaitInLoops: one key at a time
      await page.keyboard.press("Backspace");
      expect(await shown(usd(page))).toBe(expected);
    }
    await caretAt(usd(page), 2);
    await page.keyboard.type("34567");
    await expect(usd(page)).toHaveValue("$134,567");
    await caretAt(usd(page), 4);
    expect(await shown(usd(page))).toBe("$134|,567");
    await page.keyboard.press("Backspace");
    expect(await shown(usd(page))).toBe("$13|,567");
  });

  test("Backspace after the decimal mark steps over it and keeps the fraction", async ({
    page,
  }) => {
    await usd(page).click();
    await page.keyboard.type("1234.56");
    await caretAt(usd(page), 7);
    expect(await shown(usd(page))).toBe("$1,234.|56");
    await page.keyboard.press("Backspace");
    await expect(usd(page)).toHaveValue("$1,234.56");
    expect(await shown(usd(page))).toBe("$1,234|.56");
  });

  test("Delete reaches over a group mark", async ({ page }) => {
    await usd(page).click();
    await page.keyboard.type("1234567");
    await caretAt(usd(page), 2);
    expect(await shown(usd(page))).toBe("$1|,234,567");
    await page.keyboard.press("Delete");
    expect(await shown(usd(page))).toBe("$1|34,567");
  });

  test("typing over a selection replaces it", async ({ page }) => {
    await usd(page).click();
    await page.keyboard.type("1234567.89");
    await caretAt(usd(page), 0, 20);
    await page.keyboard.type("5");
    await expect(usd(page)).toHaveValue("$5");

    await page.keyboard.type("00000");
    await caretAt(usd(page), 2, 5);
    await page.keyboard.type("7");
    await expect(usd(page)).toHaveValue("$57,000");
  });

  test("a paste from another locale reads the last mark as the decimal", async ({
    page,
  }) => {
    await usd(page).click();
    await page.keyboard.insertText("1.234,56");
    await expect(usd(page)).toHaveValue("$1,234.56");

    await eur(page).click();
    await page.keyboard.insertText("€ 1,234.56");
    await expect(eur(page)).toHaveValue(`1.234,56${NBSP}€`);
    await expect(page.getByTestId("eur")).toHaveText("1234.56");
  });

  test("a paste that is not a number changes nothing", async ({ page }) => {
    await usd(page).click();
    await page.keyboard.type("12");
    await page.keyboard.insertText("1e5");
    await page.keyboard.insertText("abc");
    await expect(usd(page)).toHaveValue("$12");
  });

  test("a real clipboard paste and a cut", async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "grants clipboard access in Chromium",
    );
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.evaluate(() => navigator.clipboard.writeText("(1,234.50)"));
    await accounting(page).click();
    await page.keyboard.press("ControlOrMeta+v");
    await expect(accounting(page)).toHaveValue("($1,234.50)");
    expect(await shown(accounting(page))).toBe("($1,234.50|)");

    await usd(page).click();
    await page.keyboard.type("123456");
    await caretAt(usd(page), 1, 5);
    await page.keyboard.press("ControlOrMeta+x");
    await expect(usd(page)).toHaveValue("$456");
  });

  test("a word delete removes the integer part before the caret", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName === "webkit",
      "WebKit on Linux has no word-delete shortcut matching this key",
    );
    await usd(page).click();
    await page.keyboard.type("1234.56");
    await caretAt(usd(page), 6);
    await page.keyboard.press(
      process.platform === "darwin" ? "Alt+Backspace" : "Control+Backspace",
    );
    expect(await shown(usd(page))).toBe("$|0.56");
  });
});

test.describe("undo and redo", () => {
  test("undo steps back through formatted values and redo returns", async ({
    page,
  }) => {
    await usd(page).click();
    await page.keyboard.type("1234567");
    await page.keyboard.press("ControlOrMeta+z");
    const afterUndo = await usd(page).inputValue();
    // The browser decides how much one undo step covers; every value on its
    // stack was written by the format.
    expect(afterUndo).not.toBe("$1,234,567");
    expect(afterUndo).toMatch(/^(\$\d{1,3}(,\d{3})*)?$/);
    await page.keyboard.press("ControlOrMeta+Shift+z");
    await expect(usd(page)).toHaveValue("$1,234,567");
    await expect(page.getByTestId("usd")).toHaveText("1234567");
  });
});

test.describe("IME", () => {
  test("nothing changes during a composition; full-width digits become digits at its end", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "drives Chromium's IME through CDP");
    await usd(page).click();
    await page.keyboard.type("12");
    const client = await page.context().newCDPSession(page);
    await client.send("Input.imeSetComposition", {
      text: "３４５",
      selectionStart: 3,
      selectionEnd: 3,
    });
    await expect(usd(page)).toHaveValue("$12３４５");
    await client.send("Input.insertText", { text: "３４５" });
    await expect(usd(page)).toHaveValue("$12,345");
    await expect(page.getByTestId("usd")).toHaveText("12345");
    expect(await shown(usd(page))).toBe("$12,345|");
  });
});

test.describe("form and validation", () => {
  test("submits the decimal string under the name, not the text", async ({
    page,
  }) => {
    await usd(page).click();
    await page.keyboard.type("1234.5");
    const submitted = await page.evaluate(() => {
      const form = document.querySelector("form") as HTMLFormElement;
      return new FormData(form).get("usd");
    });
    expect(submitted).toBe("1234.5");
    await expect(usd(page)).not.toHaveAttribute("name");
  });

  test("marks an amount above max invalid, with the message", async ({
    page,
  }) => {
    await usd(page).click();
    await page.keyboard.type("1000000");
    await expect(usd(page)).not.toHaveAttribute("aria-invalid");
    await page.keyboard.type("0");
    await expect(usd(page)).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("Between 0 and 1,000,000")).toBeVisible();
  });

  test("describes the currency and the unit by a hint, and the format by helper text", async ({
    page,
  }) => {
    const describedBy = await usd(page).getAttribute("aria-describedby");
    const ids = (describedBy ?? "").split(" ");
    const texts = await Promise.all(
      ids.map((id) => page.locator(`[id="${id}"]`).textContent()),
    );
    expect(texts).toContain("en-US");
    expect(texts).toContain("Amount in US Dollar");
    const weightIds =
      (await weight(page).getAttribute("aria-describedby")) ?? "";
    const weightTexts = await Promise.all(
      weightIds
        .split(" ")
        .map((id) => page.locator(`[id="${id}"]`).textContent()),
    );
    expect(weightTexts).toContain("Value in kilograms");
  });

  test("asks for the decimal keypad, and the full keyboard where a minus is allowed", async ({
    page,
  }) => {
    await expect(usd(page)).toHaveAttribute("inputmode", "decimal");
    await expect(usd(page)).toHaveAttribute("autocomplete", "off");
    await expect(accounting(page)).toHaveAttribute("inputmode", "text");
  });

  test("a disabled and a read-only field show their formatted value", async ({
    page,
  }) => {
    await expect(label(page, "Disk")).toHaveValue("512 GB");
    await expect(label(page, "Disk")).toBeDisabled();
    await expect(label(page, "Memory")).toHaveValue("16 GB");
    await label(page, "Memory").focus();
    await page.keyboard.type("9");
    await expect(label(page, "Memory")).toHaveValue("16 GB");
  });

  test("the action works on a plain TextInput and reports the value", async ({
    page,
  }) => {
    await direct(page).click();
    await page.keyboard.type("1234.5");
    await expect(direct(page)).toHaveValue("$1,234.5");
    await expect(page.getByTestId("direct")).toHaveText("$1,234.5");
    await expect(page.getByTestId("reported")).toHaveText("1234.5");
    await usd(page).click();
    await expect(direct(page)).toHaveValue("$1,234.50");
    await expect(page.getByTestId("reported")).toHaveText("1234.50");
  });
});

test.describe("right to left", () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
  });

  test("a left-to-right number stays in order, at the page's start edge", async ({
    page,
  }) => {
    await usd(page).click();
    await page.keyboard.type("1234.5");
    await expect(usd(page)).toHaveValue("$1,234.5");
    const style = await usd(page).evaluate((el) => {
      const { direction, textAlign } = getComputedStyle(el);
      return { direction, textAlign };
    });
    expect(style).toEqual({ direction: "ltr", textAlign: "right" });
    await caretAt(usd(page), 3);
    await page.keyboard.press("Backspace");
    expect(await shown(usd(page))).toBe("$|234.5");
  });

  test("an Arabic amount reads in the direction of its own locale", async ({
    page,
  }) => {
    await egp(page).click();
    await page.keyboard.type("1234.5");
    const style = await egp(page).evaluate((el) => {
      const { direction, textAlign } = getComputedStyle(el);
      return { direction, textAlign };
    });
    expect(style).toEqual({ direction: "rtl", textAlign: "right" });
    await expect(page.getByTestId("egp")).toHaveText("1234.5");
  });

  test("an Arabic amount in a left-to-right page is aligned with the label", async ({
    page,
  }) => {
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "ltr"),
    );
    const style = await egp(page).evaluate((el) => {
      const { direction, textAlign } = getComputedStyle(el);
      return { direction, textAlign };
    });
    expect(style).toEqual({ direction: "rtl", textAlign: "left" });
  });
});

test.describe("a11y", () => {
  for (const theme of ["white", "g100"] as const) {
    test(`has no axe violations on ${theme}`, async ({ page }) => {
      if (theme === "g100") {
        await page.evaluate(() => {
          document.documentElement.className = "bx--g100";
        });
      }
      await usd(page).click();
      await page.keyboard.type("1234.5");
      await weight(page).click();
      await page.keyboard.type("12");
      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test("has no axe violations right-to-left", async ({ page }) => {
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });

  test("forced colors keep the fields and their focus outline visible", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await usd(page).click();
    await page.keyboard.type("12.5");
    await expect(usd(page)).toHaveValue("$12.5");
    const outline = await usd(page).evaluate(
      (el) => getComputedStyle(el).outlineStyle,
    );
    expect(outline).not.toBe("none");
  });
});
