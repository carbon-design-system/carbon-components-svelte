import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("PromptInput a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/prompt-input.html");
    const field = page.getByRole("textbox", { name: "Message" });
    await expect(field).toBeVisible();

    const white = await new AxeBuilder({ page }).include("#app").analyze();
    expect(white.violations).toEqual([]);

    // A chip, a stop button and a message over the limit, in Gray 100.
    await field.evaluate((node) => {
      const transfer = new DataTransfer();
      transfer.items.add(
        new File(["x"], "screenshot.png", { type: "image/png" }),
      );
      node.dispatchEvent(
        new ClipboardEvent("paste", {
          clipboardData: transfer,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    await expect(page.locator(".bx--prompt-input__chip-name")).toHaveText(
      "screenshot.png",
    );
    await field.fill("x".repeat(240));
    await page.getByTestId("stream").click();
    await page.evaluate(() =>
      document.documentElement.setAttribute("theme", "g100"),
    );
    // Colors fade between themes, and axe would read them mid-way.
    await page.evaluate(() =>
      Promise.all(document.getAnimations().map((a) => a.finished)),
    );
    const g100 = await new AxeBuilder({ page }).include("#app").analyze();
    expect(g100.violations).toEqual([]);
  });
});
