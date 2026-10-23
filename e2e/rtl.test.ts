import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// Under `dir="rtl"`, the UI Shell, the list boxes and the menus mirror their
// LTR layout: every part sits as far from the right edge as it sat from the
// left one.

type Box = { left: number; right: number; width: number };

const PARTS = {
  headerName: ".bx--header__name",
  headerNav: ".bx--header__nav",
  headerActions: ".bx--header__global",
  sideNav: ".bx--side-nav",
  sideNavIcon: ".bx--side-nav__link .bx--side-nav__icon",
  sideNavChevron: ".bx--side-nav__submenu-chevron",
  sideNavMenuItem: ".bx--side-nav__menu .bx--side-nav__link-text",
  content: ".bx--content",
  comboBoxInput: "[data-testid=combobox] input",
  comboBoxClear: "[data-testid=combobox] .bx--list-box__selection",
  comboBoxInvalid: "[data-testid=combobox] .bx--list-box__invalid-icon",
  comboBoxChevron: "[data-testid=combobox] .bx--list-box__menu-icon",
  dropdownLabel: "[data-testid=dropdown] .bx--list-box__label",
  dropdownChevron: "[data-testid=dropdown] .bx--list-box__menu-icon",
  multiSelectTag: "[data-testid=multiselect] .bx--tag",
  multiSelectTagLabel: "[data-testid=multiselect] .bx--tag__label",
  multiSelectTagClose: "[data-testid=multiselect] .bx--tag__close-icon",
  multiSelectChevron: "[data-testid=multiselect] .bx--list-box__menu-icon",
};

function boxes(page: Page, parts: Record<string, string>) {
  return page.evaluate((parts) => {
    const result: Record<string, Box | null> = {};
    for (const [name, selector] of Object.entries(parts)) {
      const rect = document.querySelector(selector)?.getBoundingClientRect();
      result[name] = rect
        ? {
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          }
        : null;
    }
    return result;
  }, parts);
}

function setDirection(page: Page, dir: "rtl" | "ltr") {
  return page.evaluate((dir) => {
    document.documentElement.dir = dir;
  }, dir);
}

/** Each LTR box reflected across the viewport's vertical center. */
function mirror(ltr: Record<string, Box | null>, viewportWidth: number) {
  return Object.fromEntries(
    Object.entries(ltr).map(([name, box]) => [
      name,
      box && {
        left: viewportWidth - box.right,
        right: viewportWidth - box.left,
        width: box.width,
      },
    ]),
  );
}

function expectMirrored(
  rtl: Record<string, Box | null>,
  mirrored: Record<string, Box | null>,
) {
  for (const [name, box] of Object.entries(mirrored)) {
    const actual = rtl[name];
    expect.soft(box, `${name} renders in LTR`).not.toBeNull();
    expect.soft(actual, `${name} renders in RTL`).not.toBeNull();
    if (!box || !actual) continue;
    expect.soft(Math.abs(actual.left - box.left), name).toBeLessThanOrEqual(1);
    expect.soft(actual.width, name).toBe(box.width);
  }
}

test.describe("right-to-left layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/rtl.html");
  });

  test("mirrors the UI Shell and closed list boxes", async ({ page }) => {
    const viewportWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    const ltr = await boxes(page, PARTS);

    await setDirection(page, "rtl");
    const rtl = await boxes(page, PARTS);
    expectMirrored(rtl, mirror(ltr, viewportWidth));

    // The positions named in the request, spelled out.
    const sideNav = rtl.sideNav as Box;
    expect(sideNav.right).toBe(viewportWidth);
    expect((rtl.headerActions as Box).left).toBe(0);
    expect((rtl.headerName as Box).right).toBe(viewportWidth);
    expect((rtl.content as Box).right).toBe(sideNav.left);

    const comboBox = await boxes(page, {
      field: "[data-testid=combobox] .bx--list-box",
    });
    expect(
      (rtl.comboBoxChevron as Box).left - (comboBox.field as Box).left,
    ).toBe(12);
  });

  test("puts the checkmark at the inline end of an open ComboBox", async ({
    page,
  }) => {
    const selectedIcon =
      "[data-testid=combobox] .bx--list-box__menu-item--active .bx--list-box__menu-item__selected-icon";
    const viewportWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    const input = page.getByTestId("combobox").locator("input");

    await input.click();
    await expect(page.locator(selectedIcon)).toBeVisible();
    const ltr = await boxes(page, { selectedIcon });

    await page.goto("/rtl.html");
    await setDirection(page, "rtl");
    await input.click();
    await expect(page.locator(selectedIcon)).toBeVisible();
    const rtl = await boxes(page, { selectedIcon });
    expectMirrored(rtl, mirror(ltr, viewportWidth));
  });

  test("puts MultiSelect checkboxes at the inline start", async ({ page }) => {
    await setDirection(page, "rtl");
    await page
      .getByTestId("multiselect")
      .locator(".bx--list-box__field")
      .click();

    const label = page
      .getByTestId("multiselect")
      .locator(".bx--checkbox-label")
      .first();
    const layout = await label.evaluate((node) => {
      const box = getComputedStyle(node, "::before");
      const style = getComputedStyle(node);
      return {
        boxRight: box.right,
        paddingRight: style.paddingRight,
        paddingLeft: style.paddingLeft,
      };
    });
    expect(layout).toEqual({
      boxRight: "0px",
      paddingRight: "28px",
      paddingLeft: "0px",
    });
  });

  test("mirrors the submenu caret", async ({ page }) => {
    const trigger = page.getByTestId("menu-button").getByRole("button");
    const caret = page.locator(".bx--menu-option__info > svg");

    await trigger.click();
    await expect(caret).toBeVisible();
    expect(
      await caret.evaluate((node) => getComputedStyle(node).transform),
    ).toBe("none");
    await page.keyboard.press("Escape");

    await setDirection(page, "rtl");
    await trigger.click();
    await expect(caret).toBeVisible();
    expect(
      await caret.evaluate((node) => getComputedStyle(node).transform),
    ).toBe("matrix(-1, 0, 0, 1, 0, 0)");

    // The caret ends the row, so it sits left of the label.
    const [caretBox, labelBox] = await Promise.all([
      caret.boundingBox(),
      page
        .getByRole("menuitem", { name: "Export as" })
        .locator(".bx--menu-option__label")
        .boundingBox(),
    ]);
    expect(caretBox && labelBox && caretBox.x < labelBox.x).toBe(true);
  });
});
