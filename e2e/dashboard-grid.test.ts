import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

async function box(locator: Locator) {
  const b = await locator.boundingBox();
  if (!b) throw new Error("missing box");
  return b;
}

const handle = (page: Page, name: string) =>
  page.getByRole("button", { name: `Move ${name}` });

async function layout(page: Page) {
  return JSON.parse((await page.getByTestId("layouts").textContent()) ?? "{}");
}

test.describe("DashboardGrid", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dashboard-grid.html");
    await expect(page.getByTestId("revenue")).toBeVisible();
  });

  test("places widgets on the columns with CSS grid", async ({ page }) => {
    const grid = await box(page.getByTestId("grid"));
    const revenue = await box(page.getByTestId("revenue"));
    const orders = await box(page.getByTestId("orders"));
    // 16 columns and a 16px gap: revenue spans 6, orders starts at the 7th.
    const column = (grid.width - 15 * 16) / 16;
    expect(revenue.x).toBeCloseTo(grid.x, 0);
    expect(revenue.width).toBeCloseTo(6 * column + 5 * 16, 0);
    expect(orders.x).toBeCloseTo(grid.x + 6 * (column + 16), 0);
    expect(revenue.height).toBeCloseTo(3 * 96 + 2 * 16, 0);
  });

  test("keeps interactive content in a widget working", async ({ page }) => {
    await page.getByRole("button", { name: "Count" }).click();
    await page.getByRole("button", { name: "Count" }).click();
    await expect(page.getByTestId("clicks")).toHaveText("2");
    await page.getByRole("textbox", { name: "Filter" }).fill("abc");
    await expect(page.getByTestId("value")).toHaveText("abc");
    await expect(page.getByTestId("log")).toHaveText("");
  });

  test("drags a widget by its handle and fires one layoutchange", async ({
    page,
  }) => {
    const grabber = await box(handle(page, "Revenue"));
    const orders = await box(page.getByTestId("orders"));

    await page.mouse.move(grabber.x + 8, grabber.y + 8);
    await page.mouse.down();
    await page.mouse.move(orders.x + 40, orders.y + 20, { steps: 8 });
    await expect(page.getByTestId("revenue")).toHaveClass(/--placeholder/);
    // Orders was pushed out of the way while the pointer is still down.
    await expect(page.getByTestId("log")).toHaveText("");
    await page.mouse.up();

    await expect(page.getByTestId("log")).toContainText("move:pointer:lg:");
    expect(
      (await page.getByTestId("log").textContent())?.split("\n"),
    ).toHaveLength(1);
    const after = (await layout(page)).lg;
    const revenue = after.find((item: { id: string }) => item.id === "revenue");
    expect(revenue.x).toBeGreaterThanOrEqual(5);
    await expect(page.getByTestId("revenue")).not.toHaveClass(/--placeholder/);
    // The frame is back in its cell.
    const cell = await box(page.getByTestId("revenue"));
    const frame = await box(
      page.getByTestId("revenue").locator(".bx--dashboard-grid__frame"),
    );
    expect(frame.x).toBeCloseTo(cell.x, 0);
    expect(frame.y).toBeCloseTo(cell.y, 0);
  });

  test("a press in the body does not start a drag", async ({ page }) => {
    const body = await box(page.getByTestId("revenue"));
    await page.mouse.move(body.x + 100, body.y + 120);
    await page.mouse.down();
    await page.mouse.move(body.x + 500, body.y + 220, { steps: 6 });
    await expect(page.getByTestId("revenue")).not.toHaveClass(/--placeholder/);
    await page.mouse.up();
    await expect(page.getByTestId("log")).toHaveText("");
  });

  test("resizes from the corner and snaps to cells", async ({ page }) => {
    const notes = page.getByTestId("orders");
    const b = await box(notes);
    await page.mouse.move(b.x + b.width - 4, b.y + b.height - 4);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width - 4 - 120, b.y + b.height + 100, {
      steps: 8,
    });
    await page.mouse.up();
    await expect(page.getByTestId("log")).toContainText("resize:pointer:lg:");
    const item = (await layout(page)).lg.find(
      (i: { id: string }) => i.id === "orders",
    );
    expect(item.w).toBeLessThan(5);
    expect(item.h).toBeGreaterThan(2);
  });

  test("refuses a change when layoutchange is prevented", async ({ page }) => {
    await page.getByTestId("prevent").check();
    const before = await layout(page);
    const grabber = await box(handle(page, "Revenue"));
    const orders = await box(page.getByTestId("orders"));
    await page.mouse.move(grabber.x + 8, grabber.y + 8);
    await page.mouse.down();
    await page.mouse.move(orders.x + 40, orders.y + 20, { steps: 8 });
    await page.mouse.up();
    await expect(page.getByTestId("log")).toContainText("move:pointer");
    expect(await layout(page)).toEqual(before);
    const revenue = await box(page.getByTestId("revenue"));
    const grid = await box(page.getByTestId("grid"));
    expect(revenue.x).toBeCloseTo(grid.x, 0);
  });

  test("Escape cancels a drag", async ({ page }) => {
    const grabber = await box(handle(page, "Revenue"));
    const orders = await box(page.getByTestId("orders"));
    await page.mouse.move(grabber.x + 8, grabber.y + 8);
    await page.mouse.down();
    await page.mouse.move(orders.x + 40, orders.y + 20, { steps: 8 });
    await page.keyboard.press("Escape");
    await page.mouse.up();
    await expect(page.getByTestId("log")).toHaveText("");
    await expect(page.getByTestId("revenue")).not.toHaveClass(/--placeholder/);
  });

  test("gives a static widget no handle", async ({ page }) => {
    await expect(handle(page, "Pinned")).toHaveCount(0);
    await expect(
      page.getByTestId("pinned").locator(".bx--dashboard-grid__resize"),
    ).toHaveCount(0);
  });

  test("hides the handles and edges when dragging and resizing are off", async ({
    page,
  }) => {
    await page.getByTestId("draggable").uncheck();
    await page.getByTestId("resizable").uncheck();
    await expect(page.locator(".bx--dashboard-grid__handle")).toHaveCount(0);
    await expect(page.locator(".bx--dashboard-grid__resize")).toHaveCount(0);
  });

  test.describe("keyboard", () => {
    test("picks up, moves, announces and drops", async ({ page }) => {
      const status = page.locator("[data-testid=grid] > [role=status]");
      await handle(page, "Revenue").focus();
      await page.keyboard.press("Enter");
      await expect(status).toHaveText("Picked up Revenue, column 1, row 1.");

      await page.keyboard.press("ArrowRight");
      await expect(status).toHaveText(/^Moved Revenue to column 2, row 1\./);
      await expect(page.getByTestId("log")).toHaveText("");
      await page.keyboard.press("Enter");
      await expect(status).toHaveText(/^Dropped Revenue at column 2, row 1\./);
      await expect(page.getByTestId("log")).toContainText("move:keyboard:lg:");
      expect(
        (await layout(page)).lg.find((i: { id: string }) => i.id === "revenue"),
      ).toMatchObject({ x: 1, y: 0 });
      await expect(handle(page, "Revenue")).toBeFocused();
    });

    test("Shift and the arrows resize, Escape cancels", async ({ page }) => {
      const status = page.locator("[data-testid=grid] > [role=status]");
      await handle(page, "Revenue").focus();
      await page.keyboard.press("Space");
      await page.keyboard.press("Shift+ArrowRight");
      await expect(status).toHaveText(
        "Resized Revenue to 7 columns wide, 3 rows high.",
      );
      await page.keyboard.press("Shift+ArrowDown");
      await expect(status).toHaveText(
        /^Resized Revenue to 7 columns wide, 4 rows high\./,
      );
      await page.keyboard.press("Escape");
      await expect(status).toHaveText(
        /^Cancelled\. Revenue is back at column 1, row 1\./,
      );
      await expect(page.getByTestId("log")).toHaveText("");
      const b = await box(page.getByTestId("revenue"));
      expect(b.height).toBeCloseTo(3 * 96 + 2 * 16, 0);
    });

    test("announces when a move is blocked", async ({ page }) => {
      const status = page.locator("[data-testid=grid] > [role=status]");
      await handle(page, "Revenue").focus();
      await page.keyboard.press("Enter");
      await page.keyboard.press("ArrowLeft");
      await expect(status).toHaveText(/cannot move any further/);
    });

    test("Escape does not leave the page's other handlers to close things", async ({
      page,
    }) => {
      await page.evaluate(() => {
        window.addEventListener("keydown", (event) => {
          if (event.key === "Escape")
            document.body.setAttribute("data-escaped", "");
        });
      });
      await handle(page, "Revenue").focus();
      await page.keyboard.press("Enter");
      await page.keyboard.press("Escape");
      await expect(page.locator("body")).not.toHaveAttribute("data-escaped");
    });

    test("swaps the inline arrows in RTL", async ({ page }) => {
      await page.evaluate(() => {
        document.documentElement.dir = "rtl";
      });
      const before = await box(page.getByTestId("revenue"));
      await handle(page, "Revenue").focus();
      await page.keyboard.press("Enter");
      // Toward the inline end is physically left in RTL, so revenue (at the
      // right edge) moves left with ArrowLeft.
      await page.keyboard.press("ArrowLeft");
      await expect(
        page.locator("[data-testid=grid] > [role=status]"),
      ).toHaveText(/^Moved Revenue to column 2, row 1\./);
      await expect
        .poll(async () => (await box(page.getByTestId("revenue"))).x)
        .toBeLessThan(before.x);
    });
  });

  test("follows the pointer to the left in RTL", async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const grid = await box(page.getByTestId("grid"));
    const revenue = await box(page.getByTestId("revenue"));
    // Mirrored: revenue sits at the right edge.
    expect(revenue.x + revenue.width).toBeCloseTo(grid.x + grid.width, 0);
    const grabber = await box(handle(page, "Revenue"));
    const orders = await box(page.getByTestId("orders"));
    await page.mouse.move(grabber.x + 8, grabber.y + 8);
    await page.mouse.down();
    await page.mouse.move(orders.x + 40, orders.y + 20, { steps: 8 });
    await page.mouse.up();
    const item = (await layout(page)).lg.find(
      (i: { id: string }) => i.id === "revenue",
    );
    expect(item.x).toBeGreaterThanOrEqual(5);
  });

  test("uses the layout of the breakpoint", async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 800 });
    // md: 8 columns, derived from lg.
    const grid = await box(page.getByTestId("grid"));
    const revenue = await box(page.getByTestId("revenue"));
    expect(revenue.width).toBeLessThanOrEqual(grid.width);
    await page.setViewportSize({ width: 300, height: 800 });
    // sm: the given layout stacks full-width.
    const sm = await box(page.getByTestId("grid"));
    const stacked = await box(page.getByTestId("orders"));
    expect(stacked.width).toBeCloseTo(sm.width, 0);
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test("a move at a breakpoint changes that layout only", async ({ page }) => {
    await page.setViewportSize({ width: 300, height: 800 });
    await expect
      .poll(() =>
        page
          .getByTestId("grid")
          .evaluate(
            (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
          ),
      )
      .toBe(4);
    // The breakpoint is read when the move starts, so a press right after
    // the resize edits the layout the user sees.
    await handle(page, "Orders").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-testid=grid] > [role=status]")).toHaveText(
      /Picked up Orders, column 1, row 4/,
    );
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("log")).toContainText("move:keyboard:sm:");
    const after = await layout(page);
    expect(after.lg).toBeDefined();
    expect(
      after.lg.find((i: { id: string }) => i.id === "orders"),
    ).toMatchObject({ x: 6, y: 0 });
    expect(
      after.sm.find((i: { id: string }) => i.id === "orders").y,
    ).toBeLessThan(3);
  });

  test("slides the widget that gives way, and not under reduced motion", async ({
    page,
  }) => {
    async function slides(reduced: boolean) {
      await page.emulateMedia({
        reducedMotion: reduced ? "reduce" : "no-preference",
      });
      await handle(page, "Orders").focus();
      await page.keyboard.press("Enter");
      // Swap places with revenue, which slides to orders' cell.
      await page.keyboard.press("ArrowLeft");
      const running = await page
        .getByTestId("revenue")
        .evaluate((el) => el.getAnimations().length);
      await page.keyboard.press("Escape");
      await page.evaluate(() =>
        Promise.all(document.getAnimations().map((a) => a.finished)),
      );
      return running;
    }
    expect(await slides(false)).toBeGreaterThan(0);
    expect(await slides(true)).toBe(0);
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    const idle = await new AxeBuilder({ page }).include("#app").analyze();
    expect(idle.violations).toEqual([]);

    await handle(page, "Revenue").focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("ArrowRight");
    const lifted = await new AxeBuilder({ page }).include("#app").analyze();
    expect(lifted.violations).toEqual([]);
    await page.keyboard.press("Escape");

    await page.evaluate(() => {
      document.documentElement.classList.add("bx--g100");
    });
    // Axe reads colors mid-transition otherwise.
    await page.evaluate(() =>
      Promise.all(document.getAnimations().map((a) => a.finished)),
    );
    const dark = await new AxeBuilder({ page }).include("#app").analyze();
    expect(dark.violations).toEqual([]);
  });

  test("keeps the placeholder and the handles visible in forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    const grabber = await box(handle(page, "Revenue"));
    const orders = await box(page.getByTestId("orders"));
    await page.mouse.move(grabber.x + 8, grabber.y + 8);
    await page.mouse.down();
    await page.mouse.move(orders.x + 40, orders.y + 20, { steps: 8 });
    const outline = await page
      .getByTestId("revenue")
      .evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).toBe("dashed");
    // The card that follows the pointer keeps an outline, since its shadow
    // and fill are gone.
    const lifted = await page
      .getByTestId("revenue")
      .locator(".bx--dashboard-grid__frame")
      .evaluate((el) => {
        const s = getComputedStyle(el);
        return [s.outlineStyle, s.outlineWidth];
      });
    expect(lifted).toEqual(["solid", "2px"]);
    const corner = await page
      .getByTestId("orders")
      .locator(".bx--dashboard-grid__resize--corner")
      .evaluate((el) => {
        const s = getComputedStyle(el, "::after");
        return [s.borderBottomStyle, s.borderBottomWidth];
      });
    expect(corner).toEqual(["solid", "2px"]);
    await page.mouse.up();
  });
});
