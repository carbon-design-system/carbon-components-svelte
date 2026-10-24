import { expect, test } from "@playwright/test";

// An inline select's status icon sits between the value and the chevron,
// and the label lines up with the field, not with the field and message.
// Both held for invalid only: the warning icon drew over the value and the
// label centered on the field and its message.
test("inline select lays out warn like invalid", async ({ page }) => {
  await page.goto("/select-inline-status.html");
  await expect(page.locator(".bx--select__invalid-icon")).toHaveCount(2);

  const cases = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[data-status]")].map(
      (status) => {
        const rect = (selector: string) => {
          const element = status.querySelector(selector);
          if (!element) throw new Error(`missing ${selector}`);
          return element.getBoundingClientRect();
        };
        const select = status.querySelector(".bx--select-input");
        if (!select) throw new Error("missing select");
        const field = select.getBoundingClientRect();
        const label = rect(".bx--label");
        const icon = rect(".bx--select__invalid-icon");
        const textEnd =
          field.right -
          Number.parseFloat(getComputedStyle(select).paddingRight);
        return {
          name: status.dataset.status ?? "",
          iconAfterText: Math.round(icon.left - textEnd),
          labelOffset: Math.round(
            label.top + label.height / 2 - (field.top + field.height / 2),
          ),
        };
      },
    ),
  );

  expect(cases).toHaveLength(2);
  for (const { name, iconAfterText, labelOffset } of cases) {
    expect.soft(iconAfterText, name).toBeGreaterThanOrEqual(0);
    expect.soft(Math.abs(labelOffset), name).toBeLessThanOrEqual(2);
  }
});
