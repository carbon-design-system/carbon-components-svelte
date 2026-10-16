import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

/** The rendered color of the pixel at (`x`, `y`) inside `locator`'s box. */
async function pixelAt(page: Page, locator: Locator, x: number, y: number) {
  const png = await locator.screenshot();
  return page.evaluate(
    async ({ data, x, y }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${data}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("No 2D context");
      context.drawImage(image, 0, 0);
      const [r, g, b] = context.getImageData(x, y, 1, 1).data;
      return { r, g, b };
    },
    { data: png.toString("base64"), x, y },
  );
}

test("an invalid MultiSelect shows the focus outline while focused", async ({
  page,
}) => {
  await page.goto("/multiselect-invalid-focus.html");
  const listBox = page.locator(".bx--multi-select");
  const field = page.getByRole("combobox", { name: /Fruits/ });

  // Invalid and unfocused: the red invalid outline.
  const box = await listBox.boundingBox();
  if (!box) throw new Error("No list box");
  const edgeY = Math.round(box.height / 2);
  const idle = await pixelAt(page, listBox, 1, edgeY);
  expect(idle.r).toBeGreaterThan(idle.b);

  // Focused: the blue focus outline paints over it, as in Dropdown.
  await field.focus();
  await expect(
    page.locator(".bx--list-box__field--wrapper--input-focused"),
  ).toHaveCount(1);
  const focused = await pixelAt(page, listBox, 1, edgeY);
  expect(focused.b).toBeGreaterThan(focused.r);
});
