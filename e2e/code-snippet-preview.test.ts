import { expect, test } from "./helpers/host";
import { expectAligned } from "./helpers/layout";

test.describe("CodeSnippet preview", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/code-snippet-preview.html");
  });

  test("renders the example above the code, inside the frame", async ({
    page,
  }) => {
    const snippet = page.getByTestId("snippet-plain");
    const preview = snippet.getByRole("group", { name: "Preview" });
    await expect(
      preview.getByRole("button", { name: "Save changes" }),
    ).toBeVisible();
    const [frame, example, code] = await Promise.all([
      snippet.boundingBox(),
      preview.boundingBox(),
      snippet.locator(".bx--snippet-container").boundingBox(),
    ]);
    expect(frame && example && code).toBeTruthy();
    if (!frame || !example || !code) return;
    // One border's width in from the frame's edges.
    expect(example.y - frame.y).toBe(1);
    expect(example.width).toBe(frame.width - 2);
    expect(code.y).toBeGreaterThan(example.y + example.height);
    // Not the code font: the example reads as the page around it.
    const font = await preview.evaluate(
      (node) => getComputedStyle(node).fontFamily,
    );
    expect(font).toMatch(/IBM Plex Sans/);
  });

  test("keeps the copy and expand buttons with the code", async ({ page }) => {
    const snippet = page.getByTestId("snippet-long");
    const more = snippet.getByRole("button", { name: "Show more" });
    await expect(more).toBeVisible();
    const [frame, example, code, copy, expand] = await Promise.all([
      snippet.boundingBox(),
      snippet.locator(".bx--snippet__preview").boundingBox(),
      snippet.locator(".bx--snippet-container").boundingBox(),
      snippet.locator(".bx--copy-btn").boundingBox(),
      more.boundingBox(),
    ]);
    if (!frame || !example || !code || !copy || !expand) {
      throw new Error("no box");
    }
    // 8px below the example, as it sits 8px below a plain snippet's top.
    expect(copy.y - (example.y + example.height)).toBe(8);
    // At the bottom of the frame, inside its border.
    expect(frame.y + frame.height - (expand.y + expand.height)).toBe(1);
    expect(expand.y).toBeGreaterThan(code.y);
  });

  test("lines up the label, the example and the code", async ({ page }) => {
    const snippet = page.getByTestId("snippet-actions");
    await expectAligned(
      [
        snippet.locator(".bx--snippet__preview-label"),
        snippet.getByTestId("idle"),
        snippet.locator(".bx--snippet__title"),
        snippet.locator("pre"),
      ],
      { edge: "inline-start", ink: true },
    );
    await expectAligned(
      [
        snippet.locator(".bx--snippet__preview-actions .bx--btn"),
        snippet.locator(".bx--snippet__preview-bar"),
      ],
      { edge: "inline-end", ink: false },
    );
  });

  test("runs the example from its bar, named by the label", async ({
    page,
  }) => {
    const snippet = page.getByTestId("snippet-actions");
    const preview = snippet.getByRole("group", { name: "Preview" });
    await preview.getByRole("button", { name: "Simulate saving" }).click();
    await expect(page.getByTestId("runs")).toHaveText("1");
    await expect(preview.getByText("Saving...")).toBeVisible();
  });

  test("mirrors the bar in right-to-left and keeps the code left to right", async ({
    page,
  }) => {
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const snippet = page.getByTestId("snippet-actions");
    const [frame, label, action, copy] = await Promise.all([
      snippet.boundingBox(),
      snippet.locator(".bx--snippet__preview-label").boundingBox(),
      snippet.locator(".bx--snippet__preview-actions .bx--btn").boundingBox(),
      snippet.locator(".bx--copy-btn").boundingBox(),
    ]);
    if (!frame || !label || !action || !copy) throw new Error("no box");
    expect(frame.x + frame.width - (label.x + label.width)).toBeCloseTo(17, 0);
    expect(action.x - frame.x).toBe(1);
    expect(copy.x - frame.x).toBeLessThan(frame.width / 2);
    expect(
      await snippet
        .locator("pre")
        .evaluate((node) => getComputedStyle(node).direction),
    ).toBe("ltr");
  });

  test("puts the example on the surface around it", async ({ page }) => {
    const background = (testId: string) =>
      page
        .getByTestId(testId)
        .locator(".bx--snippet__preview")
        .evaluate((node) => getComputedStyle(node).backgroundColor);
    const surface = (testId: string) =>
      page.getByTestId(testId).evaluate((node) => {
        let el: Element | null = node.parentElement;
        while (el) {
          const color = getComputedStyle(el).backgroundColor;
          if (color !== "rgba(0, 0, 0, 0)") return color;
          el = el.parentElement;
        }
        return getComputedStyle(document.body).backgroundColor;
      });
    expect(await background("snippet-plain")).toBe(
      await surface("snippet-plain"),
    );
    expect(await background("snippet-layer")).toBe(
      await surface("snippet-layer"),
    );
    expect(await background("snippet-layer")).not.toBe(
      await background("snippet-plain"),
    );
  });

  test("takes the example out of the tab order while disabled", async ({
    page,
  }) => {
    const snippet = page.getByTestId("snippet-disabled");
    const focused = await snippet
      .locator(".bx--snippet__preview .bx--btn")
      .evaluateAll((buttons) =>
        buttons.map((button) => {
          (button as HTMLElement).focus();
          return document.activeElement === button;
        }),
      );
    expect(focused).toEqual([false, false]);
  });

  test("renders no preview for a single-line snippet", async ({ page }) => {
    await expect(page.getByTestId("snippet-single")).toBeVisible();
    await expect(page.getByText("Not rendered")).toHaveCount(0);
  });
});
