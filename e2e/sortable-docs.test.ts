import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const texts = (locator: Locator) =>
  locator.evaluateAll((nodes) =>
    nodes.map((node) => node.textContent?.replace(/\s+/g, " ").trim()),
  );

async function center(locator: Locator, fraction = 0.5) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("missing box");
  return { x: box.x + box.width / 2, y: box.y + box.height * fraction };
}

/** Rows slide for 150 ms after a drop, which moves what a drag aims at. */
const settled = (page: Page) =>
  page.evaluate(() =>
    Promise.all(
      document.getAnimations().map((animation) => animation.finished),
    ),
  );

async function dragBetween(page: Page, from: Locator, to: Locator) {
  await from.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await settled(page);
  const start = await center(from);
  // The upper part of the target, which drops the item before it.
  const end = await center(to, 0.2);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 3, start.y + 8, { steps: 2 });
  await page.mouse.move(end.x, end.y, { steps: 10 });
}

test.describe("sortable docs examples", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sortable-docs.html");
  });

  test("ContainedList: reorders by keyboard and by pointer", async ({
    page,
  }) => {
    const root = page.getByTestId("basic");
    const rows = root.locator(".bx--contained-list-item");

    await root.getByRole("button", { name: "Reorder auth-service" }).focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Space");
    expect((await texts(rows)).map((text) => text?.split(" ")[0])).toEqual([
      "billing-worker",
      "auth-service",
      "search-indexer",
      "notification-relay",
      "report-builder",
    ]);

    await dragBetween(
      page,
      root.getByRole("button", { name: "Reorder report-builder" }),
      rows.nth(0),
    );
    await page.mouse.up();
    expect((await texts(rows))[0]?.split(" ")[0]).toBe("report-builder");
  });

  test("ContainedList: moves a task between connected lists", async ({
    page,
  }) => {
    const root = page.getByTestId("groups");
    const lists = root.locator(".bx--contained-list");

    await root.getByRole("button", { name: "Reorder Rotate API keys" }).focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("status")).toContainText(
      "Rotate API keys moved to Backlog, position 1 of 4.",
    );
    await page.keyboard.press("End");
    await page.keyboard.press("Space");
    await expect(lists.nth(0).locator(".bx--contained-list-item")).toHaveCount(
      4,
    );
    await expect(lists.nth(1).locator(".bx--contained-list-item")).toHaveCount(
      0,
    );

    await dragBetween(
      page,
      root.getByRole("button", { name: "Reorder Rotate API keys" }),
      lists.nth(1),
    );
    await page.mouse.up();
    await expect(lists.nth(1).locator(".bx--contained-list-item")).toHaveCount(
      1,
    );
  });

  test("ContainedList: a prevented sort leaves the order alone", async ({
    page,
  }) => {
    const root = page.getByTestId("pinned");
    const rows = root.locator(".bx--contained-list-item");

    await root.getByRole("button", { name: "Reorder eu-de" }).focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Space");

    await expect(page.getByRole("status")).toContainText("Cancelled. eu-de");
    expect((await texts(rows))[0]).toMatch(/^us-south \(primary\)/);
    await expect(
      root.getByRole("button", { name: "Reorder eu-de" }),
    ).toBeFocused();
  });

  test("ContainedList: reorders a windowed list and keeps the rows few", async ({
    page,
  }) => {
    const root = page.getByTestId("virtual");
    const rows = root.locator(".bx--contained-list-item");
    expect(await rows.count()).toBeLessThan(20);

    await rows.first().focus();
    await page.keyboard.press("Space");
    await expect(page.getByRole("status")).toHaveText(
      "Picked up INC-0001, position 1 of 1000.",
    );
    await page.keyboard.press("End");
    await page.keyboard.press("Space");

    await expect(root.getByText("INC-0001:", { exact: false })).toBeVisible();
    await expect(root.locator("[aria-posinset='1000']")).toContainText(
      "INC-0001",
    );
  });

  test("DataTable: reorders rows without touching the table", async ({
    page,
  }) => {
    const root = page.getByTestId("table");
    const body = root.locator("tbody tr");

    await root.getByRole("button", { name: "Reorder Allow HTTPS" }).focus();
    await page.keyboard.press("Space");
    await expect(page.getByRole("status")).toHaveText(
      "Picked up Allow HTTPS, position 1 of 5.",
    );
    await page.keyboard.press("End");
    await page.keyboard.press("Space");
    await expect(body.last()).toContainText("Allow HTTPS");

    await dragBetween(
      page,
      root.getByRole("button", { name: "Reorder Deny all" }),
      body.nth(0),
    );
    await page.mouse.up();
    await expect(body.nth(0)).toContainText("Deny all");
    await expect(body.last()).toContainText("Allow HTTPS");
  });

  for (const theme of ["white", "g100"]) {
    test(`has no axe violations on ${theme}, idle and lifted`, async ({
      page,
    }) => {
      await page.evaluate((name) => {
        document.documentElement.classList.toggle("bx--g100", name === "g100");
      }, theme);
      // The theme change fades colors, and axe reads them mid-fade.
      await settled(page);
      const root = page.getByTestId("table");

      const idle = await new AxeBuilder({ page }).include("#app").analyze();
      expect(idle.violations).toEqual([]);

      await root.getByRole("button", { name: "Reorder Allow HTTPS" }).focus();
      await page.keyboard.press("Space");
      await page.keyboard.press("ArrowDown");
      const lifted = await new AxeBuilder({ page }).include("#app").analyze();
      expect(lifted.violations).toEqual([]);
    });
  }
});
