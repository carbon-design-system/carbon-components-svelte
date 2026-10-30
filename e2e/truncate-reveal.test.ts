import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

const tooltip = ".bx--tooltip-portal__content";
const toggle = ".bx--text-truncate__toggle";

test.describe("Truncate reveal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/truncate-reveal.html");
    // The tab stop appears once the observer has measured the text.
    await expect(page.getByTestId("clipped")).toHaveAttribute("tabindex", "0");
  });

  test("Tab reaches clipped text only, and focus shows the full text", async ({
    page,
  }) => {
    await page.getByTestId("before").focus();

    await page.keyboard.press("Tab");
    await expect(page.getByTestId("clipped")).toBeFocused();
    await expect(page.locator(tooltip)).toHaveText(
      /^Failed to deploy revision 214: .+ production namespace\.$/,
    );

    // The text that fits is skipped.
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("front")).toBeFocused();
    await expect(page.locator(tooltip)).toHaveText(
      "/var/log/kubernetes/production/payments-api/pods/payments-api-7f9c8d6b4d-x2kql/container.log",
    );

    await page.keyboard.press("Tab");
    await expect(page.locator(toggle)).toBeFocused();
    await expect(page.locator(toggle)).toHaveText("View more");
    await expect(page.locator(tooltip)).toHaveCount(0);
    await expect(page.getByTestId("fits")).not.toHaveAttribute("tabindex");
  });

  test("Escape hides the tooltip and keeps focus", async ({ page }) => {
    const clipped = page.getByTestId("clipped");
    await clipped.focus();
    await expect(page.locator(tooltip)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator(tooltip)).toHaveCount(0);
    await expect(clipped).toBeFocused();
  });

  test("hover shows the tooltip", async ({ page }) => {
    await page.getByTestId("clipped").hover();
    await expect(page.locator(tooltip)).toBeVisible();
  });

  test("the front clamp keeps a leading slash in front", async ({ page }) => {
    // Under `direction: rtl`, a bare leading slash would render at the end.
    const [slash, next] = await page.getByTestId("front").evaluate((el) => {
      const text = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const node = text.nextNode();
      if (!node?.textContent) throw new Error("no text");
      const start = node.textContent.indexOf("/");
      const range = document.createRange();
      return [start, start + 1].map((offset) => {
        range.setStart(node, offset);
        range.setEnd(node, offset + 1);
        return range.getBoundingClientRect().left;
      });
    });
    expect(slash).toBeLessThan(next);
  });

  test("the toggle expands and collapses the text", async ({ page }) => {
    const text = page.getByTestId("expand");
    const button = page.locator(toggle);
    const collapsed = await text.evaluate((node) => node.clientHeight);

    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(button).toHaveAttribute(
      "aria-controls",
      (await text.getAttribute("id")) ?? "",
    );

    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(button).toHaveText("View less");
    expect(await text.evaluate((node) => node.clientHeight)).toBeGreaterThan(
      collapsed,
    );
    expect(
      await text.evaluate((node) => node.scrollHeight <= node.clientHeight),
    ).toBe(true);

    await page.keyboard.press("Space");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(button).toHaveText("View more");
    await expect
      .poll(() => text.evaluate((node) => node.clientHeight))
      .toBe(collapsed);
  });

  test("the toggle takes a 24 by 24 px press around its center", async ({
    page,
  }) => {
    const button = page.locator(toggle);
    // Each corner of a 24 px square on the label's center, 0.5 px inside.
    const missed = await button.evaluate((node) => {
      const box = node.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      return [
        [-11.5, -11.5],
        [11.5, -11.5],
        [-11.5, 11.5],
        [11.5, 11.5],
      ]
        .filter(
          ([dx, dy]) => document.elementFromPoint(x + dx, y + dy) !== node,
        )
        .map(([dx, dy]) => `${dx},${dy} of ${box.width}x${box.height}`);
    });
    expect(missed).toEqual([]);
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    await page.getByTestId("clipped").focus();
    await expect(page.locator(tooltip)).toBeVisible();

    // The tooltip renders in a portal beside `#app`, so check the whole
    // page, minus the rules about the test page's own landmarks.
    const results = await new AxeBuilder({ page })
      .disableRules(["landmark-one-main", "page-has-heading-one", "region"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
