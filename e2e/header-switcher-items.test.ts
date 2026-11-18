import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test("lists the items under their group headings, with the current one marked", async ({
  page,
}) => {
  await page.goto("/header-switcher-items.html");
  const accounts = page.getByRole("group", { name: "Accounts" });
  await expect(accounts.getByRole("button")).toHaveCount(7);
  await expect(page.getByRole("group", { name: "Apps" })).toBeVisible();
  const current = page.locator("[aria-current='true']");
  await expect(current).toHaveCount(1);
  await expect(current).toContainText("Acme Corp");
});

test("has no detectable accessibility violations", async ({ page }) => {
  await page.goto("/header-switcher-items.html?detail");
  await expect(page.getByRole("search")).toBeVisible();
  const results = await new AxeBuilder({ page }).include("#app").analyze();
  expect(results.violations).toEqual([]);
});

test("filters as you type, ignoring accents, and says how many matched", async ({
  page,
}) => {
  await page.goto("/header-switcher-items.html");
  const search = page.getByRole("searchbox", { name: "Search accounts" });
  await search.fill("zoe");
  await expect(page.locator(".bx--profile-menu__item")).toHaveCount(2); // Zoë + footer item
  await expect(page.getByRole("status")).toHaveText("1 account found");
  await search.fill("zzz");
  await expect(page.getByText("No accounts found").first()).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("No accounts found");
});

test("moves focus between the field and the items with the arrow keys", async ({
  page,
}) => {
  await page.goto("/header-switcher-items.html");
  const search = page.getByRole("searchbox");
  await search.focus();
  await search.fill("o");
  await page.keyboard.press("ArrowDown");
  const first = page.locator(".bx--profile-menu__item").first();
  await expect(first).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(search).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(page.locator(".bx--profile-menu__item").last()).toBeFocused();
});

test("Enter on the trigger opens the menu with focus in the filter field", async ({
  page,
}) => {
  await page.goto("/header-switcher-items.html");
  await page.keyboard.press("Escape");
  const trigger = page.locator(".bx--header-switcher__trigger");
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("searchbox")).toBeFocused();
});

test("typing on an item types into the field", async ({ page }) => {
  await page.goto("/header-switcher-items.html");
  await page.getByRole("button", { name: /Globex/ }).focus();
  await page.keyboard.type("hoo");
  const search = page.getByRole("searchbox");
  await expect(search).toBeFocused();
  await expect(search).toHaveValue("hoo");
  await expect(page.getByRole("button", { name: /Hooli/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Globex/ })).toHaveCount(0);
});

test("Escape clears the field, then closes the menu", async ({ page }) => {
  await page.goto("/header-switcher-items.html");
  const search = page.getByRole("searchbox");
  await search.fill("glo");
  await page.keyboard.press("Escape");
  await expect(search).toHaveValue("");
  await expect(search).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(search).toHaveCount(0);
  await expect(page.locator(".bx--header-switcher__trigger")).toBeFocused();
});

test("choosing an item selects it and closes the menu", async ({ page }) => {
  await page.goto("/header-switcher-items.html");
  await page.getByRole("button", { name: /Initech/ }).click();
  await expect(page.locator("#selected")).toHaveText("initech");
  await expect(page.locator("#last")).toHaveText("initech");
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  await expect(page.locator(".bx--header-switcher__text")).toHaveText(
    "Initech",
  );
});

test("a short list has no field and jumps to the item that starts with the typed letters", async ({
  page,
}) => {
  await page.goto("/header-switcher-items.html?threshold=100");
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  const item = (name: string) =>
    page.locator(".bx--profile-menu__item", { hasText: name });
  await item("Acme").focus();
  await page.keyboard.type("i");
  await expect(item("Initech")).toBeFocused();
  // A longer prefix keeps the item that still matches it.
  await page.keyboard.type("n");
  await expect(item("Initech")).toBeFocused();
  await page.keyboard.type("itr");
  await expect(item("Initrode")).toBeFocused();
});

test("a name that is cut off shows in full on hover", async ({ page }) => {
  await page.goto("/header-switcher-items.html");
  const name = page.locator(".bx--header-switcher__item-text", {
    hasText: "Umbrella",
  });
  await name.hover();
  await expect(name).toHaveAttribute(
    "title",
    "Umbrella Regional Distribution & Logistics Cooperative",
  );
  const short = page.locator(".bx--header-switcher__item-text", {
    hasText: "Hooli",
  });
  await short.hover();
  await expect(short).not.toHaveAttribute("title");
});

test("the menu stays inside a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 600 });
  await page.goto("/header-switcher-items.html");
  const box = await page.locator(".bx--header-switcher__menu").boundingBox();
  expect(box?.x).toBeGreaterThanOrEqual(0);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(320);
});

test("the menu opens from the trigger's end edge in a right-to-left page", async ({
  page,
}) => {
  await page.goto("/header-switcher-items.html");
  await page.evaluate(() =>
    document.documentElement.setAttribute("dir", "rtl"),
  );
  const trigger = await page
    .locator(".bx--header-switcher__trigger")
    .boundingBox();
  const menu = await page.locator(".bx--header-switcher__menu").boundingBox();
  expect((menu?.x ?? 0) + (menu?.width ?? 0)).toBeCloseTo(
    (trigger?.x ?? 0) + (trigger?.width ?? 0),
    0,
  );
});

const trigger = (page: import("@playwright/test").Page) =>
  page.locator(".bx--header-switcher__trigger");
const row = (page: import("@playwright/test").Page, name: string) =>
  page.locator(".bx--profile-menu__item", { hasText: name });

test("lists the accounts you left under Recent, and keeps them across a reload", async ({
  page,
}) => {
  await page.goto("/header-switcher-items.html?recent");
  const recent = page.getByRole("group", { name: "Recent" });
  await expect(recent).toHaveCount(0);

  await row(page, "Initech").click();
  await trigger(page).click();
  await expect(recent.locator(".bx--profile-menu__item")).toHaveCount(1);
  await expect(recent).toContainText("Acme Corp");
  // It left its own group, so a screen reader reads it once.
  await expect(row(page, "Acme Corp")).toHaveCount(1);

  await row(page, "Globex").click();
  await trigger(page).click();
  await expect(recent.locator(".bx--profile-menu__item")).toHaveCount(2);
  await expect(recent.locator(".bx--profile-menu__item").first()).toContainText(
    "Initech",
  );

  // A reload keeps storage and starts on Acme again, which leaves the list.
  await page.reload();
  await expect(recent.locator(".bx--profile-menu__item")).toHaveCount(1);
  await expect(recent).toContainText("Initech");
});

test("filtering lists every match under its own group, without Recent", async ({
  page,
}) => {
  await page.goto("/header-switcher-items.html?recent");
  await row(page, "Initech").click();
  await trigger(page).click();
  await page.getByRole("searchbox").fill("acme");
  await expect(page.getByRole("group", { name: "Recent" })).toHaveCount(0);
  await expect(
    page
      .getByRole("group", { name: "Accounts" })
      .locator(".bx--profile-menu__item"),
  ).toHaveCount(1);
});

test("shows placeholder rows while loading, then the accounts", async ({
  page,
}) => {
  await page.goto("/header-switcher-items.html?load=ok");
  await trigger(page).click();
  const menu = page.locator(".bx--header-switcher__menu");
  await expect(menu).toHaveAttribute("aria-busy", "true");
  await expect(menu.locator(".bx--header-switcher__skeleton")).toHaveCount(3);
  await expect(page.getByRole("status")).toHaveText("Loading accounts");
  await expect(row(page, "Acme Corp")).toBeVisible();
  await expect(menu).not.toHaveAttribute("aria-busy");
  await expect(menu.locator(".bx--header-switcher__skeleton")).toHaveCount(0);
});

test("says it failed, retries from a row, and keeps focus inside the menu", async ({
  page,
}) => {
  await page.goto("/header-switcher-items.html?load=fail");
  await trigger(page).click();
  await expect(page.locator(".bx--header-switcher__error")).toHaveText(
    "Could not load accounts",
  );
  await expect(page.getByRole("status")).toHaveText("Could not load accounts");

  const retry = row(page, "Retry");
  await retry.focus();
  await page.keyboard.press("Enter");
  // The menu stays open and takes focus from the row that is going away.
  const menu = page.locator(".bx--header-switcher__menu");
  await expect(menu).toBeFocused();
  await expect(row(page, "Acme Corp")).toBeVisible();
  await expect(page.locator(".bx--header-switcher__error")).toHaveCount(0);
  await page.keyboard.press("ArrowDown");
  await expect(page.locator(".bx--profile-menu__item").first()).toBeFocused();
});

test("has no detectable accessibility violations while loading or failed", async ({
  page,
}) => {
  await page.goto("/header-switcher-items.html?load=fail");
  await trigger(page).click();
  await expect(page.locator(".bx--header-switcher__skeleton")).toHaveCount(3);
  let results = await new AxeBuilder({ page }).include("#app").analyze();
  expect(results.violations).toEqual([]);

  await expect(page.locator(".bx--header-switcher__error")).toBeVisible();
  results = await new AxeBuilder({ page }).include("#app").analyze();
  expect(results.violations).toEqual([]);
});
