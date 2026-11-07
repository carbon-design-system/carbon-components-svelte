import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// The fixture fixes the clock: Thursday, November 12, 2026, 10:30 in New York.

const due = (page: Page) => page.getByTestId("due");
const field = (page: Page) => due(page).getByRole("textbox");
const calendarButton = (page: Page) =>
  due(page).getByRole("button", { name: "Choose a date" });
// The interpretation is wrapped in isolates, which are not words.
const clean = (text: string | null) =>
  (text ?? "").replace(/[\u2068\u2069]/g, "");

test.describe("NaturalDateInput", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/natural-date-input.html");
    await expect(due(page)).toBeVisible();
  });

  test("is filled in with the keyboard alone", async ({ page }) => {
    await page.keyboard.press("Tab");
    await expect(field(page)).toBeFocused();

    await page.keyboard.type("next fri 3pm");
    await expect(due(page).locator(".bx--form__helper-text")).toHaveText(
      /Friday, Nov 20, 2026(,| at) 3:00 PM/,
    );
    await page.keyboard.press("Enter");

    await expect(page.getByTestId("due-value")).toHaveText(
      "2026-11-20T20:00:00.000Z",
    );
    await expect(field(page)).toHaveValue("Nov 20, 2026, 3:00 PM");

    // The calendar: Tab to its button, open it, move a day, pick it.
    await page.keyboard.press("Tab");
    await expect(calendarButton(page)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("gridcell", { name: /Friday, November 20, 2026/ }),
    ).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");

    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(calendarButton(page)).toBeFocused();
    // The time that was typed stays.
    await expect(field(page)).toHaveValue("Nov 21, 2026, 3:00 PM");
    await expect(page.getByTestId("due-value")).toHaveText(
      "2026-11-21T20:00:00.000Z",
    );
  });

  test("opens the calendar from the field with Alt+ArrowDown, and Escape returns", async ({
    page,
  }) => {
    await field(page).focus();
    await page.keyboard.press("Alt+ArrowDown");
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(calendarButton(page)).toBeFocused();
  });

  // `fill` sets the value in one event, and the browser may run Svelte's
  // updates between the input's two listeners for it. The text must still
  // count as typed, not as set from outside.
  test("holds a filled value until the field is left", async ({ page }) => {
    await field(page).fill("3/12/2027");

    await expect(due(page).locator(".bx--form__helper-text")).toContainText(
      "Friday, Mar 12, 2027 (or Dec 3, 2027)",
    );
    await expect(page.getByTestId("due-value")).toHaveText("none");
    await expect(field(page)).toHaveValue("3/12/2027");

    await page.keyboard.press("Tab");

    await expect(page.getByTestId("due-value")).toHaveText(
      "2027-03-12T05:00:00.000Z",
    );
    await expect(field(page)).toHaveValue("Mar 12, 2027");
  });

  test("explains text that is not a date when the field is left", async ({
    page,
  }) => {
    await field(page).fill("someday");
    await expect(field(page)).not.toHaveAttribute("aria-invalid");

    await page.keyboard.press("Tab");

    await expect(field(page)).toHaveAttribute("aria-invalid", "true");
    await expect(due(page).getByRole("alert")).toHaveText(
      "Couldn't read that as a date",
    );
    await expect(page.getByTestId("due-value")).toHaveText("none");
  });

  test("announces the interpretation once typing settles", async ({ page }) => {
    const status = due(page).locator("div[role=status]");

    await field(page).pressSequentially("tomorrow", { delay: 40 });
    expect(clean(await status.textContent())).toBe("");

    await expect(status).toHaveText(/Friday, Nov 13, 2026/, { timeout: 3000 });
  });

  test("shows the same date in the order of its locale", async ({ page }) => {
    const german = page.getByTestId("gb").getByRole("textbox");
    await expect(german).toHaveValue("3. Dez. 2026, 15:30");

    await german.fill("1.2.2027");
    await expect(
      page.getByTestId("gb").locator(".bx--form__helper-text"),
    ).toHaveText(/Montag, 1\. Feb\.? 2027 \(or 2\. Jan\.? 2027\)/);
  });

  test("submits the date, not the text, with a form", async ({ page }) => {
    await field(page).fill("dec 3 3pm");
    const submitted = await page.evaluate(() => {
      const input = document.querySelector<HTMLInputElement>(
        "input[type='hidden'][name='due']",
      );
      return input?.value;
    });
    expect(submitted).toBe("2026-12-03T20:00:00.000Z");
  });
});

for (const mode of ["white", "g100", "rtl", "forced-colors"] as const) {
  test.describe(`NaturalDateInput in ${mode}`, () => {
    for (const fixture of ["natural-date-input", "natural-date-input-open"]) {
      test(`${fixture} has no accessibility violations`, async ({ page }) => {
        if (mode === "forced-colors") {
          await page.emulateMedia({ forcedColors: "active" });
        }
        if (fixture.endsWith("open")) {
          await page.goto("/natural-date-input-open.html");
        } else {
          await page.goto("/natural-date-input.html");
        }
        await page.evaluate((mode) => {
          if (mode === "g100")
            document.documentElement.classList.add("bx--g100");
          if (mode === "rtl")
            document.documentElement.setAttribute("dir", "rtl");
        }, mode);
        await expect(page.getByRole("textbox").first()).toBeVisible();
        // Carbon fades colors when the theme changes. Axe reads the middle.
        await page.addStyleTag({
          content: "*, *::before, *::after { transition: none !important; }",
        });
        if (fixture.endsWith("open")) {
          await expect(page.getByRole("dialog")).toBeVisible();
        }

        const results = await new AxeBuilder({ page })
          .include("#app")
          .analyze();

        expect(results.violations).toEqual([]);
      });
    }
  });
}

test.describe("NaturalDateInput direction", () => {
  test("puts the calendar button after the field, in either direction", async ({
    page,
  }) => {
    await page.goto("/natural-date-input.html");
    const box = async () => ({
      field: await field(page).boundingBox(),
      button: await calendarButton(page).boundingBox(),
    });

    const ltr = await box();
    expect(ltr.button?.x).toBeGreaterThan(
      (ltr.field?.x ?? 0) + (ltr.field?.width ?? 0) - 1,
    );

    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const rtl = await box();
    expect((rtl.button?.x ?? 0) + (rtl.button?.width ?? 0)).toBeLessThan(
      (rtl.field?.x ?? 0) + 1,
    );
  });

  test("keeps a Latin date in order inside a right-to-left page", async ({
    page,
  }) => {
    await page.goto("/natural-date-input.html");
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    await field(page).fill("tomorrow 3pm");

    const helper = due(page).locator(".bx--form__helper-text");
    await expect(helper).toHaveText(/Friday, Nov 13, 2026/);
    // The line is isolated (first-strong isolate), so its commas and digits
    // do not reorder.
    const line = await helper.textContent();
    expect(line?.codePointAt(0)).toBe(0x2068);
    expect(line?.at(-1)?.codePointAt(0)).toBe(0x2069);
    expect(clean(line)).toMatch(/^Friday, Nov 13, 2026(,| at) 3:00 PM$/);
    // The typed text follows its own first letter, not the page.
    await expect(field(page)).toHaveAttribute("dir", "auto");
  });

  test("draws an outline around the open calendar in forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/natural-date-input-open.html");
    await expect(page.getByRole("dialog")).toBeVisible();

    const outline = await page
      .locator(".bx--popover-contents")
      .evaluate((el) => getComputedStyle(el).outlineStyle);

    expect(outline).not.toBe("none");
  });
});
