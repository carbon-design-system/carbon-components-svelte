import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

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

// Every check only reads layout, so each loads the fixture once.
test("SideNavMenu nests each level one step past its parent", async ({
  page,
}) => {
  await page.goto("/side-nav-menu-nested.html");

  // First-level rows keep Carbon's offsets.
  for (const [name, read, expected] of [
    ["Kubernetes", iconLeft, 16],
    ["Kubernetes", textLeft, 56],
    ["Clusters", textLeft, 72],
    ["Storage", textLeft, 16],
    ["Volumes", textLeft, 32],
  ] as const) {
    expect.soft(await read(page, name), name).toBeCloseTo(expected, 0);
  }

  for (const [parent, child] of [
    ["Kubernetes", "Clusters"],
    ["Workloads", "Pods"],
    ["Controllers", "Deployments"],
    ["Storage", "Volumes"],
    ["Backups", "Schedules"],
  ]) {
    const [childLeft, parentLeft] = await Promise.all([
      textLeft(page, child),
      textLeft(page, parent),
    ]);
    expect
      .soft(childLeft, `${child} text starts one step past ${parent} text`)
      .toBeCloseTo(parentLeft + 16, 0);
  }

  for (const [item, sibling] of [
    ["Workloads", "Clusters"],
    ["Rollouts", "Clusters"],
    ["Backups", "Volumes"],
  ]) {
    const [icon, column] = await Promise.all([
      iconLeft(page, item),
      textLeft(page, sibling),
    ]);
    expect
      .soft(icon, `${item} icon sits in the ${sibling} text column`)
      .toBeCloseTo(column, 0);
  }
});

test("SideNavMenu large applies to its own row only", async ({ page }) => {
  await page.goto("/side-nav-menu-nested.html");

  for (const [name, height] of [
    // A large top-level menu trigger.
    ["Compute", 48],
    // Descendants do not inherit large from the ancestor menu.
    ["Instances", 32],
    ["Images", 32],
    ["Snapshots", 32],
    // A nested SideNavLink can set large itself.
    ["Custom image", 48],
  ] as const) {
    expect.soft(await rowHeight(page, name), name).toBeCloseTo(height, 0);
  }
});
