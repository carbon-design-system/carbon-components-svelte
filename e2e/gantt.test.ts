import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const bar = (page: Page, id: string) => page.locator(`[data-gantt-id="${id}"]`);

const lastChange = async (page: Page) =>
  JSON.parse((await page.getByTestId("change").textContent()) || "{}");

test.describe("Gantt", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/gantt.html?size=short&zoom=day");
    await expect(bar(page, "design")).toBeVisible();
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    const white = await new AxeBuilder({ page }).include("#app").analyze();
    expect(white.violations).toEqual([]);

    await page.evaluate(() => {
      document.documentElement.classList.add("bx--g100");
      document.documentElement.setAttribute("dir", "rtl");
    });
    const dark = await new AxeBuilder({ page }).include("#app").analyze();
    expect(dark.violations).toEqual([]);
  });

  test("names a bar with its dates, progress and predecessors", async ({
    page,
  }) => {
    await expect(bar(page, "design")).toHaveAttribute(
      "aria-label",
      /^Design review, Mar 9\s–\s13, 2026, 60% complete, after Write the brief$/,
    );
    await expect(bar(page, "approved")).toHaveAttribute(
      "aria-label",
      "Plan approved, milestone, Mar 16, 2026, after Design review",
    );
    await expect(bar(page, "plan")).toHaveAttribute(
      "aria-label",
      /^Planning, summary, Mar 2\s–\s16, 2026, 80% complete$/,
    );
  });

  test("keeps the list and the bars on one row grid at every size", async ({
    page,
  }) => {
    for (const size of ["compact", "short", "medium", "default", "tall"]) {
      // biome-ignore lint/performance/noAwaitInLoops: one size at a time
      await page.goto(`/gantt.html?size=${size}`);
      const offsets = await page.evaluate(() => {
        const rows = [...document.querySelectorAll("tbody tr")].map(
          (row) => row.getBoundingClientRect().top,
        );
        const canvas = document.querySelector(".bx--gantt__canvas");
        const top = canvas?.getBoundingClientRect().top ?? Number.NaN;
        const pitch = Number.parseFloat(
          getComputedStyle(
            document.querySelector(".bx--gantt") as Element,
          ).getPropertyValue("--ccs-gantt-row-height"),
        );
        return rows.map((rowTop, i) => rowTop - (top + i * pitch));
      });
      expect(offsets.every((offset) => Math.abs(offset) < 0.5)).toBe(true);
    }
  });

  test("moves a bar a day with the arrow keys and resizes it with Shift", async ({
    page,
  }) => {
    await bar(page, "design").focus();
    await page.keyboard.press("ArrowRight");
    expect(await lastChange(page)).toMatchObject({
      id: "design",
      start: "2026-03-10",
      end: "2026-03-14",
      mode: "move",
      source: "keyboard",
    });
    await page.keyboard.press("Shift+ArrowRight");
    expect(await lastChange(page)).toMatchObject({
      start: "2026-03-10",
      end: "2026-03-15",
      mode: "end",
    });
    await page.keyboard.press("Shift+Alt+ArrowLeft");
    expect(await lastChange(page)).toMatchObject({
      start: "2026-03-09",
      end: "2026-03-15",
      mode: "start",
    });
    // The list's End column follows the write.
    await expect(
      page.locator('[data-tree-row-id="design"] td').nth(2),
    ).toHaveText("Mar 15, 2026");
  });

  test("leaves a summary, a locked task and a canceled change alone", async ({
    page,
  }) => {
    await bar(page, "plan").focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("change")).toHaveText("");

    await bar(page, "locked").focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("change")).toHaveText("");

    await page.goto("/gantt.html?size=short&zoom=day&cancel");
    await bar(page, "design").focus();
    await page.keyboard.press("ArrowRight");
    expect((await lastChange(page)).start).toBe("2026-03-10");
    await expect(
      page.locator('[data-tree-row-id="design"] td').nth(1),
    ).toHaveText("Mar 9, 2026");
  });

  test("moves between bars with Up, Down, Home and End", async ({ page }) => {
    await bar(page, "brief").focus();
    await page.keyboard.press("ArrowDown");
    await expect(bar(page, "design")).toBeFocused();
    await page.keyboard.press("End");
    await expect(bar(page, "ship")).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(bar(page, "locked")).toBeFocused();
    // The unscheduled last row has no bar, so Down stays on the last one.
    await page.keyboard.press("End");
    await page.keyboard.press("ArrowDown");
    await expect(bar(page, "ship")).toBeFocused();
    await page.keyboard.press("Home");
    await expect(bar(page, "plan")).toBeFocused();
  });

  test("is one tab stop however many bars there are", async ({ page }) => {
    await page.getByRole("treegrid").locator("tbody tr").first().focus();
    await page.keyboard.press("Tab");
    await expect(bar(page, "plan")).toBeFocused();
    await page.keyboard.press("Tab");
    // WebKit on macOS does not Tab to buttons, so check only that the bars
    // were left, not where focus went.
    await expect(page.locator("[data-gantt-id]:focus")).toHaveCount(0);
  });

  test("moves a bar by dragging it and resizes it by an edge", async ({
    page,
  }) => {
    await page.locator(".bx--gantt__scroller").evaluate((node) => {
      node.scrollLeft = 300;
    });
    const box = (await bar(page, "design").boundingBox()) as {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    const y = box.y + box.height / 2;
    // 40px a day: 90px rounds to 2 days.
    await page.mouse.move(box.x + box.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 45, y, { steps: 4 });
    await page.mouse.move(box.x + box.width / 2 + 90, y, { steps: 4 });
    await page.mouse.up();
    expect(await lastChange(page)).toMatchObject({
      start: "2026-03-11",
      end: "2026-03-15",
      mode: "move",
      source: "pointer",
    });
    await expect(page.getByTestId("selected")).toHaveText("design");

    const moved = (await bar(page, "design").boundingBox()) as typeof box;
    await page.mouse.move(moved.x + moved.width - 2, y);
    await page.mouse.down();
    await page.mouse.move(moved.x + moved.width + 38, y, { steps: 6 });
    await page.mouse.up();
    expect(await lastChange(page)).toMatchObject({
      start: "2026-03-11",
      end: "2026-03-16",
      mode: "end",
    });
  });

  test("cancels a drag with Escape", async ({ page }) => {
    const box = (await bar(page, "design").boundingBox()) as {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 90, y, { steps: 6 });
    await expect(bar(page, "design")).toHaveClass(/bx--gantt__bar--dragging/);
    await page.keyboard.press("Escape");
    await page.mouse.up();
    await expect(page.getByTestId("change")).toHaveText("");
    await expect(bar(page, "design")).not.toHaveClass(
      /bx--gantt__bar--dragging/,
    );
    expect((await bar(page, "design").boundingBox())?.x).toBeCloseTo(box.x, 0);
  });

  test("keeps the task list in view while the timeline scrolls", async ({
    page,
  }) => {
    const list = page.locator(".bx--gantt__list");
    const before = (await list.boundingBox())?.x;
    await page.locator(".bx--gantt__scroller").evaluate((node) => {
      node.scrollLeft = 300;
      node.scrollTop = 40;
    });
    const after = await list.boundingBox();
    expect(after?.x).toBe(before);
    const header = await page.locator(".bx--gantt__axis").boundingBox();
    const scroller = await page.locator(".bx--gantt__scroller").boundingBox();
    expect(header?.y).toBeGreaterThanOrEqual((scroller?.y ?? 0) - 1);
    expect(header?.y).toBeLessThanOrEqual((scroller?.y ?? 0) + 2);
  });

  test("draws a conflicting link dashed", async ({ page }) => {
    const dashed = page.locator(".bx--gantt__link--conflict");
    await expect(dashed).toHaveCount(1);
    await expect(dashed).toHaveCSS("stroke-dasharray", "4px, 3px");
  });
});

test.describe("Gantt in right-to-left", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/gantt.html?size=short&zoom=day");
    await expect(bar(page, "design")).toBeVisible();
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
  });

  test("runs time toward the left with the list on the right", async ({
    page,
  }) => {
    const list = (await page.locator(".bx--gantt__list").boundingBox()) as {
      x: number;
      width: number;
    };
    const scroller = (await page
      .locator(".bx--gantt__scroller")
      .boundingBox()) as { x: number; width: number };
    expect(list.x + list.width).toBeCloseTo(scroller.x + scroller.width, -1);

    const brief = (await bar(page, "brief").boundingBox()) as { x: number };
    const design = (await bar(page, "design").boundingBox()) as { x: number };
    // Later tasks sit further left.
    expect(design.x).toBeLessThan(brief.x);
  });

  test("swaps the arrow keys: Left is later", async ({ page }) => {
    await bar(page, "design").focus();
    await page.keyboard.press("ArrowLeft");
    expect(await lastChange(page)).toMatchObject({ start: "2026-03-10" });
    await page.keyboard.press("ArrowRight");
    expect(await lastChange(page)).toMatchObject({ start: "2026-03-09" });
  });

  test("drags a bar toward the left to move it later", async ({ page }) => {
    const box = (await bar(page, "design").boundingBox()) as {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 45, y, { steps: 4 });
    await page.mouse.move(box.x + box.width / 2 - 80, y, { steps: 4 });
    await page.mouse.up();
    expect(await lastChange(page)).toMatchObject({
      start: "2026-03-11",
      mode: "move",
    });
  });

  test("mirrors the links with the bars", async ({ page }) => {
    // The first link ends at the left edge (the start) of "design" in LTR
    // coordinates, which is the bar's physical right edge here.
    const arrow = await page
      .locator(".bx--gantt__link")
      .first()
      .evaluate((path) => {
        const rect = path.getBoundingClientRect();
        return { right: rect.right, left: rect.left };
      });
    const design = (await bar(page, "design").boundingBox()) as {
      x: number;
      width: number;
    };
    expect(Math.abs(arrow.left - (design.x + design.width))).toBeLessThan(2);
  });
});

test.describe("Gantt forced colors and print", () => {
  test("keeps bars, progress and links visible in forced colors", async ({
    page,
  }) => {
    await page.goto("/gantt.html?size=short&zoom=day");
    await expect(bar(page, "design")).toBeVisible();
    await page.emulateMedia({ forcedColors: "active" });
    const style = (selector: string, property: string) =>
      page
        .locator(selector)
        .first()
        .evaluate(
          (node, name) => getComputedStyle(node).getPropertyValue(name),
          property,
        );
    const colors = await page.evaluate(() => {
      const probe = document.createElement("div");
      document.body.append(probe);
      const resolve = (name: string) => {
        probe.style.color = name;
        return getComputedStyle(probe).color;
      };
      const result = {
        canvasText: resolve("CanvasText"),
        highlight: resolve("Highlight"),
      };
      probe.remove();
      return result;
    });
    expect(await style('[data-gantt-id="design"]', "border-top-color")).toBe(
      colors.canvasText,
    );
    expect(
      await style(
        '[data-gantt-id="design"] .bx--gantt__progress',
        "background-color",
      ),
    ).toBe(colors.highlight);
    expect(await style(".bx--gantt__link", "stroke")).toBe(colors.canvasText);
    expect(await style(".bx--gantt__today", "background-color")).toBe(
      colors.highlight,
    );
    await bar(page, "design").click();
    expect(await style('[data-gantt-id="design"]', "border-top-color")).toBe(
      colors.highlight,
    );
  });

  test("prints the whole chart with nothing sticky or scrolling", async ({
    page,
  }) => {
    await page.goto("/gantt.html?size=short&zoom=week");
    await expect(bar(page, "design")).toBeVisible();
    await page.emulateMedia({ media: "print" });
    await expect(page.locator(".bx--gantt__scroller")).toHaveCSS(
      "overflow-x",
      "visible",
    );
    await expect(page.locator(".bx--gantt__axis")).toHaveCSS(
      "position",
      "static",
    );
    await expect(bar(page, "design")).toHaveCSS("print-color-adjust", "exact");
  });
});
