import { expect, test } from "@playwright/test";

test.describe("NumberInput", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/number-input.html");
  });

  test("renders with label", async ({ page }) => {
    await expect(page.getByLabel("Quantity")).toBeVisible();
  });

  test("can be located by getByLabel when labelText is set", async ({
    page,
  }) => {
    const input = page.getByLabel("Quantity");
    await expect(input).toBeVisible();
    await expect(input).toHaveValue("10");
    await input.fill("25");
    await expect(input).toHaveValue("25");
  });

  test("can be located and interacted with by data-testid", async ({
    page,
  }) => {
    const input = page.getByTestId("number-input-quantity");
    await expect(input).toBeVisible();
    await input.fill("50");
    await expect(input).toHaveValue("50");
  });

  test("increment button increases value", async ({ page }) => {
    const input = page.getByTestId("number-input-quantity");
    await input.fill("5");
    await page.getByLabel("Increment number").first().click();
    await expect(input).toHaveValue("6");
  });

  test("decrement button decreases value", async ({ page }) => {
    const input = page.getByTestId("number-input-quantity");
    await input.fill("5");
    await page.getByLabel("Decrement number").first().click();
    await expect(input).toHaveValue("4");
  });

  test.describe("locale + formatting", () => {
    test("displays initial value with locale formatting (de-DE)", async ({
      page,
    }) => {
      const input = page.getByLabel("Amount (DE)");
      await expect(input).toBeVisible();
      // German locale: period for thousands, comma for decimal
      await expect(input).toHaveValue("1.234,5");
      await expect(page.getByTestId("number-input-locale-value")).toHaveText(
        "1234.5",
      );
    });

    test("formats value on blur after typing decimal with comma", async ({
      page,
    }) => {
      const section = page.getByTestId("number-input-formatting");
      const input = section.getByRole("textbox");
      await input.clear();
      await input.fill("3,14");
      await input.blur();
      await expect(page.getByTestId("number-input-locale-value")).toHaveText(
        "3.14",
      );
      await expect(input).toHaveValue("3,14");
    });

    test("stepper updates value with locale-formatted display", async ({
      page,
    }) => {
      const section = page.getByTestId("number-input-formatting");
      const input = section.getByRole("textbox");
      await input.clear();
      await input.fill("1000");
      await input.blur();
      await section.getByLabel("Increment number").click();
      // Fixture uses step=0.1, so 1000 + 0.1 = 1000.1
      await expect(page.getByTestId("number-input-locale-value")).toHaveText(
        "1000.1",
      );
      await expect(input).toHaveValue("1.000,1");
    });
  });

  test.describe("allowDecimal (text mode via locale)", () => {
    test("preserves decimal input and value on blur", async ({ page }) => {
      const section = page.getByTestId("number-input-formatting");
      const input = section.getByRole("textbox");
      await input.clear();
      await input.fill("1,50");
      await input.blur();
      await expect(page.getByTestId("number-input-locale-value")).toHaveText(
        "1.5",
      );
    });

    test("normalizes invalid input to last valid value on blur", async ({
      page,
    }) => {
      const section = page.getByTestId("number-input-formatting");
      const input = section.getByRole("textbox");
      await input.clear();
      await input.fill("1,5.");
      await input.blur();
      await expect(input).toHaveValue("1,5");
      await expect(page.getByTestId("number-input-locale-value")).toHaveText(
        "1.5",
      );
    });

    test("increment/decrement with decimal step", async ({ page }) => {
      const section = page.getByTestId("number-input-formatting");
      const input = section.getByRole("textbox");
      await input.clear();
      await input.fill("0");
      await input.blur();
      await section.getByLabel("Increment number").click();
      await expect(page.getByTestId("number-input-locale-value")).toHaveText(
        "0.1",
      );
      await section.getByLabel("Decrement number").click();
      await expect(page.getByTestId("number-input-locale-value")).toHaveText(
        "0",
      );
    });
  });

  test.describe("keyboard in text mode", () => {
    test("ArrowUp increases value when focused", async ({ page }) => {
      const section = page.getByTestId("number-input-formatting");
      const input = section.getByRole("textbox");
      await input.clear();
      await input.fill("5");
      await input.focus();
      await page.keyboard.press("ArrowUp");
      await expect(page.getByTestId("number-input-locale-value")).toHaveText(
        "5.1",
      );
    });

    test("ArrowDown decreases value when focused", async ({ page }) => {
      const section = page.getByTestId("number-input-formatting");
      const input = section.getByRole("textbox");
      await input.clear();
      await input.fill("5");
      await input.focus();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByTestId("number-input-locale-value")).toHaveText(
        "4.9",
      );
    });
  });

  test.describe("min/max validation", () => {
    test("shows invalid state when typed value exceeds max after blur", async ({
      page,
    }) => {
      const input = page.getByTestId("number-input-quantity");
      await input.fill("150");
      await input.blur();
      await expect(input).toHaveAttribute("aria-invalid", "true");
    });
  });

  test.describe("paste", () => {
    test("parses locale-formatted number with thousands on blur", async ({
      page,
    }) => {
      const section = page.getByTestId("number-input-formatting");
      const input = section.getByRole("textbox");
      await input.clear();
      await input.fill("1.000,5");
      await input.blur();
      await expect(page.getByTestId("number-input-locale-value")).toHaveText(
        "1000.5",
      );
    });
  });

  test.describe("disableWheel", () => {
    test("wheel does not change value when disableWheel is true", async ({
      page,
    }) => {
      const input = page.getByTestId("number-input-no-wheel");
      await expect(input).toBeVisible();
      await expect(input).toHaveValue("5");
      await input.click();
      await page.mouse.wheel(0, 100);
      await expect(input).toHaveValue("5");
    });
  });
});
