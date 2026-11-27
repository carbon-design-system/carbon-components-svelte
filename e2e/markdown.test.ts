import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const SYSTEM = (page: Page, name: string) =>
  page.evaluate((color) => {
    const probe = document.createElement("div");
    probe.style.backgroundColor = color;
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, name);

test.describe("Markdown", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/markdown.html");
    await expect(page.getByTestId("static")).toBeVisible();
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    const white = await new AxeBuilder({ page }).include("#app").analyze();
    expect(white.violations).toEqual([]);

    await page.evaluate(() =>
      document.documentElement.setAttribute("theme", "g100"),
    );
    // Links fade between themes, and axe would read the colors mid-way.
    await page.waitForTimeout(400);
    const g100 = await new AxeBuilder({ page }).include("#app").analyze();
    expect(g100.violations).toEqual([]);
  });

  test("reaches a table, a code block and its copy button by keyboard", async ({
    page,
  }) => {
    const root = page.getByTestId("static");
    await root.getByRole("link").last().focus();

    await page.keyboard.press("Tab");
    await expect(root.getByRole("button", { name: "Copy code" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(root.locator("pre")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(root.getByRole("group", { name: "Table" })).toBeFocused();
  });

  test("scrolls a wide table and long code inside their own boxes", async ({
    page,
  }) => {
    const root = page.getByTestId("static");
    const fits = await root.evaluate(
      (node) => node.scrollWidth <= node.clientWidth,
    );
    expect(fits).toBe(true);

    const table = root.getByRole("group", { name: "Table" });
    expect(
      await table.evaluate((node) => node.scrollWidth > node.clientWidth),
    ).toBe(true);
  });

  test("closes a streaming span for the reader and ends with a caret", async ({
    page,
  }) => {
    const streaming = page.getByTestId("streaming");

    await expect(streaming.locator("strong").first()).toContainText(
      "typing the answer and",
    );
    await expect(streaming.locator("strong code")).toHaveCount(1);
    await expect(streaming.locator(".bx--markdown__caret")).toBeVisible();
  });

  test("holds the caret still when reduced motion is preferred", async ({
    page,
  }) => {
    const caret = page.getByTestId("streaming").locator(".bx--markdown__caret");
    expect(await caret.evaluate((n) => getComputedStyle(n).animationName)).toBe(
      "markdown-caret",
    );

    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await caret.evaluate((n) => getComputedStyle(n).animationName)).toBe(
      "none",
    );
  });

  test("turns hostile text into text, with no element, script or unsafe link", async ({
    page,
  }) => {
    const unsafe = page.getByTestId("unsafe");

    await expect(unsafe).toContainText("<script>window.pwned = 1</script>");
    expect(await unsafe.locator("img, script, iframe, [onerror]").count()).toBe(
      0,
    );
    const hrefs = await unsafe
      .locator("a")
      .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(href).toMatch(/^https:\/\//);
    // A link whose text names another site shows where it goes.
    await expect(
      unsafe.getByRole("link", { name: "https://evil.example/" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => (window as unknown as { pwned?: number }).pwned,
      ),
    ).toBeUndefined();
  });

  test("lets Arabic copy run right to left and keeps code left to right", async ({
    page,
  }) => {
    const root = page.getByTestId("static");
    const arabic = root.locator("p", { hasText: "لتثبيت" });

    expect(await arabic.evaluate((n) => getComputedStyle(n).direction)).toBe(
      "rtl",
    );
    expect(
      await arabic
        .locator("code")
        .evaluate((n) => getComputedStyle(n).direction),
    ).toBe("ltr");
    expect(
      await root.locator("pre").evaluate((n) => getComputedStyle(n).direction),
    ).toBe("ltr");
  });

  test("draws the caret and the code header in forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    const canvas = await SYSTEM(page, "Canvas");
    const text = await SYSTEM(page, "CanvasText");

    const caret = page.getByTestId("streaming").locator(".bx--markdown__caret");
    const background = await caret.evaluate(
      (n) => getComputedStyle(n).backgroundColor,
    );
    expect(background).toBe(text);
    expect(background).not.toBe(canvas);

    const header = page.getByTestId("static").locator("figure > figcaption");
    expect(
      await header.evaluate((n) => getComputedStyle(n).borderBottomStyle),
    ).toBe("solid");
  });
});
