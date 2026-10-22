import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// Resolve a theme token the way the page paints it.
function token(page: Page, name: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("div");
    probe.style.color = `var(--cds-${name})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, name);
}

function bottomBorderColor(page: Page, id: string) {
  return page
    .getByTestId(id)
    .locator("input, textarea, select")
    .evaluate((el) => getComputedStyle(el).borderBottomColor);
}

test("read-only fields draw a subtle bottom border, like v11", async ({
  page,
}) => {
  await page.goto("/readonly-fields.html");
  await expect(page.getByTestId("fluid-number-input")).toBeVisible();
  const [subtle, strong] = await Promise.all([
    token(page, "border-subtle"),
    token(page, "border-strong"),
  ]);
  expect(subtle).not.toBe(strong);

  const cases = [
    ["text-input", subtle],
    ["password-input", subtle],
    ["number-input", subtle],
    ["number-input-no-steppers", subtle],
    ["fluid-text-input", subtle],
    ["fluid-number-input", subtle],
    ["text-area", subtle],
    ["select", subtle],
    ["text-input-editable", strong],
    ["number-input-editable", strong],
  ] as const;
  const colors = await Promise.all(
    cases.map(([id]) => bottomBorderColor(page, id)),
  );
  cases.forEach(([id, color], i) => {
    expect.soft(colors[i], id).toBe(color);
  });
});

test("read-only NumberInput keeps its steppers, inert, in place of the icon", async ({
  page,
}) => {
  await page.goto("/readonly-fields.html");
  await expect(page.getByTestId("fluid-number-input")).toBeVisible();
  const [iconDisabled, subtle] = await Promise.all([
    token(page, "icon-disabled"),
    token(page, "border-subtle"),
  ]);

  const ids = ["number-input", "fluid-number-input"];
  const fields = await Promise.all(
    ids.map((id) =>
      page.getByTestId(id).evaluate((field) => ({
        icons: field.querySelectorAll(".bx--text-input__readonly-icon").length,
        steppers: [...field.querySelectorAll(".bx--number__control-btn")].map(
          (el) => {
            const { color, pointerEvents } = getComputedStyle(el);
            const { width, height } = el.getBoundingClientRect();
            return { color, pointerEvents, laidOut: width > 0 && height > 0 };
          },
        ),
      })),
    ),
  );
  const inert = { color: iconDisabled, pointerEvents: "none", laidOut: true };
  ids.forEach((id, i) => {
    expect.soft(fields[i], id).toEqual({ icons: 0, steppers: [inert, inert] });
  });

  // The divider between the steppers stays visible in the subtle border color.
  expect(
    await page
      .getByTestId("number-input")
      .locator(".bx--number__rule-divider")
      .last()
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe(subtle);

  // Without steppers the icon marks the state, and the value stays clear of it.
  const noSteppers = page.getByTestId("number-input-no-steppers");
  const icon = noSteppers.locator(".bx--text-input__readonly-icon");
  await expect(icon).toBeVisible();
  const [iconBox, inputBox, paddingRight] = await Promise.all([
    icon.boundingBox(),
    noSteppers.locator("input").boundingBox(),
    noSteppers
      .locator("input")
      .evaluate((el) => Number.parseFloat(getComputedStyle(el).paddingRight)),
  ]);
  if (!iconBox || !inputBox) {
    throw new Error("expected the icon and the input to be laid out");
  }
  expect(inputBox.x + inputBox.width - paddingRight).toBeLessThanOrEqual(
    iconBox.x,
  );
});
