import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("Splitter", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/splitter.html");
  });

  test("lays out the start pane at the given size", async ({ page }) => {
    const root = await page.getByTestId("splitter").boundingBox();
    const separator = await page
      .getByRole("separator", { name: "Resize file tree" })
      .boundingBox();
    if (!root || !separator) throw new Error("missing box");

    // 30% of 600px, with the 8px hit target centered on the boundary.
    expect(separator.x + separator.width / 2 - root.x).toBeCloseTo(180, 0);
    expect(separator.height).toBeCloseTo(300, 0);
  });

  test("drags the separator, clamps to max, and fires resize once", async ({
    page,
  }) => {
    const separator = page.getByRole("separator", { name: "Resize file tree" });
    const box = await separator.boundingBox();
    const root = await page.getByTestId("splitter").boundingBox();
    if (!box || !root) throw new Error("missing box");
    // Clear of the nested splitter's separator, which crosses at mid-height.
    const y = box.y + box.height / 4;

    await page.mouse.move(box.x + box.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(root.x + 300, y, { steps: 5 });
    await expect(page.getByTestId("size-display")).toHaveText("50");
    await expect(separator).toBeFocused();

    // Past `max` and across the nested splitter: capture keeps the drag.
    await page.mouse.move(root.x + 590, y + 100, { steps: 5 });
    await page.mouse.up();

    await expect(page.getByTestId("size-display")).toHaveText("80");
    await expect(page.getByTestId("resize-count")).toHaveText("1");
  });

  test("grows the start pane, on the right, when dragged left in RTL", async ({
    page,
  }) => {
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const separator = page.getByRole("separator", { name: "Resize file tree" });
    const box = await separator.boundingBox();
    const root = await page.getByTestId("splitter").boundingBox();
    if (!box || !root) throw new Error("missing box");
    // The start pane takes 30% from the right edge.
    expect(root.x + root.width - (box.x + box.width / 2)).toBeCloseTo(180, 0);
    const y = box.y + box.height / 4;

    await page.mouse.move(box.x + box.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(root.x + 300, y, { steps: 5 });
    await page.mouse.up();
    await expect(page.getByTestId("size-display")).toHaveText("50");

    await separator.press("ArrowLeft");
    await expect(page.getByTestId("size-display")).toHaveText("51");
  });

  test("keeps the drag while the pointer crosses an iframe", async ({
    page,
  }) => {
    const separator = page.getByRole("separator", { name: "Resize preview" });
    const box = await separator.boundingBox();
    const root = await page.getByTestId("iframe-splitter").boundingBox();
    const iframe = await page.getByTitle("Preview").boundingBox();
    if (!box || !root || !iframe) throw new Error("missing box");
    const y = box.y + box.height / 2;

    await page.mouse.move(box.x + box.width / 2, y);
    await page.mouse.down();
    // Well inside the iframe, which would swallow the moves without capture.
    const x = iframe.x + iframe.width / 2;
    expect(x - root.x).toBeGreaterThan(300);
    await page.mouse.move(x, y, { steps: 10 });
    await page.mouse.up();

    await expect(page.getByTestId("preview-size-display")).toHaveText(
      String(Math.round(((x - root.x) / root.width) * 100)),
    );
  });

  test("draws the focus ring for keyboard focus only", async ({ page }) => {
    const separator = page.getByRole("separator", { name: "Resize preview" });
    const outline = () =>
      separator.evaluate((node) => getComputedStyle(node).outlineStyle);
    const box = await separator.boundingBox();
    if (!box) throw new Error("missing box");

    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(separator).toBeFocused();
    expect(await outline()).toBe("none");

    // The tab stop just before it.
    await page.getByRole("separator", { name: "Resize terminal" }).focus();
    await page.keyboard.press("Tab");
    await expect(separator).toBeFocused();
    expect(await outline()).toBe("solid");
  });

  test("highlights the separator once the pointer rests on it", async ({
    page,
  }) => {
    const separator = page.getByRole("separator", { name: "Resize preview" });
    const box = await separator.boundingBox();
    if (!box) throw new Error("missing box");

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(separator).toHaveClass(/bx--splitter__separator--hover/);
    await expect(separator).toHaveCSS("cursor", "col-resize");

    await page.mouse.move(0, 0);
    await expect(separator).not.toHaveClass(/bx--splitter__separator--hover/);
  });

  test("resizes a nested vertical splitter with the keyboard", async ({
    page,
  }) => {
    const inner = page.getByRole("separator", { name: "Resize terminal" });
    await inner.focus();
    await page.keyboard.press("Shift+ArrowDown");
    await expect(inner).toHaveAttribute("aria-valuenow", "60");

    const box = await inner.boundingBox();
    const innerRoot = await page.getByTestId("inner-splitter").boundingBox();
    if (!box || !innerRoot) throw new Error("missing box");
    expect(box.y + box.height / 2 - innerRoot.y).toBeCloseTo(180, 0);
  });

  test("holds a pixel min as the splitter resizes", async ({ page }) => {
    const separator = page.getByRole("separator", { name: "Resize sidebar" });
    const sidebar = page.getByText("Sidebar");

    await expect(separator).toHaveAttribute("aria-valuemin", "25");
    await expect(separator).toHaveAttribute("aria-valuenow", "25");
    expect((await sidebar.boundingBox())?.width).toBeCloseTo(150, 0);

    await page
      .getByTestId("pixel-container")
      .evaluate((node) => (node.style.width = "300px"));

    await expect(separator).toHaveAttribute("aria-valuemin", "50");
    expect((await sidebar.boundingBox())?.width).toBeCloseTo(150, 0);
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    // The preview iframe's srcdoc is scaffolding; axe would audit it as a
    // standalone page (main landmark, h1).
    const results = await new AxeBuilder({ page })
      .include("#app")
      .exclude('iframe[title="Preview"]')
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
