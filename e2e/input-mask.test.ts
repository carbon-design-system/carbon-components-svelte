import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const phone = (page: Page) => page.getByLabel("Phone");
const card = (page: Page) => page.getByLabel("Card number");
const iban = (page: Page) => page.getByLabel("IBAN");
const date = (page: Page) => page.getByLabel("Date");
const direct = (page: Page) => page.getByLabel("Direct input");

const selection = (field: Locator) =>
  field.evaluate((el: HTMLInputElement) => [
    el.selectionStart,
    el.selectionEnd,
  ]);

/** Put the caret at `index` without moving it by keys. */
const caretAt = (field: Locator, index: number, end = index) =>
  field.evaluate(
    (el: HTMLInputElement, [a, b]) => el.setSelectionRange(a, b),
    [index, end],
  );

/** The field's text with `|` where the caret is. */
function shown(field: Locator) {
  return field.evaluate((el: HTMLInputElement) => {
    const [start = 0, end = 0] = [el.selectionStart, el.selectionEnd];
    return start === end
      ? `${el.value.slice(0, start)}|${el.value.slice(start)}`
      : `${el.value.slice(0, start)}[${el.value.slice(start, end)}]${el.value.slice(end)}`;
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/input-mask.html");
  await expect(phone(page)).toBeVisible();
});

test.describe("typing", () => {
  test("formats each key and reports the value, raw value and completeness", async ({
    page,
  }) => {
    await phone(page).click();
    await page.keyboard.type("415555012");
    await expect(phone(page)).toHaveValue("(415) 555-012");
    await expect(page.getByTestId("phone-complete")).toHaveText("false");

    await page.keyboard.type("3");
    await expect(phone(page)).toHaveValue("(415) 555-0123");
    await expect(page.getByTestId("phone-bound")).toHaveText("(415) 555-0123");
    await expect(page.getByTestId("phone-raw")).toHaveText("4155550123");
    await expect(page.getByTestId("phone-complete")).toHaveText("true");
  });

  test("fires one input event per key", async ({ page }) => {
    await phone(page).click();
    await page.keyboard.type("4155");
    await expect(page.getByTestId("phone-events")).toHaveText("4");
  });

  test("ignores characters the slot refuses and a full field", async ({
    page,
  }) => {
    await phone(page).click();
    await page.keyboard.type("4a1-5 5x5 0123 99");
    await expect(phone(page)).toHaveValue("(415) 550-1239");
    await page.keyboard.type("9999");
    await expect(phone(page)).toHaveValue("(415) 550-1239");
  });

  test("keeps the caret among the digits when typing in the middle", async ({
    page,
  }) => {
    await phone(page).click();
    await page.keyboard.type("415555");
    await caretAt(phone(page), 2);
    await page.keyboard.type("9");
    await expect(phone(page)).toHaveValue("(491) 555-5");
    expect(await shown(phone(page))).toBe("(49|1) 555-5");
    await page.keyboard.type("8");
    expect(await shown(phone(page))).toBe("(498|) 155-55");
  });

  test("applies letter slots and the dynamic pattern", async ({ page }) => {
    await iban(page).click();
    await page.keyboard.type("de89 3704 0044 0532 0130 00");
    await expect(iban(page)).toHaveValue("DE89 3704 0044 0532 01");

    await card(page).click();
    await page.keyboard.type("378282246310005");
    await expect(card(page)).toHaveValue("3782 822463 10005");
    await card(page).fill("");
    await page.keyboard.type("4111111111111111");
    await expect(card(page)).toHaveValue("4111 1111 1111 1111");
  });

  test("an eager mask writes the literal and leaves the caret after it", async ({
    page,
  }) => {
    await date(page).click();
    await page.keyboard.type("12");
    expect(await shown(date(page))).toBe("12/|");
    await page.keyboard.type("312026");
    await expect(date(page)).toHaveValue("12/31/2026");
  });

  test("works on an input with no component around it", async ({ page }) => {
    await direct(page).click();
    await page.keyboard.type("123456");
    await expect(direct(page)).toHaveValue("123-456");
    await expect(page.getByTestId("direct-bound")).toHaveText("123-456");
  });

  test("a field with an unformatted value is formatted when focused", async ({
    page,
  }) => {
    await direct(page).evaluate((el: HTMLInputElement) => {
      el.value = "123456";
    });
    await direct(page).focus();
    await expect(direct(page)).toHaveValue("123-456");
    await expect(page.getByTestId("direct-bound")).toHaveText("123-456");
  });
});

test.describe("Backspace and Delete over literals", () => {
  test("Backspace removes the digit before a literal and never stops on it", async ({
    page,
  }) => {
    await phone(page).click();
    await page.keyboard.type("4155550123");
    for (const expected of [
      "(415) 555-012",
      "(415) 555-01",
      "(415) 555-0",
      "(415) 555",
      "(415) 55",
      "(415) 5",
      "(415",
      "(41",
      "(4",
      "",
    ]) {
      // biome-ignore lint/performance/noAwaitInLoops: one key at a time
      await page.keyboard.press("Backspace");
      await expect(phone(page)).toHaveValue(expected);
    }
    await expect(page.getByTestId("phone-bound")).toHaveText("");
  });

  test("Backspace in the middle skips a literal and lands before the next group", async ({
    page,
  }) => {
    await phone(page).click();
    await page.keyboard.type("4155550123");
    await caretAt(phone(page), 7);
    expect(await shown(phone(page))).toBe("(415) 5|55-0123");
    await page.keyboard.press("Backspace");
    expect(await shown(phone(page))).toBe("(415) |550-123");
    await page.keyboard.press("Backspace");
    expect(await shown(phone(page))).toBe("(41|5) 501-23");
    await page.keyboard.press("Backspace");
    expect(await shown(phone(page))).toBe("(4|55) 012-3");
  });

  test("Delete reaches over a literal", async ({ page }) => {
    await phone(page).click();
    await page.keyboard.type("4155550123");
    await caretAt(phone(page), 4);
    expect(await shown(phone(page))).toBe("(415|) 555-0123");
    await page.keyboard.press("Delete");
    expect(await shown(phone(page))).toBe("(415|) 550-123");
  });

  test("a word delete removes a group", async ({ page, browserName }) => {
    test.skip(
      browserName === "webkit",
      "WebKit on Linux has no word-delete shortcut matching this key",
    );
    await phone(page).click();
    await page.keyboard.type("4155550123");
    await page.keyboard.press(
      process.platform === "darwin" ? "Alt+Backspace" : "Control+Backspace",
    );
    await expect(phone(page)).toHaveValue("(415) 555");
  });
});

test.describe("selection and paste", () => {
  test("typing over a selection replaces it", async ({ page }) => {
    await phone(page).click();
    await page.keyboard.type("4155550123");
    await caretAt(phone(page), 0, 14);
    await page.keyboard.type("2");
    await expect(phone(page)).toHaveValue("(2");

    await page.keyboard.type("125550100");
    await caretAt(phone(page), 2, 9);
    await page.keyboard.type("9");
    await expect(phone(page)).toHaveValue("(290) 100");
  });

  test("inserted text (a paste, an autofill) is stripped and re-masked", async ({
    page,
  }) => {
    await phone(page).click();
    await page.keyboard.insertText("+1 (212) 555-0100");
    await expect(phone(page)).toHaveValue("(121) 255-5010");
  });

  test("an insert replaces a selection and strips the formatting", async ({
    page,
  }) => {
    await phone(page).click();
    await page.keyboard.type("4155550123");
    await caretAt(phone(page), 0, 14);
    await page.keyboard.insertText("212.555.0100");
    await expect(phone(page)).toHaveValue("(212) 555-0100");
    await expect(page.getByTestId("phone-bound")).toHaveText("(212) 555-0100");
  });

  test("a real clipboard paste", async ({ page, context, browserName }) => {
    test.skip(
      browserName !== "chromium",
      "grants clipboard access in Chromium",
    );
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.evaluate(() => navigator.clipboard.writeText("212 555 0100"));
    await phone(page).click();
    await page.keyboard.press("ControlOrMeta+v");
    await expect(phone(page)).toHaveValue("(212) 555-0100");
    expect(await shown(phone(page))).toBe("(212) 555-0100|");
  });

  test("a cut removes the selection and keeps the mask", async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "grants clipboard access in Chromium",
    );
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await phone(page).click();
    await page.keyboard.type("4155550123");
    await caretAt(phone(page), 1, 4);
    await page.keyboard.press("ControlOrMeta+x");
    await expect(phone(page)).toHaveValue("(555) 012-3");
  });
});

test.describe("undo and redo", () => {
  test("undo steps back through formatted values and redo returns", async ({
    page,
  }) => {
    await phone(page).click();
    await page.keyboard.type("4155550123");
    await page.keyboard.press("ControlOrMeta+z");
    const afterUndo = await phone(page).inputValue();
    // The browser decides how much one undo step covers, but every value on
    // its stack was written by the mask.
    expect(afterUndo).not.toBe("(415) 555-0123");
    expect(afterUndo).toMatch(/^(\(\d{0,3}\)? ?\d{0,3}-?\d{0,4})?$/);
    await expect(page.getByTestId("phone-bound")).toHaveText(afterUndo);

    await page.keyboard.press("ControlOrMeta+Shift+z");
    await expect(phone(page)).toHaveValue("(415) 555-0123");
    await expect(page.getByTestId("phone-bound")).toHaveText("(415) 555-0123");
  });
});

test.describe("IME", () => {
  test("nothing changes during a composition, and the mask applies at its end", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "drives Chromium's IME through CDP");
    await phone(page).click();
    await page.keyboard.type("41");
    const client = await page.context().newCDPSession(page);
    await client.send("Input.imeSetComposition", {
      text: "ｋ５",
      selectionStart: 2,
      selectionEnd: 2,
    });
    // The composed text is the IME's until it commits.
    await expect(phone(page)).toHaveValue("(41ｋ５");
    await client.send("Input.insertText", { text: "５５" });
    await expect(phone(page)).toHaveValue("(415) 5");
    await expect(page.getByTestId("phone-bound")).toHaveText("(415) 5");
    await expect(page.getByTestId("phone-raw")).toHaveText("4155");
  });

  test("a composition committed as fullwidth digits becomes digits", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "drives Chromium's IME through CDP");
    await direct(page).click();
    const client = await page.context().newCDPSession(page);
    await client.send("Input.imeSetComposition", {
      text: "１２３",
      selectionStart: 3,
      selectionEnd: 3,
    });
    await client.send("Input.insertText", { text: "１２３４" });
    await expect(direct(page)).toHaveValue("123-4");
    expect(await shown(direct(page))).toBe("123-4|");
  });
});

test.describe("layout and attributes", () => {
  test("sets inputmode and the mask marker, and leaves the placeholder and autocomplete alone", async ({
    page,
  }) => {
    await expect(phone(page)).toHaveAttribute("inputmode", "numeric");
    await expect(phone(page)).toHaveAttribute("data-ccs-mask");
    await expect(phone(page)).toHaveAttribute("autocomplete", "tel-national");
    await expect(phone(page)).toHaveAttribute("placeholder", "(___) ___-____");
    await expect(iban(page)).not.toHaveAttribute("inputmode");
  });

  test("describes the format by helper text, not by the placeholder", async ({
    page,
  }) => {
    const id = await phone(page).getAttribute("aria-describedby");
    expect(id).toBeTruthy();
    await expect(page.locator(`#${id}`)).toHaveText("Format: (555) 555-5555");
  });

  test("right-to-left: the digits and literals keep their order", async ({
    page,
  }) => {
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    await phone(page).click();
    await page.keyboard.type("4155550123");
    await expect(phone(page)).toHaveValue("(415) 555-0123");
    const style = await phone(page).evaluate((el) => {
      const { direction, textAlign } = getComputedStyle(el);
      return { direction, textAlign };
    });
    // Left to right, so the literals sit where they are written, and at
    // the page's inline end, beside the label.
    expect(style).toEqual({ direction: "ltr", textAlign: "right" });
    await caretAt(phone(page), 7);
    await page.keyboard.press("Backspace");
    expect(await shown(phone(page))).toBe("(415) |550-123");
  });

  test("moves the caret in the keyboard order (ArrowLeft) after an edit", async ({
    page,
  }) => {
    await phone(page).click();
    await page.keyboard.type("4155550123");
    await caretAt(phone(page), 7);
    await page.keyboard.press("ArrowLeft");
    expect((await selection(phone(page)))[0]).toBe(6);
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
      await phone(page).click();
      await page.keyboard.type("415");
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

  test("forced colors keep the field and helper text visible", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await phone(page).click();
    await page.keyboard.type("415");
    await expect(phone(page)).toHaveValue("(415");
    const outline = await phone(page).evaluate(
      (el) => getComputedStyle(el).outlineStyle,
    );
    expect(outline).not.toBe("none");
  });
});
