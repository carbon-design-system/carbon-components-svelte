import { expect, type Locator, type Page, test } from "@playwright/test";

// Menus render as buttons, items and links as links.
const menus = new Set([
  "Kubernetes",
  "Workloads",
  "Controllers",
  "Storage",
  "Backups",
  "Compute",
  "Images",
]);

function row(page: Page, name: string) {
  return page
    .getByRole("navigation", { name: "Side navigation" })
    .getByRole(menus.has(name) ? "button" : "link", { name, exact: true });
}

async function left(page: Page, locator: Locator) {
  const nav = await page
    .getByRole("navigation", { name: "Side navigation" })
    .boundingBox();
  const box = await locator.boundingBox();
  if (!nav || !box) throw new Error("element is not rendered");
  return box.x - nav.x;
}

function textLeft(page: Page, name: string) {
  return left(
    page,
    row(page, name).locator(
      ".bx--side-nav__submenu-title, .bx--side-nav__link-text",
    ),
  );
}

function iconLeft(page: Page, name: string) {
  return left(
    page,
    row(page, name).locator(
      ".bx--side-nav__icon:not(.bx--side-nav__submenu-chevron)",
    ),
  );
}

async function rowHeight(page: Page, name: string) {
  const box = await row(page, name).boundingBox();
  if (!box) throw new Error("element is not rendered");
  return box.height;
}

test.describe("SideNavMenu nested indentation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/side-nav-menu-nested.html");
  });

  test("first-level rows keep Carbon's offsets", async ({ page }) => {
    expect(await iconLeft(page, "Kubernetes")).toBeCloseTo(16, 0);
    expect(await textLeft(page, "Kubernetes")).toBeCloseTo(56, 0);
    expect(await textLeft(page, "Clusters")).toBeCloseTo(72, 0);
    expect(await textLeft(page, "Storage")).toBeCloseTo(16, 0);
    expect(await textLeft(page, "Volumes")).toBeCloseTo(32, 0);
  });

  for (const [parent, child] of [
    ["Kubernetes", "Clusters"],
    ["Workloads", "Pods"],
    ["Controllers", "Deployments"],
    ["Storage", "Volumes"],
    ["Backups", "Schedules"],
  ]) {
    test(`${child} text starts one step past ${parent} text`, async ({
      page,
    }) => {
      expect(await textLeft(page, child)).toBeCloseTo(
        (await textLeft(page, parent)) + 16,
        0,
      );
    });
  }

  for (const [item, sibling] of [
    ["Workloads", "Clusters"],
    ["Rollouts", "Clusters"],
    ["Backups", "Volumes"],
  ]) {
    test(`${item} icon sits in the ${sibling} text column`, async ({
      page,
    }) => {
      expect(await iconLeft(page, item)).toBeCloseTo(
        await textLeft(page, sibling),
        0,
      );
    });
  }
});

test.describe("SideNavMenu large scoped to its own row", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/side-nav-menu-nested.html");
  });

  test("a large top-level menu trigger is 48px", async ({ page }) => {
    expect(await rowHeight(page, "Compute")).toBeCloseTo(48, 0);
  });

  for (const name of ["Instances", "Images", "Snapshots"]) {
    test(`${name} does not inherit large from its ancestor menu`, async ({
      page,
    }) => {
      expect(await rowHeight(page, name)).toBeCloseTo(32, 0);
    });
  }

  test("a nested SideNavLink can set large itself", async ({ page }) => {
    expect(await rowHeight(page, "Custom image")).toBeCloseTo(48, 0);
  });
});
