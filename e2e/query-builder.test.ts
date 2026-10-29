import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

async function readJson(page: Page) {
  return JSON.parse((await page.getByTestId("json").textContent()) ?? "{}");
}

async function box(locator: Locator) {
  const found = await locator.boundingBox();
  if (!found) throw new Error("element has no box");
  return found;
}

function activeId(page: Page) {
  return page.evaluate(() => document.activeElement?.id ?? "");
}

// Ids are `qb-<node id>-<part>`; the node ids are assigned in tree order.
function suffix(id: string) {
  return id.split("-").slice(2).join("-");
}

test.describe("QueryBuilder", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/query-builder.html?preset=nested");
    await expect(
      page.getByRole("group", { name: /Condition 1 of 2: Where Name/ }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has no violations with errors shown, small, read only and disabled", async ({
    page,
  }) => {
    for (const query of [
      "preset=incomplete&errors=1",
      "preset=nested&size=sm",
      "preset=nested&readonly=1",
      "preset=nested&disabled=1",
    ]) {
      // biome-ignore lint/performance/noAwaitInLoops: one page at a time
      await page.goto(`/query-builder.html?${query}`);
      await expect(page.locator(".bx--query-builder")).toBeVisible();
      const results = await new AxeBuilder({ page })
        .include("#app")
        .disableRules(["color-contrast"])
        .analyze();
      expect(results.violations, query).toEqual([]);
    }
  });

  test("names each condition with its sentence and each group with its logic", async ({
    page,
  }) => {
    await page.goto("/query-builder.html?preset=nested");

    await expect(
      page.getByRole("group", {
        name: "Condition 1 of 2: Where Name contains “Acme”",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("group", {
        name: "Condition 2 of 3: or Plan is any of Team, Enterprise",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("group", {
        name: "Group, level 2: Any of the following, 3 items",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Account filter" }),
    ).toHaveAttribute("aria-describedby", /summary/);
    await expect(page.locator(".bx--query-builder__summary-text")).toHaveText(
      "Where Name contains “Acme” and (Seats is at least 50 or Plan is any of Team, Enterprise or (Active is Yes and Renewal date is before 2027-01-01))",
    );
  });

  test("builds a nested query from the keyboard alone", async ({ page }) => {
    await page.goto("/query-builder.html?preset=empty");
    await page.locator("body").click({ position: { x: 1, y: 1 } });
    let tabs = 0;
    async function tabTo(part: string) {
      for (let guard = 0; guard < 12; guard++) {
        // biome-ignore lint/performance/noAwaitInLoops: one key at a time
        await page.keyboard.press("Tab");
        tabs++;
        if (suffix(await activeId(page)) === part) return;
      }
      throw new Error(`never reached ${part}`);
    }

    // The empty root: logic select, then the add buttons.
    await tabTo("logic");
    await tabTo("add");
    await page.keyboard.press("Enter");
    // A new condition takes focus on its field.
    expect(suffix(await activeId(page))).toBe("field");
    await page.keyboard.type("Se");
    await tabTo("operator");
    await page.keyboard.type("is at l");
    await tabTo("value");
    await page.keyboard.type("50");
    // The only row cannot move, so Tab skips its two disabled buttons.
    await tabTo("remove");

    // Add a group from the root's footer, then a condition inside it.
    await page.locator('[id$="-add-group"]').first().focus();
    await page.keyboard.press("Enter");
    expect(suffix(await activeId(page))).toBe("field");
    await page.keyboard.type("Pl");
    await tabTo("operator");
    await page.keyboard.type("is any");
    await tabTo("value");
    await page.keyboard.press("Enter");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Escape");

    const query = await readJson(page);
    expect(query.conditions[0]).toEqual({
      field: "seats",
      operator: "gte",
      value: 50,
    });
    expect(query.conditions[1].operator).toBe("and");
    expect(query.conditions[1].conditions[0]).toMatchObject({
      field: "plan",
      operator: "isAnyOf",
    });
    expect(query.conditions[1].conditions[0].value).toHaveLength(1);
    expect(tabs).toBeLessThan(30);
    await expect(page.getByTestId("changes")).not.toHaveText("0");
  });

  test("keeps focus on the row when it moves and when it is removed", async ({
    page,
  }) => {
    await page.goto("/query-builder.html?preset=nested");
    const root = page.getByRole("group", { name: "Account filter" });

    const first = root.getByRole("group", {
      name: /^Condition 1 of 2: Where Name/,
    });
    await first.getByRole("button", { name: "Move condition 1 down" }).click();
    let query = await readJson(page);
    expect(query.conditions[0].operator).toBe("or");
    expect(query.conditions[1].field).toBe("name");
    // The row sits last now, so focus passes to the button that still works.
    const moved = root.getByRole("group", {
      name: /^Condition 2 of 2: and Name/,
    });
    await expect(
      moved.getByRole("button", { name: "Move condition 2 up" }),
    ).toBeFocused();
    await expect(page.locator(".bx--query-builder > [role=status]")).toHaveText(
      "Condition moved to position 2 of 2",
    );

    await moved.getByRole("button", { name: "Remove condition 2" }).click();
    query = await readJson(page);
    expect(query.conditions).toHaveLength(1);
    // Nothing follows, so focus goes to the group's neighbor: the nested group.
    expect(suffix(await activeId(page))).toBe("logic");
    await expect(page.locator(".bx--query-builder > [role=status]")).toHaveText(
      "Condition removed",
    );
  });

  test("moves and removes a group from its options menu", async ({ page }) => {
    await page.goto("/query-builder.html?preset=nested");
    const menu = page.getByRole("button", { name: "Group 2 options" });
    await menu.focus();
    await page.keyboard.press("Enter");
    await page.getByRole("menuitem", { name: "Move group 2 up" }).click();
    const query = await readJson(page);
    expect(query.conditions[0].operator).toBe("or");
    // The menu closes and focus returns to the moved group's menu button.
    const moved = page.getByRole("button", { name: "Group 1 options" });
    await expect(moved).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("menuitem", { name: "Move group 1 up" }),
    ).toBeDisabled();
    await page.getByRole("menuitem", { name: "Remove group 1" }).click();
    expect((await readJson(page)).conditions).toHaveLength(1);
    await expect(page.locator(".bx--query-builder > [role=status]")).toHaveText(
      "Group removed",
    );
  });

  test("keeps no more than maxDepth levels", async ({ page }) => {
    await page.goto("/query-builder.html?preset=nested");
    const groups = page.locator(".bx--query-builder__group");
    await expect(groups).toHaveCount(3);
    // Levels 1 and 2 offer a group; level 3 offers only conditions.
    await expect(page.locator('[id$="-add-group"]')).toHaveCount(2);
  });

  test("changes the operator and value with the field", async ({ page }) => {
    await page.goto("/query-builder.html?preset=nested");
    const row = page.locator(".bx--query-builder__condition").first();

    await row.getByRole("combobox", { name: "Field" }).selectOption("seats");
    let query = await readJson(page);
    expect(query.conditions[0]).toEqual({
      field: "seats",
      operator: "eq",
      value: null,
    });

    await row
      .getByRole("combobox", { name: "Operator" })
      .selectOption("between");
    await expect(row.getByRole("spinbutton")).toHaveCount(2);
    query = await readJson(page);
    expect(query.conditions[0].value).toEqual([null, null]);

    await row
      .getByRole("combobox", { name: "Operator" })
      .selectOption("isEmpty");
    await expect(row.getByRole("spinbutton")).toHaveCount(0);
    query = await readJson(page);
    expect(query.conditions[0].value).toBeNull();
  });

  test("stores dates as ISO strings, one day or a range", async ({ page }) => {
    await page.goto("/query-builder.html?preset=nested");
    const row = page.locator(".bx--query-builder__condition").filter({
      has: page.locator("#qb-q5-value"),
    });

    const day = row.getByRole("textbox", { name: "Value" });
    await day.fill("2027-03-04");
    await day.press("Enter");
    let query = await readJson(page);
    expect(query.conditions[1].conditions[2].conditions[1].value).toBe(
      "2027-03-04",
    );

    await row
      .getByRole("combobox", { name: "Operator" })
      .selectOption("between");
    await row.getByRole("textbox", { name: "From" }).fill("2027-01-01");
    await row.getByRole("textbox", { name: "From" }).press("Enter");
    await row.getByRole("textbox", { name: "To" }).fill("2027-02-01");
    await row.getByRole("textbox", { name: "To" }).press("Enter");
    query = await readJson(page);
    expect(query.conditions[1].conditions[2].conditions[1]).toEqual({
      field: "renewal",
      operator: "between",
      value: ["2027-01-01", "2027-02-01"],
    });
  });

  test("shows an error after the value is left, or at once with showErrors", async ({
    page,
  }) => {
    await page.goto("/query-builder.html?preset=incomplete");
    const input = page.getByRole("textbox", { name: "Value" });
    await expect(input).not.toHaveAttribute("aria-invalid", "true");
    await input.focus();
    await page.keyboard.press("Tab");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("Enter a value")).toBeVisible();

    await page.goto("/query-builder.html?preset=incomplete&errors=1");
    await expect(page.getByRole("textbox", { name: "Value" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  test("shows no controls to edit when read only", async ({ page }) => {
    await page.goto("/query-builder.html?preset=nested&readonly=1");
    await expect(
      page.getByRole("button", { name: /Add|Remove|Move/ }),
    ).toHaveCount(0);
  });

  test("stays inside a narrow screen and wraps its cells", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/query-builder.html?preset=nested");
    const overflow = await page.evaluate(() => {
      const builder = document.querySelector(
        ".bx--query-builder",
      ) as HTMLElement;
      return builder.scrollWidth - builder.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(0);
    const row = page.getByRole("group", {
      name: /^Condition 1 of 2: Where Name/,
    });
    const field = await box(row.getByRole("combobox", { name: "Field" }));
    const value = await box(row.getByRole("textbox", { name: "Value" }));
    expect(value.y).toBeGreaterThan(field.y + field.height - 1);
  });

  test("reads from the inline start in RTL", async ({ page }) => {
    await page.goto("/query-builder.html?preset=nested");
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const row = page.getByRole("group", {
      name: /^Condition 1 of 2: Where Name/,
    });
    const connector = await box(row.locator(".bx--query-builder__connector"));
    const field = await box(row.getByRole("combobox", { name: "Field" }));
    const remove = await box(
      row.getByRole("button", { name: "Remove condition 1" }),
    );
    expect(connector.x).toBeGreaterThan(field.x);
    expect(remove.x).toBeLessThan(field.x);
    await page.evaluate(() => document.documentElement.removeAttribute("dir"));
  });
});

test.describe("QueryBuilder layout", () => {
  // One edge of every match, in tree order.
  function edges(page: Page, selector: string, side: "left" | "right" | "top") {
    return page
      .locator(selector)
      .evaluateAll(
        (els, side) => els.map((el) => el.getBoundingClientRect()[side]),
        side,
      );
  }

  test("ends the row actions of every level at one x", async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.goto("/query-builder.html?preset=nested");
    const ends = await edges(page, ".bx--query-builder__actions", "right");
    expect(ends.length).toBeGreaterThan(5);
    for (const end of ends) expect(Math.abs(end - ends[0])).toBeLessThan(0.5);
  });

  test("lines up the columns of every row, offset only by the indent", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.goto("/query-builder.html?preset=nested");
    // Each column's x from the row's own connector: equal on every row of
    // every level when the columns have fixed widths.
    const rows = await page
      .locator(".bx--query-builder__condition")
      .evaluateAll((els) =>
        els.map((row) => {
          const left = (selector: string) =>
            row.querySelector(selector)?.getBoundingClientRect().left ??
            Number.NaN;
          const start = left(".bx--query-builder__connector");
          return {
            field: left(".bx--query-builder__cell--field") - start,
            operator: left(".bx--query-builder__cell--operator") - start,
            value: left(".bx--query-builder__cell--value") - start,
          };
        }),
      );
    expect(rows.length).toBeGreaterThan(4);
    for (const row of rows) {
      for (const part of ["field", "operator", "value"] as const) {
        expect(Math.abs(row[part] - rows[0][part])).toBeLessThan(0.5);
      }
    }

    // Every group's logic select, the root's included, sits in the field
    // column of its level.
    const headers = await page
      .locator(".bx--query-builder__group-header")
      .evaluateAll((els) =>
        els.map(
          (header) =>
            (header
              .querySelector(".bx--query-builder__cell--logic")
              ?.getBoundingClientRect().left ?? Number.NaN) -
            (header
              .querySelector(".bx--query-builder__connector")
              ?.getBoundingClientRect().left ?? Number.NaN),
        ),
      );
    expect(headers).toHaveLength(3);
    for (const offset of headers) {
      expect(Math.abs(offset - rows[0].field)).toBeLessThan(0.5);
    }
  });

  test("puts the helper text under the label", async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.goto("/query-builder.html?preset=nested");
    const label = await box(page.locator(".bx--query-builder > .bx--label"));
    const helper = await box(page.getByText("Match accounts by any field."));
    const header = await box(
      page.locator(".bx--query-builder__group-header").first(),
    );
    expect(helper.y - (label.y + label.height)).toBeCloseTo(8, 0);
    expect(header.y - (helper.y + helper.height)).toBeCloseTo(16, 0);
  });

  test("gives headers and conditions one row pitch", async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.goto("/query-builder.html?preset=nested");
    // In this preset no footer falls between two rows.
    const tops = await edges(
      page,
      ".bx--query-builder__group-header, .bx--query-builder__condition",
      "top",
    );
    expect(tops).toHaveLength(8);
    for (let i = 1; i < tops.length; i++) {
      expect(Math.abs(tops[i] - tops[i - 1] - 56)).toBeLessThan(0.5);
    }
  });

  test("keeps each footer with its group, 32 px before the next footer", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.goto("/query-builder.html?preset=nested");
    const footers = await page
      .locator(".bx--query-builder__footer")
      .evaluateAll((els) =>
        els.map((footer) => {
          const body = footer.previousElementSibling as HTMLElement;
          return {
            top: footer.getBoundingClientRect().top,
            bottom: footer.getBoundingClientRect().bottom,
            body: body.getBoundingClientRect().bottom,
          };
        }),
      );
    // A footer follows its body, so document order is innermost first.
    const [level3, level2, root] = footers;
    expect(level3.top - level3.body).toBeCloseTo(8, 0);
    expect(level2.top - level3.bottom).toBeCloseTo(32, 0);
    expect(root.top - level2.bottom).toBeCloseTo(32, 0);
  });

  test("ends a date at the same x as the other values", async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.goto("/query-builder.html?preset=nested");
    const text = await box(
      page.getByRole("textbox", { name: "Value" }).first(),
    );
    const row = page.getByRole("group", { name: /Renewal date/ });
    const date = await box(row.locator(".bx--date-picker__input"));
    expect(Math.abs(date.x + date.width - (text.x + text.width))).toBeLessThan(
      0.5,
    );

    await row
      .getByRole("combobox", { name: "Operator" })
      .selectOption("between");
    const to = await box(row.getByRole("textbox", { name: "To" }));
    expect(Math.abs(to.x + to.width - (text.x + text.width))).toBeLessThan(0.5);
  });
});

test.describe("QueryBuilder forced colors", () => {
  test.use({ colorScheme: "light" });

  test("draws nested groups and fields with system colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/query-builder.html?preset=nested");
    const nested = page.locator(".bx--query-builder__group--nested").first();
    const border = await nested.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        width: style.borderInlineStartWidth,
        style: style.borderInlineStartStyle,
        color: style.borderInlineStartColor,
      };
    });
    expect(border.style).toBe("solid");
    expect(border.width).toBe("2px");
    const canvas = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.color = "CanvasText";
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });
    expect(border.color).toBe(canvas);
    const summary = await page
      .locator(".bx--query-builder__summary")
      .evaluate((el) => getComputedStyle(el).borderInlineStartStyle);
    expect(summary).toBe("solid");
  });
});
