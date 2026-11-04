import { expect, test } from "./helpers/host";

test.describe("Breadcrumb", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/breadcrumb.html");
  });

  test("renders breadcrumb", async ({ page }) => {
    await expect(page.getByTestId("breadcrumb")).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }),
    ).toBeVisible();
  });

  test("displays breadcrumb items", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Annual reports" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "2019", current: "page" }),
    ).toBeVisible();
  });

  test("can be located by getByLabel", async ({ page }) => {
    const nav = page.getByLabel("Breadcrumb");
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: "Dashboard" })).toBeVisible();
  });
});

// An item longer than the trail wraps inside it rather than running past
// the trail's edge, and short items still don't wrap.
test("wraps an item too long for a narrow trail", async ({ page }) => {
  await page.goto("/breadcrumb.html");
  const trail = page.getByTestId("narrow");
  const edge = await trail.evaluate((el) => el.getBoundingClientRect().right);
  for (const link of await trail.getByRole("link").all()) {
    const box = await link.boundingBox();
    expect(box && box.x + box.width).toBeLessThanOrEqual(edge + 1);
  }
  const [projects, sentence] = await Promise.all([
    trail.getByRole("link", { name: "Projects" }).boundingBox(),
    trail.getByRole("link", { name: /^Replicate/ }).boundingBox(),
  ]);
  expect(projects?.height).toBeLessThan(24);
  expect(sentence?.height).toBeGreaterThan(24);
});
