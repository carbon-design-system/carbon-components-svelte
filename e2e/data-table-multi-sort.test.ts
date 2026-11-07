import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const PRIORITY = ".bx--table-sort__priority";

const sortButton = (page: Page, name: string) =>
  page
    .getByTestId("multi-sort")
    .getByRole("button", { name: new RegExp(`^${name}`) });

const th = (page: Page, name: string) =>
  page
    .getByTestId("multi-sort")
    .getByRole("columnheader", { name: new RegExp(`^${name}`) });

const sortState = async (page: Page) =>
  JSON.parse((await page.getByTestId("sort-state").textContent()) ?? "[]");

/** A column of the first page, top to bottom. */
const column = (page: Page, index: number) =>
  page
    .getByTestId("multi-sort")
    .locator(`tbody tr td:nth-child(${index + 2})`)
    .allTextContents();

test.describe("DataTable multi-column sort", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/data-table-multi-sort.html");
    await expect(page.getByTestId("multi-sort")).toBeVisible();
  });

  test("Shift+click adds a key, a plain click resets, no text is selected", async ({
    page,
  }) => {
    await sortButton(page, "Team").click();
    await sortButton(page, "Age").click({ modifiers: ["Shift"] });

    expect(await sortState(page)).toEqual([
      { key: "team", direction: "ascending" },
      { key: "age", direction: "ascending" },
    ]);
    await expect(sortButton(page, "Team").locator(PRIORITY)).toHaveText("1");
    await expect(sortButton(page, "Age").locator(PRIORITY)).toHaveText("2");
    expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(
      "",
    );

    // Within a team the ages ascend.
    const teams = await column(page, 0);
    const ages = (await column(page, 2)).map(Number);
    for (let i = 1; i < teams.length; i++) {
      if (teams[i] === teams[i - 1]) {
        expect(ages[i]).toBeGreaterThanOrEqual(ages[i - 1]);
      }
    }

    await sortButton(page, "Name").click();
    expect(await sortState(page)).toEqual([
      { key: "name", direction: "ascending" },
    ]);
    await expect(page.locator(PRIORITY)).toHaveCount(0);
  });

  test("Shift+Enter and Shift+Space add a key from the keyboard", async ({
    page,
  }) => {
    await sortButton(page, "Team").press("Enter");
    await sortButton(page, "Age").focus();
    await page.keyboard.press("Shift+Enter");
    await sortButton(page, "City").focus();
    await page.keyboard.press("Shift+Space");

    expect(
      (await sortState(page)).map((rule: { key: string }) => rule.key),
    ).toEqual(["team", "age", "city"]);
    // The focus stays on the button that was pressed.
    await expect(sortButton(page, "City")).toBeFocused();
  });

  test("only the primary column reports aria-sort, the rest are described", async ({
    page,
  }) => {
    await sortButton(page, "Team").click();
    await sortButton(page, "Age").click({ modifiers: ["Shift"] });
    await sortButton(page, "Age").click({ modifiers: ["Shift"] });

    await expect(th(page, "Team")).toHaveAttribute("aria-sort", "ascending");
    await expect(th(page, "Age")).toHaveAttribute("aria-sort", "none");
    await expect(sortButton(page, "Age")).toHaveAccessibleDescription(
      "Sorted descending, priority 2 of 2",
    );
    await expect(page.getByRole("status")).toHaveText(
      "Sorted by Team, ascending; then Age, descending",
    );
  });

  test("Sort by dialog works from the keyboard and returns focus", async ({
    page,
  }) => {
    const trigger = page
      .getByTestId("multi-sort")
      .getByRole("button", { name: "Sort by" });
    await trigger.focus();
    await page.keyboard.press("Enter");

    const dialog = page.getByRole("dialog", { name: "Sort by" });
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Add sort rule" }).press("Enter");
    await dialog.getByRole("button", { name: "Add sort rule" }).press("Enter");
    // The new rule's column field has focus.
    await expect(dialog.getByRole("combobox").nth(2)).toBeFocused();
    await dialog.getByRole("combobox").nth(2).selectOption("age");
    await dialog.getByRole("combobox").nth(3).selectOption("descending");
    await dialog.getByRole("button", { name: "Move up" }).nth(1).press("Enter");
    // At the top the move-up button is disabled, so focus takes move-down.
    await expect(
      dialog.getByRole("button", { name: "Move down" }).nth(0),
    ).toBeFocused();
    await dialog.getByRole("button", { name: "Apply" }).press("Enter");

    await expect(dialog).toBeHidden();
    expect(await sortState(page)).toEqual([
      { key: "age", direction: "descending" },
      { key: "team", direction: "ascending" },
    ]);
    await expect(trigger).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(await sortState(page)).toHaveLength(2);
  });

  test("has no axe violations with two keys and with the dialog open", async ({
    page,
  }) => {
    await sortButton(page, "Team").click();
    await sortButton(page, "Age").click({ modifiers: ["Shift"] });
    expect(
      (await new AxeBuilder({ page }).include("#app").analyze()).violations,
    ).toEqual([]);

    await page.getByRole("button", { name: "Sort by" }).click();
    await expect(page.getByRole("dialog", { name: "Sort by" })).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });

  test("selecting a row does not move the rows", async ({ page }) => {
    await sortButton(page, "Team").click();
    await sortButton(page, "Age").click({ modifiers: ["Shift"] });
    const before = await column(page, 1);

    await page
      .getByTestId("multi-sort")
      .locator("tbody tr")
      .nth(2)
      .locator("label")
      .click();

    await expect(page.getByTestId("selected")).toHaveText("1");
    expect(await column(page, 1)).toEqual(before);
  });
});

test.describe("DataTable multi-column sort, 10,000 rows by 3 keys", () => {
  test("sorts a third key within a frame budget", async ({ page }) => {
    await page.goto("/data-table-multi-sort-large.html");
    await expect(page.getByTestId("multi-sort")).toBeVisible();

    await sortButton(page, "Team").click();
    await sortButton(page, "Age").click({ modifiers: ["Shift"] });

    // Time the click through to the next painted frame.
    const elapsed = await page.evaluate(async () => {
      const button = [
        ...document.querySelectorAll<HTMLButtonElement>("th button"),
      ].find((el) => el.textContent?.trim().startsWith("City"));
      const start = performance.now();
      button?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, shiftKey: true }),
      );
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
      return performance.now() - start;
    });

    expect(
      (await sortState(page)).map((rule: { key: string }) => rule.key),
    ).toEqual(["team", "age", "city"]);
    console.log(`10000 rows x 3 keys: ${elapsed.toFixed(0)} ms to paint`);
    expect(elapsed).toBeLessThan(500);
  });
});

test.describe("DataTable multi-column sort, themes and modes", () => {
  const sortTwo = async (page: Page) => {
    await sortButton(page, "Team").click();
    await sortButton(page, "Age").click({ modifiers: ["Shift"] });
  };

  const box = async (locator: Locator) => {
    const result = await locator.boundingBox();
    if (!result) throw new Error("no box");
    return result;
  };

  test("the badge stays visible in forced colors", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/data-table-multi-sort.html");
    await sortTwo(page);

    const style = await sortButton(page, "Age")
      .locator(PRIORITY)
      .evaluate((el) => {
        const s = getComputedStyle(el);
        const canvas = document.createElement("div");
        canvas.style.color = "Canvas";
        document.body.append(canvas);
        const canvasColor = getComputedStyle(canvas).color;
        canvas.remove();
        return {
          borderWidth: s.borderTopWidth,
          borderStyle: s.borderTopStyle,
          borderColor: s.borderTopColor,
          color: s.color,
          canvasColor,
        };
      });
    expect(style.borderStyle).toBe("solid");
    expect(style.borderWidth).toBe("1px");
    // Neither the border nor the digit may vanish into the background.
    expect(style.borderColor).not.toBe(style.canvasColor);
    expect(style.color).not.toBe(style.canvasColor);
  });

  test("the badge sits between the label and the arrow in RTL", async ({
    page,
  }) => {
    await page.goto("/data-table-multi-sort.html");
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    await sortTwo(page);

    const button = sortButton(page, "Age");
    const label = await box(button.locator(".bx--table-header-label"));
    const badge = await box(button.locator(PRIORITY));
    const icon = await box(button.locator("svg.bx--table-sort__icon"));

    // Right to left: label, then badge, then arrow.
    expect(badge.x + badge.width).toBeLessThanOrEqual(label.x + 1);
    expect(icon.x + icon.width).toBeLessThanOrEqual(badge.x + 1);
  });

  test("Gray 100 keeps the badge readable", async ({ page }) => {
    await page.goto("/data-table-multi-sort.html");
    await page.evaluate(() =>
      document.documentElement.classList.add("bx--g100"),
    );
    await sortTwo(page);

    await expect(sortButton(page, "Age").locator(PRIORITY)).toBeVisible();
    expect(
      (await new AxeBuilder({ page }).include("#app").analyze()).violations,
    ).toEqual([]);
  });

  test("the dialog fits a 320px screen", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/data-table-multi-sort.html");
    await sortTwo(page);
    await page.getByRole("button", { name: "Sort by" }).click();

    const dialog = page.getByRole("dialog", { name: "Sort by" });
    await expect(dialog).toBeVisible();
    const fits = await dialog.evaluate((el) => {
      const outer = el.getBoundingClientRect();
      return [...el.querySelectorAll("[data-sort-rule] > *")].every((child) => {
        const rect = child.getBoundingClientRect();
        return rect.left >= outer.left - 1 && rect.right <= outer.right + 1;
      });
    });
    expect(fits).toBe(true);
  });
});
