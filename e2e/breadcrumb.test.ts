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

// `overflow="menu"` keeps one line: the middle items that don't fit move
// into a menu after the first item, in focus order, with their links.
for (const dir of ["ltr", "rtl"]) {
  test(`collapses middle items into a menu (${dir})`, async ({ page }) => {
    await page.goto("/breadcrumb.html");
    await page.evaluate((d) => {
      document.documentElement.dir = d;
    }, dir);
    const trail = page.getByTestId("overflow-menu");
    const trigger = trail.getByRole("button", {
      name: "Show hidden levels",
    });
    await expect(trigger).toBeVisible();
    await expect(
      trail.getByRole("link", { name: "Finance team" }),
    ).toBeHidden();
    await expect(trail.getByRole("link", { name: "Q4 close" })).toBeVisible();

    const [home, button, current, box] = await Promise.all([
      trail.getByRole("link", { name: "Workspaces" }).boundingBox(),
      trigger.boundingBox(),
      trail.getByRole("link", { name: "Europe" }).boundingBox(),
      trail.boundingBox(),
    ]);
    if (!home || !button || !current || !box) throw new Error("box");
    // One line, inside the trail, with the button after the first item.
    expect(Math.abs(home.y - current.y)).toBeLessThan(4);
    expect(current.x).toBeGreaterThanOrEqual(box.x - 1);
    expect(current.x + current.width).toBeLessThanOrEqual(
      box.x + box.width + 1,
    );
    if (dir === "rtl") expect(button.x).toBeLessThan(home.x);
    else expect(button.x).toBeGreaterThan(home.x);

    await trail.getByRole("link", { name: "Workspaces" }).focus();
    await page.keyboard.press("Tab");
    await expect(trigger).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("menuitem", { name: "Finance team" }),
    ).toHaveAttribute("href", "/finance");
    await expect(
      page.getByRole("menuitem", { name: "Ledgers" }),
    ).toHaveAttribute("href", "/finance/ledgers");
  });
}
