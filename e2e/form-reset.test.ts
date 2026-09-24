import { expect, test } from "@playwright/test";

test.describe("Form reset", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/form-reset.html");
  });

  test("a reset button syncs Checkbox to the cleared box", async ({ page }) => {
    const bound = page.getByTestId("bound");

    await page.getByText("Agree", { exact: true }).click();
    await expect(bound).toContainText('"agree":true');

    await page.getByRole("button", { name: "Reset" }).click();

    await expect(bound).toContainText('"agree":false');
    await expect(
      page.getByRole("checkbox", { name: "Agree" }),
    ).not.toBeChecked();
  });

  test("a reset button syncs PinCodeInput to the cleared segments", async ({
    page,
  }) => {
    const bound = page.getByTestId("bound");

    await page.getByRole("textbox", { name: /digit 1 of 4/ }).click();
    await page.keyboard.type("1234");
    await expect(bound).toContainText('"code":"1234"');

    await page.getByRole("button", { name: "Reset" }).click();

    await expect(bound).toContainText('"code":""');
    await expect(page.locator('input[type="hidden"][name="code"]')).toHaveValue(
      "",
    );

    // The next keystroke starts a new code instead of merging into the old one.
    await page.getByRole("textbox", { name: /digit 2 of 4/ }).click();
    await page.keyboard.type("9");
    await expect(bound).toContainText('"code":"9"');
  });

  test("a reset button keeps the Slider value", async ({ page }) => {
    const bound = page.getByTestId("bound");
    const level = page.locator('input[name="level"]');

    await level.fill("77");
    await level.press("Enter");
    await expect(bound).toContainText('"level":77');

    await page.getByRole("button", { name: "Reset" }).click();

    await expect(level).toHaveValue("77");
    await expect(page.getByRole("slider")).toHaveAttribute(
      "aria-valuenow",
      "77",
    );
    await expect(bound).toContainText('"level":77');
  });

  test("a reset button keeps the NumberInput value", async ({ page }) => {
    const bound = page.getByTestId("bound");
    const seats = page.getByRole("spinbutton", { name: "Seats" });

    await seats.fill("8");
    await expect(bound).toContainText('"seats":8');

    await page.getByRole("button", { name: "Reset" }).click();

    await expect(seats).toHaveValue("8");
    await expect(bound).toContainText('"seats":8');
  });
});
