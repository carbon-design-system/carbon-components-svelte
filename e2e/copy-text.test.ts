import { expect, test } from "@playwright/test";

test.describe("CopyText", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/copy-text.html");
  });

  for (const dir of ["ltr", "rtl", "rtl-mixed"]) {
    test(`keeps the button on the value's last line (${dir})`, async ({
      page,
    }) => {
      // Sweep the widths where the sentence wraps around the value, and
      // record any width that leaves the button alone or overflowing.
      const failures = await page
        .getByTestId(`sentence-${dir}`)
        .evaluate((node: HTMLElement) => {
          const value = node.querySelector(".bx--copy-text__value");
          const button = node.querySelector("button");
          if (!value || !button) return ["missing"];
          const found: string[] = [];
          for (let width = 100; width <= 420; width++) {
            node.style.width = `${width}px`;
            const range = document.createRange();
            range.selectNodeContents(value);
            const lines = [...range.getClientRects()].filter((r) => r.width);
            const last = lines[lines.length - 1];
            const rect = button.getBoundingClientRect();
            const box = node.getBoundingClientRect();
            if (rect.top > last.bottom - 2) found.push(`${width}: alone`);
            if (rect.left < box.left - 0.5 || rect.right > box.right + 0.5) {
              found.push(`${width}: overflow`);
            }
          }
          return found;
        });

      expect(failures).toEqual([]);
    });
  }

  test("describes each button with its value", async ({ page }) => {
    await expect(
      page.getByTestId("sentence-ltr").getByRole("button"),
    ).toHaveAccessibleDescription("https://api.acme.io/…/f8a2c91d");
  });
});
