import { expect, test } from "@playwright/test";

test.describe("TextInput", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/text-input.html");
  });

  test("renders with label", async ({ page }) => {
    await expect(page.getByLabel("User name")).toBeVisible();
  });

  test("can be located by getByLabel when labelText is set", async ({
    page,
  }) => {
    const input = page.getByLabel("User name");
    await expect(input).toBeVisible();
    await input.fill("Alice");
    await expect(input).toHaveValue("Alice");
  });

  test("can be located and interacted with by data-testid", async ({
    page,
  }) => {
    const input = page.getByTestId("text-input-username");
    await expect(input).toBeVisible();
    await input.fill("Bob");
    await expect(input).toHaveValue("Bob");
  });

  test("shows placeholder", async ({ page }) => {
    await expect(page.getByPlaceholder("Enter your name")).toBeVisible();
  });

  test("disabled input cannot be edited", async ({ page }) => {
    const input = page.getByTestId("text-input-disabled");
    await expect(input).toBeDisabled();
  });

  test("shows invalid state", async ({ page }) => {
    await expect(page.getByText("This field is required")).toBeVisible();
  });

  test("fluid maxCount counter does not overlap the label", async ({
    page,
  }) => {
    const wrapper = page.getByTestId("text-input-fluid-counter-case");
    const label = wrapper.locator(
      ".bx--label:not(.bx--text-input__label-counter)",
    );
    const counter = wrapper.locator(".bx--text-input__label-counter");

    await expect(counter).toHaveText("3/10");

    const labelBox = await label.boundingBox();
    const counterBox = await counter.boundingBox();
    const fieldBox = await wrapper
      .locator(".bx--text-input--fluid")
      .boundingBox();
    if (!labelBox || !counterBox || !fieldBox) {
      throw new Error("expected label, counter, and field to be laid out");
    }

    // Both are absolutely positioned `.bx--label` elements in the same
    // containing block; without the counter's own inset rules they stack on
    // the label's coordinates.
    expect(counterBox.x).toBeGreaterThan(labelBox.x + labelBox.width);
    expect(
      fieldBox.x + fieldBox.width - (counterBox.x + counterBox.width),
    ).toBeLessThan(24);
  });
});
