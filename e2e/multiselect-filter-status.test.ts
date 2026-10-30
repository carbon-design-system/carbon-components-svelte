import { expect, test } from "./helpers/host";

test("a filterable MultiSelect keeps its status icon clear of the clear-query button", async ({
  page,
}) => {
  await page.goto("/multiselect-filter-status.html");
  await page.evaluate(() => document.fonts.ready);

  // ComboBox is the reference: its icon already sits left of the button.
  for (const name of ["invalid", "warn", "decorator", "combo"]) {
    const scope = page.getByTestId(name);
    // biome-ignore lint/performance/noAwaitInLoops: one menu opens at a time
    await scope.getByRole("combobox").fill("a");
    const clear = scope.locator(".bx--list-box__selection");
    await expect(clear).toBeVisible();

    const [iconBox, clearBox] = await Promise.all([
      scope.locator(".bx--list-box__invalid-icon").boundingBox(),
      clear.boundingBox(),
    ]);
    if (!iconBox || !clearBox) throw new Error(`No box: ${name}`);
    expect
      .soft(iconBox.x + iconBox.width, name)
      .toBeLessThanOrEqual(clearBox.x);
  }
});
