import { expect, test } from "@playwright/test";
import { expectAligned } from "./helpers/layout";

// `vertical-align: middle` centers on the x-height, about 1.5px below the
// middle of the capitals. Each of these lifts its icon or keys to the cap
// height of the text beside it.
test.describe("inline icons", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/inline-icons.html");
  });

  // A 24px key cap centered on the x-height hangs below a 24px line and
  // makes it 1.88px taller. Centered on the cap height, it fits.
  test("keeps the line height with a key cap", async ({ page }) => {
    const height = await page
      .getByTestId("kbd")
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(height).toBeLessThan(25);
  });

  test("sets muted keys on the baseline", async ({ page }) => {
    const sentence = page.getByTestId("kbd-muted");
    // The last key, K, is text on every platform.
    const key = sentence.locator(".bx--kbd__key").filter({ visible: true });
    await expectAligned([sentence, key.last()], { edge: "baseline" });
  });

  for (const size of ["mini", "2xs", "xs"]) {
    test(`centers the AILabel box (${size})`, async ({ page }) => {
      const sentence = page.getByTestId(`ai-label-${size}`);
      await expectAligned(
        [sentence, sentence.locator(".bx--toggletip-button")],
        { edge: "cap-center", tolerance: 1 },
      );
    });
  }

  // Centered on the x-height, the 24px xs box makes a 24px line 1.88px
  // taller.
  test("keeps the line height with an xs AILabel", async ({ page }) => {
    const height = await page
      .getByTestId("ai-label-xs")
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(height).toBeLessThan(25);
  });

  test("sets the inline AILabel on the baseline", async ({ page }) => {
    const sentence = page.getByTestId("ai-label-inline");
    await expectAligned([sentence, sentence.locator(".bx--ai-label__text")], {
      edge: "baseline",
    });
  });

  for (const density of ["productive", "expressive"]) {
    test(`centers the Card title end icon (${density})`, async ({ page }) => {
      const card = page.getByTestId(`card-${density}`);
      await expectAligned(
        [
          card.locator(".bx--card__title-text-row"),
          card.locator(".bx--card__title-end-icon"),
        ],
        { edge: "cap-center", tolerance: 1 },
      );
    });
  }

  test("centers the ConfirmModal heading icon", async ({ page }) => {
    await expectAligned(
      [
        page.locator(".bx--modal-header__heading"),
        page.locator(".bx--confirm-modal__heading-icon"),
      ],
      { edge: "cap-center", tolerance: 1 },
    );
  });

  test("keeps the ConfirmModal icon's gap in right-to-left text", async ({
    page,
  }) => {
    const gap = (dir: string) =>
      page.evaluate((dir) => {
        document.documentElement.dir = dir;
        const heading = document.querySelector(".bx--modal-header__heading");
        const icon = heading
          ?.querySelector(".bx--confirm-modal__heading-icon")
          ?.getBoundingClientRect();
        const text = [...(heading?.childNodes ?? [])].find(
          (node) =>
            node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
        );
        if (!icon || !text) return null;
        const range = document.createRange();
        range.selectNodeContents(text);
        const box = range.getBoundingClientRect();
        return dir === "rtl" ? icon.left - box.right : box.left - icon.right;
      }, dir);
    expect(await gap("rtl")).toBeCloseTo((await gap("ltr")) ?? 0, 0);
  });
});
