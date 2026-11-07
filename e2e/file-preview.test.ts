import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

type Flags = { __xss?: number };

async function open(page: Page, cases = "") {
  await page.goto(`/file-preview.html?cases=${cases}`);
  await page.locator("[data-ready]").waitFor();
}

test.describe("FilePreview", () => {
  test("shows each built-in kind", async ({ page }) => {
    await open(page);

    await expect(
      page.getByTestId("image").getByRole("img", { name: "capacity-q3.png" }),
    ).toBeVisible();
    await expect(
      page.getByTestId("code").locator("[class^=tok-]").first(),
    ).toBeVisible();
    await expect(
      page.getByTestId("csv").getByRole("columnheader", { name: "ticket" }),
    ).toBeVisible();
    await expect(
      page
        .getByTestId("markdown")
        .getByRole("heading", { name: "Runbook: failover" }),
    ).toBeVisible();
    await expect(
      page.getByTestId("json").getByRole("group", { name: "service.json" }),
    ).toContainText('"id": 12345678901234567890');
    await expect(
      page.getByTestId("zip").getByRole("link", { name: "Download" }),
    ).toBeVisible();
    await expect(page.getByTestId("pdf").locator("iframe")).toHaveAttribute(
      "src",
      /^blob:/,
    );
  });

  test("zooms an image from the buttons and the keyboard", async ({ page }) => {
    await open(page, "image");
    const image = page.getByRole("img", { name: "capacity-q3.png" });
    const fitted = (await image.boundingBox())!.width;

    await page.getByRole("button", { name: "Zoom in" }).click();
    await page.getByRole("button", { name: "Zoom in" }).click();
    const zoomed = (await image.boundingBox())!.width;
    expect(zoomed).toBeGreaterThan(fitted);

    await page.getByRole("group", { name: "capacity-q3.png" }).focus();
    await page.keyboard.press("0");

    expect((await image.boundingBox())!.width).toBeCloseTo(fitted, 0);
  });

  test("never runs script from hostile SVG, HTML or Markdown", async ({
    page,
  }) => {
    const dialogs: string[] = [];
    page.on("dialog", (dialog) => {
      dialogs.push(dialog.message());
      void dialog.dismiss();
    });
    await open(page, "hostileSvg,hostileHtml,hostileMarkdown");
    await page.waitForTimeout(500);

    expect(await page.evaluate(() => (window as Flags).__xss)).toBeUndefined();
    expect(dialogs).toEqual([]);
    // The SVG is an image, the HTML is source, and the Markdown has no link or image.
    await expect(page.getByTestId("hostileSvg").getByRole("img")).toBeVisible();
    await expect(
      page.getByTestId("hostileSvg").locator("svg:not([aria-hidden])"),
    ).toHaveCount(0);
    await expect(
      page.getByTestId("hostileHtml").getByRole("group"),
    ).toContainText("<script>");
    await expect(
      page
        .getByTestId("hostileMarkdown")
        .locator(".bx--file-preview__document")
        .locator("a, img, script"),
    ).toHaveCount(0);
  });

  test("the SVG shown has no script in its own document", async ({ page }) => {
    await open(page, "hostileSvg");
    const src = await page
      .getByTestId("hostileSvg")
      .getByRole("img")
      .getAttribute("src");

    // Opened on its own, an SVG blob runs script. The one behind the
    // download link must be an octet stream that only downloads.
    const href = await page
      .getByTestId("hostileSvg")
      .getByRole("link", { name: "Download" })
      .getAttribute("href");
    const types = await page.evaluate(
      (urls) =>
        Promise.all(
          urls.map(async (url) =>
            (await fetch(url)).headers.get("content-type"),
          ),
        ),
      [src!, href!],
    );

    expect(types).toEqual(["image/svg+xml", "application/octet-stream"]);
  });

  test("shows binary named .txt as the file card, and Latin-1 text decoded", async ({
    page,
  }) => {
    await open(page, "binaryAsText,latin1");

    await expect(
      page
        .getByTestId("binaryAsText")
        .getByText("No preview is available")
        .first(),
    ).toBeVisible();
    await expect(page.getByTestId("latin1")).toContainText("Café résumé");
    await expect(page.getByTestId("latin1")).toContainText(
      "Read as windows-1252.",
    );
  });

  test("previews a 50 MB log without reading it all, and without a freeze", async ({
    page,
  }) => {
    const started = Date.now();
    await open(page, "huge");
    const region = page.getByTestId("huge");

    await expect(
      region.getByText("Showing the first 1 MB of 52.4 MB."),
    ).toBeVisible();
    // One chunk is in the DOM, not the whole megabyte.
    const shown = await region
      .locator("pre")
      .evaluate((pre) => pre.textContent!.length);
    expect(shown).toBeLessThan(60_000);
    expect(Date.now() - started).toBeLessThan(5000);

    await region.getByRole("button", { name: "Show more" }).click();
    expect(
      await region.locator("pre").evaluate((pre) => pre.textContent!.length),
    ).toBeGreaterThan(shown);
  });

  test("goes to full screen and back", async ({ page, browserName }) => {
    test.skip(
      browserName === "webkit",
      "Playwright WebKit does not expose the Fullscreen API to a page",
    );
    await open(page, "code");
    const region = page.getByTestId("code");

    await region.getByRole("button", { name: "Full screen" }).click();
    await expect(region).toHaveClass(/bx--file-preview--fullscreen/);
    await region.getByRole("button", { name: "Exit full screen" }).click();

    await expect(region).not.toHaveClass(/bx--file-preview--fullscreen/);
  });

  for (const theme of ["white", "g100"] as const) {
    test(`has no detectable accessibility violations in ${theme}`, async ({
      page,
    }) => {
      await open(page, "image,code,csv,markdown,json,zip,audio,arabic");
      await page.evaluate((theme) => {
        document.documentElement.classList.toggle("bx--g100", theme === "g100");
      }, theme);
      // Axe reads a color halfway through a theme transition as a fail.
      await page.addStyleTag({
        content: "*, *::before { transition: none !important }",
      });
      await page.waitForTimeout(100);

      const results = await new AxeBuilder({ page }).include("#app").analyze();

      expect(results.violations).toEqual([]);
    });
  }

  test("lays out from the inline start under rtl", async ({ page }) => {
    await open(page, "code");
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const region = page.getByTestId("code");
    const box = (await region.boundingBox())!;
    const name = (await region
      .locator(".bx--file-preview__name")
      .boundingBox())!;
    const actions = (await region
      .locator(".bx--file-preview__actions")
      .boundingBox())!;

    // The name sits at the right edge and the actions at the left.
    expect(box.x + box.width - (name.x + name.width)).toBeLessThan(
      box.x + box.width - 200,
    );
    expect(name.x).toBeGreaterThan(actions.x);
    // Source still reads left to right.
    expect(await region.locator("pre").getAttribute("dir")).toBe("ltr");
  });

  test("keeps its edges and focus ring in forced colors", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await open(page, "code,csv");
    const region = page.getByTestId("code");

    expect(
      await region.evaluate((el) => getComputedStyle(el).borderTopWidth),
    ).toBe("1px");
    expect(
      await region.evaluate((el) => getComputedStyle(el).borderTopColor),
    ).not.toBe("rgba(0, 0, 0, 0)");

    await region.getByRole("group", { name: "deploys.ts" }).focus();
    await page.keyboard.press("Tab");
    await region.getByRole("group", { name: "deploys.ts" }).focus();
    const outline = await region
      .getByRole("group", { name: "deploys.ts" })
      .evaluate((el) => getComputedStyle(el).outlineStyle);

    expect(outline).not.toBe("none");
  });
});
