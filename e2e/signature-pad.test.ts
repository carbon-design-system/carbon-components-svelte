import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";
import { getSignature } from "./helpers/signature-pad";

const defaultPad = (page: Page) =>
  page.getByTestId("signature-default").getByRole("img", {
    name: /^Signature/,
  });

/** Points are fractions of the pad's width and height. */
async function draw(page: Page, pad: Locator, points: [number, number][]) {
  const box = await pad.boundingBox();
  if (!box) throw new Error("pad is not visible");
  const at = ([x, y]: [number, number]) => ({
    x: box.x + box.width * x,
    y: box.y + box.height * y,
  });
  const [first, ...rest] = points.map(at);
  await page.mouse.move(first.x, first.y);
  await page.mouse.down();
  for (const point of rest)
    await page.mouse.move(point.x, point.y, { steps: 4 });
  await page.mouse.up();
}

const wave: [number, number][] = [
  [0.1, 0.6],
  [0.25, 0.3],
  [0.4, 0.7],
  [0.55, 0.3],
  [0.7, 0.65],
  [0.85, 0.4],
];

test.describe("SignaturePad", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signature-pad.html");
    await expect(defaultPad(page)).toBeVisible();
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    const scan = () => new AxeBuilder({ page }).include("#app").analyze();
    expect((await scan()).violations).toEqual([]);

    await draw(page, defaultPad(page), wave);
    expect((await scan()).violations).toEqual([]);

    await page
      .getByTestId("signature-default")
      .getByRole("tab", { name: "Type" })
      .click();
    expect((await scan()).violations).toEqual([]);

    await page
      .getByTestId("signature-default")
      .getByRole("tab", { name: "Upload" })
      .click();
    expect((await scan()).violations).toEqual([]);
  });

  test("draws, undoes and clears with the mouse", async ({ page }) => {
    const root = page.getByTestId("signature-default");
    const pad = defaultPad(page);
    await expect(pad).toHaveAccessibleName(
      "Signature pad, draw your signature",
    );

    await draw(page, pad, wave);
    await expect(pad).toHaveAccessibleName("Signature captured");
    await expect(page.getByTestId("signature-type")).toHaveText("drawn");
    const svg = (await getSignature(page))?.svg;
    expect(svg).toContain('viewBox="0 0 600 200"');
    expect(svg).toContain('fill="#161616"');

    await draw(
      page,
      pad,
      wave.map(([x, y]) => [x, y + 0.2]),
    );
    await expect(root.locator("path.bx--signature-pad__ink")).toHaveCount(2);

    await root.getByRole("button", { name: "Undo" }).click();
    await expect(root.locator("path.bx--signature-pad__ink")).toHaveCount(1);

    await root.getByRole("button", { name: "Clear" }).click();
    await expect(root.locator("path.bx--signature-pad__ink")).toHaveCount(0);
    await expect(page.getByTestId("signature-type")).toHaveText("");
  });

  test("signs from the keyboard with the Type tab", async ({ page }) => {
    const root = page.getByTestId("signature-default");
    await root.getByRole("tab", { name: "Draw" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(root.getByRole("tab", { name: "Type" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await page.keyboard.press("Tab");
    // The tab panel is the next stop; the input follows it.
    await root.getByLabel("Type your name").focus();
    await page.keyboard.type("Ada Lovelace");

    await expect(page.getByTestId("signature-type")).toHaveText("typed");
    const value = await getSignature(page);
    expect(value?.text).toBe("Ada Lovelace");
    expect(value?.svg).toContain("<text");
    expect(value?.png).toMatch(/^data:image\/png;base64,/);
  });

  test("blocks a required form until it is signed", async ({ page }) => {
    const form = page.getByTestId("signature-form");
    await form.getByRole("button", { name: "Approve" }).click();
    await expect(form.getByRole("alert")).toHaveText("Add your signature");
    await expect(page.getByTestId("signature-submitted")).toHaveText("");

    // The failed submit moves focus to the tab, which scrolls it into view;
    // draw once that has settled.
    await expect(form.getByRole("tab", { name: "Draw" })).toBeFocused();
    await draw(page, form.getByRole("img", { name: /^Signature pad/ }), wave);
    await expect(form.getByRole("alert")).toHaveCount(0);
    await form.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByTestId("signature-submitted")).toHaveText(
      "submitted",
    );
  });

  test("keeps its layout and ink in RTL", async ({ page }) => {
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const root = page.getByTestId("signature-default");
    const pad = defaultPad(page);
    const box = await pad.boundingBox();
    if (!box) throw new Error("pad is not visible");

    // A stroke at the physical left stays at the physical left.
    await draw(page, pad, [
      [0.1, 0.5],
      [0.2, 0.3],
      [0.3, 0.5],
    ]);
    const ink = await root.locator("path.bx--signature-pad__ink").boundingBox();
    if (!ink) throw new Error("no ink");
    expect(ink.x + ink.width).toBeLessThan(box.x + box.width / 2);

    // Undo points back, so it mirrors.
    const transform = await root
      .locator(".bx--signature-pad__undo .bx--btn__icon")
      .evaluate((icon) => getComputedStyle(icon).transform);
    expect(transform).toBe("matrix(-1, 0, 0, 1, 0, 0)");
  });

  test("draws in the theme's text color, and exports a dark ink", async ({
    page,
  }) => {
    const root = page.getByTestId("signature-default");
    await draw(page, defaultPad(page), wave);
    const ink = root.locator("path.bx--signature-pad__ink").first();
    const fill = () => ink.evaluate((node) => getComputedStyle(node).fill);

    const white = await fill();
    await page.evaluate(() =>
      document.documentElement.classList.add("bx--g100"),
    );
    const dark = await fill();

    expect(white).not.toBe(dark);
    // Light ink on the dark pad.
    const [red] = dark.match(/\d+/g)?.map(Number) ?? [0];
    expect(red).toBeGreaterThan(200);
    // The export stays a dark ink on a transparent background.
    const svg = (await getSignature(page))?.svg;
    expect(svg).toContain('fill="#161616"');
    expect(svg).not.toContain("<rect");
  });

  test("keeps the ink and the area's edge in forced colors", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "WebKit does not force colors");
    await page.emulateMedia({ forcedColors: "active" });
    const root = page.getByTestId("signature-default");
    await draw(page, defaultPad(page), wave);

    const styles = await root.evaluate((node) => {
      const ink = node.querySelector(".bx--signature-pad__ink");
      const surface = node.querySelector(".bx--signature-pad__surface");
      if (!ink || !surface) throw new Error("missing");
      return {
        fill: getComputedStyle(ink).fill,
        text: getComputedStyle(surface).color,
        border: getComputedStyle(surface).borderBlockEndWidth,
        borderColor: getComputedStyle(surface).borderBlockEndColor,
        background: getComputedStyle(surface).backgroundColor,
      };
    });

    expect(styles.fill).toBe(styles.text);
    expect(styles.fill).not.toBe(styles.background);
    expect(styles.border).toBe("1px");
    expect(styles.borderColor).toBe(styles.text);
  });

  test("shows the invalid and disabled states", async ({ page }) => {
    const invalid = page.getByTestId("signature-invalid");
    await expect(invalid.getByRole("alert")).toHaveText(
      "Signature is required",
    );
    await expect(invalid.getByRole("group")).toHaveAttribute(
      "aria-invalid",
      "true",
    );

    const disabled = page.getByTestId("signature-disabled");
    await expect(disabled.getByRole("tab", { name: "Type" })).toBeDisabled();
    await expect(
      disabled.getByRole("button", { name: "Clear" }),
    ).toBeDisabled();
  });
});
