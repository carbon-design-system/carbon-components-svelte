import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";
import { expectSingleRing } from "./helpers/layout";

// The field comes first in the DOM, ahead of the search field inside its popover.
const field = (page: Page, testId: string) =>
  page.getByTestId(testId).getByRole("combobox").first();
const panel = (page: Page, testId: string) =>
  page.getByTestId(testId).getByRole("dialog");
const search = (page: Page, testId: string) =>
  panel(page, testId).getByRole("combobox");
const options = (page: Page, testId: string) =>
  page.getByTestId(testId).getByRole("listbox").getByRole("option");

/** How many icons the picker has asked to import so far. */
const imports = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { __iconImports?: number }).__iconImports ?? 0,
  );

test.describe("IconPicker", () => {
  test("shows the chosen icon's name and renders no grid until it opens", async ({
    page,
  }) => {
    await page.goto("/icon-picker.html");
    await expect(field(page, "curated")).toHaveAccessibleName(/Curated/);
    await expect(field(page, "basic")).toContainText("Add");
    await expect(field(page, "basic")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(page.getByTestId("basic").getByRole("dialog")).toHaveCount(0);
  });

  test("loads the icon list on demand and only the icons in view", async ({
    page,
  }) => {
    await page.goto("/icon-picker.html");
    await expect(field(page, "basic")).toContainText("Add");
    const before = await imports(page);
    await field(page, "basic").click();
    await expect(search(page, "basic")).toBeFocused();
    await expect(options(page, "basic").first()).toBeVisible();
    // A screenful of icons, not the 2,790.
    await expect
      .poll(async () => (await imports(page)) - before)
      .toBeGreaterThan(20);
    expect((await imports(page)) - before).toBeLessThan(150);
    expect(await options(page, "basic").count()).toBeLessThan(120);
  });

  test("opens from the keyboard, searches, chooses with Enter and returns focus", async ({
    page,
  }) => {
    await page.goto("/icon-picker.html");
    await field(page, "curated").focus();
    await page.keyboard.press("ArrowDown");
    await expect(search(page, "curated")).toBeFocused();
    await expect(field(page, "curated")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await page.keyboard.type("trash");
    await page.keyboard.press("Enter");
    await expect(field(page, "curated")).toBeFocused();
    await expect(field(page, "curated")).toContainText("Trash can");
    await expect(
      page.getByTestId("curated").locator("input[name=curated-icon]"),
    ).toHaveValue("TrashCan");
    await expect(panel(page, "curated")).toBeHidden();
  });

  test("change carries the icon component, and the value is its name", async ({
    page,
  }) => {
    await page.goto("/icon-picker.html");
    await field(page, "basic").click();
    await search(page, "basic").fill("arrow down");
    await expect(options(page, "basic").first()).toHaveAccessibleName(
      "Arrow down",
    );
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("value")).toHaveText("ArrowDown");
    await expect(page.getByTestId("changes")).toHaveText(
      /^ArrowDown:function$/,
    );
  });

  test("Escape clears the search, then closes and returns focus", async ({
    page,
  }) => {
    await page.goto("/icon-picker.html");
    await field(page, "curated").click();
    await page.keyboard.type("add");
    await page.keyboard.press("Escape");
    await expect(search(page, "curated")).toHaveValue("");
    await expect(panel(page, "curated")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel(page, "curated")).toBeHidden();
    await expect(field(page, "curated")).toBeFocused();
  });

  test("closes on an outside click and when focus leaves", async ({ page }) => {
    await page.goto("/icon-picker.html");
    await field(page, "curated").click();
    await expect(panel(page, "curated")).toBeVisible();
    // The outside-click listener arrives a frame after the popover opens.
    await expect(async () => {
      await page.mouse.click(900, 40);
      await expect(panel(page, "curated")).toBeHidden({ timeout: 250 });
    }).toPass();
    await field(page, "curated").click();
    await expect(panel(page, "curated")).toBeVisible();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(panel(page, "curated")).toBeHidden();
  });

  test("lists the icon just chosen first under Recent", async ({ page }) => {
    await page.goto("/icon-picker.html");
    await field(page, "curated").click();
    await search(page, "curated").fill("calendar");
    await page.keyboard.press("Enter");
    await field(page, "curated").click();
    const recent = panel(page, "curated").getByRole("group", {
      name: "Recent",
    });
    await expect(recent.getByRole("option")).toHaveCount(1);
    await expect(recent.getByRole("option")).toHaveAccessibleName("Calendar");
    // The chosen icon is marked, and the cursor starts on it.
    await expect(
      panel(page, "curated").getByRole("option", { selected: true }).first(),
    ).toHaveAccessibleName("Calendar");
  });

  test("categories jump to their section and follow the scroll", async ({
    page,
  }) => {
    await page.goto("/icon-picker.html");
    await field(page, "curated").click();
    const bar = panel(page, "curated").getByRole("toolbar");
    // The set fits, so the grid does not scroll and the first section is current.
    await expect(bar.getByRole("button", { name: "Actions" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await bar.getByRole("button", { name: "General" }).click();
    await expect(bar.getByRole("button", { name: "General" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(
      panel(page, "curated").getByRole("group", { name: "General" }),
    ).toBeVisible();
  });

  test("names every icon for assistive technology, not just its glyph", async ({
    page,
  }) => {
    await page.goto("/icon-picker.html");
    await field(page, "curated").click();
    const names = await options(page, "curated").evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("aria-label")),
    );
    expect(names).toContain("Trash can");
    expect(names.every((name) => name && name.length > 0)).toBe(true);
    // The glyphs are decorative: no name of their own.
    expect(
      await options(page, "curated")
        .first()
        .evaluate((node) =>
          node.querySelector("svg")?.getAttribute("aria-hidden"),
        ),
    ).toBe("true");
  });

  test("the inline variant is the grid with no field", async ({ page }) => {
    await page.goto("/icon-picker.html");
    const inline = page.getByTestId("inline");
    await expect(inline.getByRole("listbox")).toBeVisible();
    await expect(inline.getByRole("dialog")).toHaveCount(0);
    await inline.getByRole("option", { name: "Settings" }).click();
    await expect(
      inline.getByRole("option", { name: "Settings", selected: true }),
    ).toBeVisible();
  });

  test("a disabled field does not open", async ({ page }) => {
    await page.goto("/icon-picker.html");
    await expect(field(page, "disabled")).toBeDisabled();
  });

  test("sizes the cells from the icon size", async ({ page }) => {
    await page.goto("/icon-picker.html");
    const heights: number[] = [];
    for (const size of [16, 20, 32]) {
      // biome-ignore lint/performance/noAwaitInLoops: one picker open at a time
      await field(page, `size-${size}`).click();
      const cell = options(page, `size-${size}`).first();
      await expect(cell).toBeVisible();
      const box = await cell.boundingBox();
      heights.push(Math.round(box?.height ?? 0));
      const icon = await cell.locator("svg").first().boundingBox();
      expect(Math.round(icon?.width ?? 0)).toBe(size);
      await page.keyboard.press("Escape");
    }
    expect(heights).toEqual([32, 36, 48]);
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/icon-picker.html");
    await expect(field(page, "curated")).toBeVisible();
    const closed = await new AxeBuilder({ page }).include("#app").analyze();
    expect(closed.violations).toEqual([]);

    await field(page, "curated").click();
    await expect(options(page, "curated").first()).toBeVisible();
    const open = await new AxeBuilder({ page }).include("#app").analyze();
    expect(open.violations).toEqual([]);

    await page.keyboard.type("zzzz");
    await expect(
      panel(page, "curated").getByText("No icons match your search"),
    ).toBeVisible();
    const empty = await new AxeBuilder({ page }).include("#app").analyze();
    expect(empty.violations).toEqual([]);
  });
});

test.describe("IconPicker in a Modal", () => {
  test("opens above the modal, Escape closes the popover first, then the modal", async ({
    page,
  }) => {
    await page.goto("/icon-picker-modal.html");
    const modal = page.getByTestId("modal");
    await expect(modal).toBeVisible();
    const trigger = modal.getByRole("combobox").first();
    await trigger.click();
    await expect(
      page
        .getByRole("dialog", { name: "Icon", exact: true })
        .getByRole("combobox"),
    ).toBeFocused();
    // The popover is in a portal, outside the modal's box, and on top of it.
    const portalled = await page
      .locator(".bx--popover--portal [role=dialog]")
      .count();
    expect(portalled).toBe(1);
    const topmost = await page
      .getByRole("option", { name: "Chat" })
      .evaluate((node) => {
        const box = node.getBoundingClientRect();
        const hit = document.elementFromPoint(
          box.left + box.width / 2,
          box.top + box.height / 2,
        );
        return !!hit && node.contains(hit);
      });
    expect(topmost).toBe(true);

    await page.keyboard.press("Escape");
    await expect(
      page.locator(".bx--popover--portal [role=dialog]"),
    ).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.getByTestId("modal-open")).toHaveText("true");

    await page.keyboard.press("Escape");
    await expect(page.getByTestId("modal-open")).toHaveText("false");
  });

  test("chooses an icon without closing the modal", async ({ page }) => {
    await page.goto("/icon-picker-modal.html");
    const trigger = page.getByTestId("modal").getByRole("combobox").first();
    await trigger.click();
    await page.getByRole("option", { name: "Settings" }).click();
    await expect(page.getByTestId("value")).toHaveText("Settings");
    await expect(trigger).toBeFocused();
    await expect(page.getByTestId("modal-open")).toHaveText("true");
  });

  test("has no detectable accessibility violations with the popover open", async ({
    page,
  }) => {
    await page.goto("/icon-picker-modal.html");
    await page.getByTestId("modal").getByRole("combobox").first().click();
    await expect(page.getByRole("option", { name: "Chat" })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("IconPicker right to left", () => {
  test("mirrors the grid and swaps the inline arrow keys", async ({ page }) => {
    await page.goto("/icon-picker.html");
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    await field(page, "curated").click();
    const cells = options(page, "curated");
    const [first, second] = await Promise.all([
      cells.nth(0).boundingBox(),
      cells.nth(1).boundingBox(),
    ]);
    // The first icon sits at the right edge, and the second to its left.
    expect(first && second && first.x > second.x).toBe(true);
    const label = async () => {
      const id = await search(page, "curated").getAttribute(
        "aria-activedescendant",
      );
      return page.locator(`[id="${id}"]`).getAttribute("aria-label");
    };
    // The search is empty, so the arrows move the cursor: Left goes forward.
    const start = await label();
    await page.keyboard.press("ArrowRight");
    expect(await label()).toBe(start);
    await page.keyboard.press("ArrowLeft");
    expect(await label()).not.toBe(start);
    await page.keyboard.press("ArrowRight");
    expect(await label()).toBe(start);
  });

  test("the field's popover aligns to the inline start", async ({ page }) => {
    await page.goto("/icon-picker.html");
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    await field(page, "curated").click();
    const [trigger, panelBox] = await Promise.all([
      field(page, "curated").boundingBox(),
      panel(page, "curated").boundingBox(),
    ]);
    // `bottom-start` in RTL: the popover's right edge meets the field's.
    expect(
      trigger &&
        panelBox &&
        Math.abs(trigger.x + trigger.width - (panelBox.x + panelBox.width)) < 2,
    ).toBe(true);
  });
});

test.describe("IconPicker themes and media", () => {
  test("has no accessibility violations on Gray 100, with the popover open", async ({
    page,
  }) => {
    await page.goto("/icon-picker.html");
    await page.evaluate(() =>
      document.documentElement.classList.add("bx--g100"),
    );
    await field(page, "curated").click();
    await options(page, "curated").first().hover();
    await page.keyboard.press("ArrowDown");
    await expect(options(page, "curated").first()).toBeVisible();
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
    await page.evaluate(() =>
      document.documentElement.classList.remove("bx--g100"),
    );
  });

  test("keeps the chosen and the highlighted cells apart under forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/icon-picker.html");
    await field(page, "curated").click();
    const list = panel(page, "curated").getByRole("listbox");
    await search(page, "curated").fill("e");
    await page.keyboard.press("Enter");
    await field(page, "curated").click();
    await page.keyboard.press("ArrowRight");
    const probe = (selector: string) =>
      list
        .locator(selector)
        .first()
        .evaluate((node) => {
          const style = getComputedStyle(node);
          return {
            background: style.backgroundColor,
            outline: `${style.outlineStyle} ${style.outlineWidth}`,
            check: !!node.querySelector(".bx--picker-grid__check svg"),
          };
        });
    const chosen = await probe(".bx--picker-grid__cell--selected");
    const cursor = await probe(
      ".bx--picker-grid__cell--highlighted:not(.bx--picker-grid__cell--selected)",
    );
    // Chosen: a Highlight fill and a check mark, no ring.
    expect(chosen.check).toBe(true);
    expect(chosen.outline).toMatch(/none|0px/);
    // The cursor: a 2px ring and no fill or check, so it is not mistaken for a choice.
    expect(cursor.check).toBe(false);
    expect(cursor.outline).toBe("solid 2px");
    expect(cursor.background).not.toBe(chosen.background);
    // One ring in the grid, as `expectSingleRing` counts them.
    await expectSingleRing(list);
    await page.emulateMedia({ forcedColors: "none" });
  });

  test("starts no animation when the user prefers reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/icon-picker.html");
    await field(page, "curated").click();
    await expect(options(page, "curated").first()).toBeVisible();
    await page.keyboard.press("PageDown");
    // The popover and the grid animate nothing. The list box field's own
    // chevron and border transitions are Carbon's, as in Dropdown.
    const animations = await page.evaluate(
      () =>
        document.getAnimations().filter((animation) => {
          const target = (animation.effect as KeyframeEffect | null)?.target;
          return target?.closest(".bx--picker-grid, .bx--popover");
        }).length,
    );
    expect(animations).toBe(0);
    expect(
      await page
        .getByTestId("curated")
        .getByRole("listbox")
        .evaluate((node) => getComputedStyle(node).scrollBehavior),
    ).toBe("auto");
    await page.emulateMedia({ reducedMotion: "no-preference" });
  });

  test("exposes each icon by name in the accessibility tree", async ({
    page,
  }) => {
    await page.goto("/icon-picker.html");
    await field(page, "curated").click();
    const tree = await panel(page, "curated").ariaSnapshot();
    expect(tree).toContain('combobox "Search curated"');
    expect(tree).toContain('toolbar "Categories"');
    expect(tree).toContain('listbox "Icons"');
    expect(tree).toContain('group "Actions"');
    expect(tree).toContain('option "Trash can"');
    expect(tree).toContain('option "Add"');
    // The glyphs add nothing: no unnamed images between the names.
    expect(tree).not.toMatch(/\bimg\b/);
  });
});
