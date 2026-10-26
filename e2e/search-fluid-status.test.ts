import { expect, test } from "./helpers/host";

/**
 * A fluid Search's invalid or warning message sits inside the field,
 * under a divider, with the status icon on its first line, as on fluid
 * TextInput. The icon used to sit on the clear button like a badge.
 */
test("a fluid Search's status icon sits on its message, clear of the clear button", async ({
  page,
}) => {
  await page.goto("/search-fluid-status.html");

  for (const id of ["search-invalid", "search-warn"]) {
    const box = page.getByTestId(id);
    const search = box.locator(".bx--search");
    const field = await search.boundingBox();
    const icon = await box.locator(".bx--search__invalid-icon").boundingBox();
    const close = await box.locator(".bx--search-close").boundingBox();
    const message = box.locator(".bx--search .bx--form-requirement");
    await expect.soft(message, `${id} message inside the field`).toBeVisible();
    const line = await message.evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const r = range.getClientRects()[0];
      return (r.top + r.bottom) / 2;
    });
    if (!field || !icon || !close) continue;

    expect
      .soft(icon.y, `${id} icon below the clear button`)
      .toBeGreaterThanOrEqual(close.y + close.height);
    // Within a pixel: the text's line box rounds differently by browser.
    expect
      .soft(
        Math.abs(icon.y + icon.height / 2 - line),
        `${id} icon on the message's line`,
      )
      .toBeLessThanOrEqual(1);
    expect
      .soft(field.x + field.width - (icon.x + icon.width), `${id} icon inset`)
      .toBeCloseTo(16, 0);
  }

  // Nothing outside the field.
  await expect(
    page.locator("[data-testid=search-invalid] > .bx--form-requirement"),
  ).toHaveCount(0);
});
