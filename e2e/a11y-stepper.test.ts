import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("Stepper a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/stepper.html");
    const axe = async () => {
      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    };

    // An empty step marks its field and focuses it.
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("textbox", { name: "Name" })).toBeFocused();
    await expect(page.getByRole("textbox", { name: "Name" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await axe();

    await page.getByRole("textbox", { name: "Name" }).fill("Ada");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("group", { name: "Review" })).toBeFocused();

    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("button", { name: "Back" })).toBeDisabled();
    await axe();

    await page.getByRole("button", { name: "Finish request" }).click();
    await expect(page.getByText("Your account is ready.")).toBeVisible();
    // No step is current once the flow is done.
    await expect(page.locator("[aria-current]")).toHaveCount(0);
    await axe();
  });
});
