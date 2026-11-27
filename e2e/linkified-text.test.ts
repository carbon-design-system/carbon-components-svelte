import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("LinkifiedText", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/linkified-text.html");
    await expect(page.getByTestId("english")).toBeVisible();
  });

  for (const theme of ["white", "g100"]) {
    test(`has no detectable accessibility violations in ${theme}`, async ({
      page,
    }) => {
      // Colors fade between themes; axe must read the settled ones.
      await page.evaluate(async (theme) => {
        document.documentElement.setAttribute("theme", theme);
        await Promise.all(
          document.getAnimations().map((animation) => animation.finished),
        );
      }, theme);

      const results = await new AxeBuilder({ page }).include("#app").analyze();

      expect(results.violations).toEqual([]);
    });
  }

  test("links only what is safe, and shows the real address of a look-alike", async ({
    page,
  }) => {
    expect(
      await page
        .getByTestId("english")
        .getByRole("link")
        .evaluateAll((links) => links.map((link) => link.getAttribute("href"))),
    ).toEqual([
      "https://shipping.example.com/track/1Z999AA1",
      "mailto:support@example.com",
      "https://www.example.com/help",
    ]);
    await expect(page.getByTestId("hostile").getByRole("link")).toHaveCount(0);
    await expect(page.getByTestId("lookalike").getByRole("link")).toHaveText(
      "xn--80ak6aa92e.com/login",
    );
  });

  test("keeps a URL in right-to-left text in order, outside its sentence", async ({
    page,
  }) => {
    const link = page.getByTestId("hebrew").getByRole("link");
    const style = await link.evaluate((node) => {
      const computed = getComputedStyle(node);
      return {
        direction: computed.direction,
        isolate: computed.unicodeBidi,
      };
    });
    expect(style).toEqual({ direction: "ltr", isolate: "isolate" });

    // The full stop that ended the sentence sits visually after the link,
    // which in right-to-left text is to its left, not inside the address.
    const geometry = await page.getByTestId("hebrew").evaluate((paragraph) => {
      const anchor = paragraph.querySelector("a");
      let after = anchor?.nextSibling ?? null;
      while (after && !after.textContent) after = after.nextSibling;
      if (!anchor || !after) throw new Error("no text after the link");
      const range = document.createRange();
      range.setStart(after, 0);
      range.setEnd(after, 1);
      return {
        after: range.getBoundingClientRect().right,
        linkLeft: anchor.getBoundingClientRect().left,
      };
    });
    expect(geometry.after).toBeLessThanOrEqual(geometry.linkLeft + 1);
  });

  test("underlines links and uses the system link color in forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });

    const rows = await page
      .getByTestId("english")
      .getByRole("link")
      .evaluateAll((links) =>
        links.map((link) => {
          const style = getComputedStyle(link);
          return {
            underline: style.textDecorationLine.includes("underline"),
            color: style.color,
          };
        }),
      );
    const probe = await page.evaluate(() => {
      const el = document.createElement("div");
      el.style.color = "LinkText";
      document.body.append(el);
      const color = getComputedStyle(el).color;
      el.remove();
      return color;
    });

    for (const row of rows) {
      expect.soft(row.underline).toBe(true);
      expect.soft(row.color).toBe(probe);
    }
  });
});
