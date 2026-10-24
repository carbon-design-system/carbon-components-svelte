import { expect, test } from "./helpers/host";

test("TagSet reaches every tag from the keyboard through View all", async ({
  page,
}) => {
  await page.goto("/tag-set-view-all.html");
  const indicator = page.getByRole("button", { name: "+12 more tags" });

  await indicator.focus();
  await page.keyboard.press("Enter");
  const viewAll = page.getByRole("button", { name: "View all" });
  await expect(viewAll).toBeVisible();
  await viewAll.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog", { name: "All tags" });
  await expect(dialog).toBeVisible();
  const search = dialog.getByRole("searchbox");
  await expect(search).toBeFocused();
  await page.keyboard.type("jp-");
  await expect(dialog.getByRole("listitem")).toHaveText(["jp-tok", "jp-osa"]);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(indicator).toBeFocused();
});

test("TagSet lays out View all and its modal from the right in RTL", async ({
  page,
}) => {
  await page.goto("/tag-set-view-all.html?rtl");
  const indicator = page.getByRole("button", { name: "+12 more tags" });
  const firstTag = page.getByTestId("set").locator(".bx--tag").first();
  const [first, plus] = await Promise.all([
    firstTag.boundingBox(),
    indicator.boundingBox(),
  ]);
  if (!first || !plus) throw new Error("not laid out");
  expect(plus.x).toBeLessThan(first.x);

  await indicator.click();
  await page.getByRole("button", { name: "View all" }).click();
  const items = page
    .getByRole("dialog", { name: "All tags" })
    .getByRole("listitem");
  await expect(items).toHaveCount(14);
  const [a, b] = await Promise.all([
    items.nth(0).boundingBox(),
    items.nth(1).boundingBox(),
  ]);
  if (!a || !b) throw new Error("not laid out");
  expect(b.x).toBeLessThan(a.x);
});
