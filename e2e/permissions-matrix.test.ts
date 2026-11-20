import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const grid = (page: Page) =>
  page.getByRole("grid", { name: "Role permissions" });
const box = (page: Page, name: string) =>
  page.getByRole("checkbox", { name, exact: true });
const value = async (page: Page) =>
  JSON.parse((await page.getByTestId("value").textContent()) ?? "{}");

function press(page: Page, key: string, times: number) {
  return Array.from({ length: times }).reduce<Promise<void>>(
    (done) => done.then(() => page.keyboard.press(key)),
    Promise.resolve(),
  );
}

const modes = [
  ["boolean", "boolean"],
  ["levels", "levels"],
  ["transposed, rotated headers", "transposed&rotated&size=short"],
] as const;

test.describe("PermissionsMatrix", () => {
  test.describe("axe", () => {
    for (const [label, query] of modes) {
      for (const theme of ["white", "g100"] as const) {
        test(`has no violations: ${label}, ${theme}`, async ({ page }) => {
          await page.goto(`/permissions-matrix.html?${query}`);
          await page.evaluate(
            (cls) => {
              if (cls) document.documentElement.classList.add(cls);
            },
            theme === "g100" ? "bx--g100" : "",
          );
          await expect(grid(page)).toBeVisible();
          // A focused cell, a selection, a locked cell and a change in view.
          await grid(page).locator("[data-pm]").nth(8).focus();
          await page.keyboard.press("Shift+ArrowRight");

          const results = await new AxeBuilder({ page })
            .include("#app")
            .analyze();
          expect(results.violations).toEqual([]);
        });
      }
    }

    test("has no violations in RTL", async ({ page }) => {
      await page.goto("/permissions-matrix.html");
      await page.evaluate(() => {
        document.documentElement.dir = "rtl";
      });
      await expect(grid(page)).toBeVisible();

      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    });
  });

  test("reads as a grid of checkboxes named by both headers, in Chromium's tree", async ({
    page,
  }) => {
    await page.goto("/permissions-matrix.html");
    await expect(grid(page)).toBeVisible();

    const cdp = await page.context().newCDPSession(page);
    const { nodes } = await cdp.send("Accessibility.getFullAXTree");
    const checkboxes = nodes
      .filter((node) => node.role?.value === "checkbox" && !node.ignored)
      .map((node) => ({
        name: node.name?.value,
        description: node.description?.value,
        checked: node.properties?.find((p) => p.name === "checked")?.value
          .value,
      }));
    const named = (name: string) => checkboxes.find((c) => c.name === name);

    expect(named("Projects, View projects Viewer")).toMatchObject({
      checked: "true",
    });
    expect(named("Projects, Delete projects Viewer")).toMatchObject({
      checked: "false",
    });
    expect(named("Projects Viewer")).toMatchObject({ checked: "mixed" });
    expect(named("Projects, View projects Editor")).toMatchObject({
      checked: "true",
      description: "Inherited from Viewer",
    });
    expect(named("Secrets, View secrets Auditor")?.description).toBe(
      "Locked: Auditors cannot reach secrets under SOC 2",
    );
    const roles = nodes
      .filter((node) => node.ignored === false)
      .map((node) => node.role?.value);
    for (const role of ["grid", "columnheader", "rowheader", "row"]) {
      expect(roles, role).toContain(role);
    }
  });

  test("is one tab stop, and arrow keys and Space edit it by keyboard alone", async ({
    page,
  }) => {
    await page.goto("/permissions-matrix.html");
    await expect(grid(page)).toBeVisible();

    await page.keyboard.press("Tab");
    await expect(box(page, "Billing Viewer")).toBeFocused();
    await expect(grid(page).locator('[tabindex="0"]')).toHaveCount(1);

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(box(page, "Billing, Create billing Viewer")).toBeFocused();
    await page.keyboard.press("Space");
    await expect(box(page, "Billing, Create billing Viewer")).toBeChecked();
    expect((await value(page)).viewer["billing.create"]).toBe(true);
    await expect(page.getByRole("status")).toHaveText("1 change");

    await page.keyboard.press("Tab");
    await expect(box(page, "Billing, Create billing Viewer")).not.toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(box(page, "Billing, Create billing Viewer")).toBeFocused();

    await page.keyboard.press("Delete");
    await expect(page.getByRole("status")).toHaveText("No changes");
  });

  for (const dir of ["ltr", "rtl"]) {
    test(`keeps the header row and the first column in view: ${dir}`, async ({
      page,
    }) => {
      await page.goto("/permissions-matrix.html?size=short");
      await page.evaluate((d) => {
        document.documentElement.dir = d;
      }, dir);
      await expect(grid(page)).toBeVisible();
      // Narrow, so the grid scrolls on both axes.
      await page.setViewportSize({ width: 560, height: 700 });
      await grid(page).evaluate(
        (node, sign) => {
          node.scrollTop = 200;
          node.scrollLeft = (node.scrollWidth - node.clientWidth) * sign;
        },
        dir === "rtl" ? -1 : 1,
      );

      const measure = await grid(page).evaluate((node, rtl) => {
        const edge = node.getBoundingClientRect();
        const start = (selector: string) => {
          const rect = node.querySelector(selector)?.getBoundingClientRect();
          return rect
            ? rtl
              ? edge.right - rect.right
              : rect.left - edge.left
            : Number.NaN;
        };
        const corner = node.querySelector(".bx--permissions-matrix__corner");
        return {
          scrolled: node.scrollTop,
          scrolledAside: Math.abs(node.scrollLeft),
          headerGap:
            (corner?.getBoundingClientRect().top ?? Number.NaN) - edge.top,
          cornerStart: start(".bx--permissions-matrix__corner"),
          labelStart: start(
            ".bx--permissions-matrix__body .bx--permissions-matrix__header--row",
          ),
        };
      }, dir === "rtl");
      expect.soft(measure.scrolled, "scrolled down").toBeGreaterThan(0);
      expect.soft(measure.scrolledAside, "scrolled aside").toBeGreaterThan(0);
      expect.soft(measure.headerGap, "sticky header").toBeLessThan(2);
      expect.soft(measure.cornerStart, "sticky corner").toBeLessThan(2);
      expect.soft(measure.labelStart, "sticky first column").toBeLessThan(2);
    });
  }

  test("gives focus a cell that is never under the sticky header or column", async ({
    page,
  }) => {
    await page.goto("/permissions-matrix.html?size=short&height=240");
    await expect(grid(page)).toBeVisible();
    await page.keyboard.press("Tab");

    await press(page, "ArrowDown", 14);
    await press(page, "ArrowRight", 5);
    const clear = await page.evaluate(() => {
      const focused = document.activeElement?.closest("[data-pm]");
      const scroller = document.querySelector('[role="grid"]');
      const head = scroller?.querySelector(".bx--permissions-matrix__head");
      const label = scroller?.querySelector(
        ".bx--permissions-matrix__header--row",
      );
      const f = focused?.getBoundingClientRect();
      return {
        belowHeader:
          (f?.top ?? 0) >= (head?.getBoundingClientRect().bottom ?? 0) - 1,
        afterLabel:
          (f?.left ?? 0) >= (label?.getBoundingClientRect().right ?? 0) - 1,
      };
    });
    expect(clear).toEqual({ belowHeader: true, afterLabel: true });
  });

  test("collapses a group and rolls it up with the keyboard", async ({
    page,
  }) => {
    await page.goto("/permissions-matrix.html");
    await expect(grid(page)).toBeVisible();

    await grid(page)
      .getByRole("rowheader", { name: "Billing", exact: true })
      .focus();
    await page.keyboard.press("Enter");

    await expect(
      grid(page).getByRole("rowheader", { name: "Billing", exact: true }),
    ).toHaveAttribute("aria-expanded", "false");
    await expect(
      grid(page).getByRole("rowheader", { name: "Billing, View billing" }),
    ).toHaveCount(0);

    // Space on the group cell grants every child of the group.
    await box(page, "Billing Auditor").focus();
    await page.keyboard.press("Space");
    expect((await value(page)).auditor).toMatchObject({
      "billing.view": true,
      "billing.delete": true,
    });
  });

  test("selects a column and grants it, and discards", async ({ page }) => {
    await page.goto("/permissions-matrix.html");
    await expect(grid(page)).toBeVisible();

    await grid(page)
      .getByRole("columnheader", { name: "Auditor", exact: true })
      .click();
    await expect(page.getByRole("status")).toHaveText(/cells selected/);
    await page.getByRole("button", { name: "Grant" }).click();
    expect((await value(page)).auditor["audit.delete"]).toBe(true);
    // The locked secrets cells stay as they were.
    expect((await value(page)).auditor["secrets.view"]).toBeUndefined();

    await page.getByRole("button", { name: "Discard" }).click();
    await expect(page.getByRole("status")).toHaveText("No changes");
  });

  test("shows why a cell is locked in a tooltip on focus", async ({ page }) => {
    await page.goto("/permissions-matrix.html");
    await expect(grid(page)).toBeVisible();

    await box(page, "Secrets, View secrets Auditor").focus();

    await expect(page.locator(".bx--tooltip-portal")).toContainText(
      "Locked: Auditors cannot reach secrets under SOC 2",
    );
    await page.keyboard.press("Escape");
    await expect(page.locator(".bx--tooltip-portal")).toHaveCount(0);
  });

  test("paints a window of a 50 by 300 matrix and keeps the focused cell", async ({
    page,
  }) => {
    await page.goto("/permissions-matrix.html?stress");
    await expect(grid(page)).toBeVisible();

    await expect(grid(page)).toHaveAttribute("aria-rowcount", "331");
    await expect(grid(page)).toHaveAttribute("aria-colcount", "51");
    const painted = await grid(page).locator('[role="gridcell"]').count();
    expect(painted).toBeGreaterThan(50);
    expect(painted).toBeLessThan(700);

    await page.keyboard.press("Tab");
    await page.keyboard.press("Control+End");
    await expect(box(page, "Resource 29, Action 9 Role 49")).toBeFocused();
    await expect(grid(page).locator('[tabindex="0"]')).toHaveCount(1);
    await page.keyboard.press("Control+Home");
    await expect(
      page.getByRole("columnheader", { name: "Permissions" }),
    ).toBeFocused();
  });

  test("draws every state without color under forced colors", async ({
    page,
  }) => {
    await page.goto("/permissions-matrix.html");
    await expect(grid(page)).toBeVisible();
    await page.emulateMedia({ forcedColors: "active" });
    await box(page, "Projects, Delete projects Administrator").click();
    await box(page, "Projects, View projects Editor").focus();
    await page.keyboard.press("Shift+ArrowDown");

    const states = await page.evaluate(() => {
      const first = (selector: string) =>
        document.querySelector(selector) as HTMLElement;
      const box = (cell: string) =>
        getComputedStyle(
          first(
            `.bx--permissions-matrix__cell--${cell} .bx--permissions-matrix__box`,
          ),
        );
      return {
        granted: box("granted").borderTopStyle,
        grantedHasIcon: Boolean(
          first(
            ".bx--permissions-matrix__cell--granted .bx--permissions-matrix__box svg",
          ),
        ),
        inherited: box("inherited").borderTopStyle,
        mixedHasIcon: Boolean(
          first(
            ".bx--permissions-matrix__cell--mixed .bx--permissions-matrix__box svg",
          ),
        ),
        revokedHasIcon: Boolean(
          first(
            ".bx--permissions-matrix__cell--revoked .bx--permissions-matrix__box svg",
          ),
        ),
        changed: getComputedStyle(
          first(".bx--permissions-matrix__cell--changed"),
          "::before",
        ).content,
        lockHasIcon: Boolean(
          first(
            ".bx--permissions-matrix__cell--locked .bx--permissions-matrix__lock",
          ),
        ),
        selected: getComputedStyle(
          first(".bx--permissions-matrix__cell--selected"),
        ).outlineStyle,
      };
    });
    expect(states).toMatchObject({
      granted: "solid",
      grantedHasIcon: true,
      inherited: "dashed",
      mixedHasIcon: true,
      revokedHasIcon: true,
      lockHasIcon: true,
      selected: "solid",
    });
    expect(states.changed).toBe('""');
  });
});
