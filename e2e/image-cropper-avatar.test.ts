import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// The avatar recipe from the docs: a FileUploaderButton, a Modal holding an
// ImageCropper, a preview, and a UserAvatar that shows the saved crop.

/** A PNG of four colored quadrants, drawn in the page. */
async function picture(page: Page, width: number, height: number) {
  const dataUrl = await page.evaluate(
    ([w, h]) => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("no canvas");
      const colors = ["#ff0000", "#00c800", "#0000ff", "#ffff00"];
      colors.forEach((color, index) => {
        context.fillStyle = color;
        context.fillRect(
          (index % 2) * (w / 2),
          Math.floor(index / 2) * (h / 2),
          w / 2,
          h / 2,
        );
      });
      return canvas.toDataURL("image/png");
    },
    [width, height],
  );
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

test.describe("ImageCropper: avatar recipe", () => {
  test("crops a chosen file in a dialog and shows it as the avatar", async ({
    page,
  }) => {
    await page.goto("/image-cropper-avatar.html");
    await page.locator("input[type=file]").setInputFiles({
      name: "photo.png",
      mimeType: "image/png",
      buffer: await picture(page, 800, 600),
    });

    const dialog = page.getByRole("dialog", { name: "Crop your photo" });
    await expect(dialog).toBeVisible();
    const save = dialog.getByRole("button", { name: "Save" });
    // Save waits for the image to load.
    await expect(save).toBeEnabled();
    await expect(
      dialog.getByRole("group", { name: "Crop your photo" }),
    ).toHaveAttribute("aria-roledescription", "image cropper");
    // The preview is drawn once the crop settles.
    await expect(dialog.locator("img")).toHaveAttribute("src", /^blob:/);

    const results = await new AxeBuilder({ page })
      .include(".bx--modal")
      .analyze();
    expect(results.violations).toEqual([]);

    await save.click();
    await expect(dialog).toBeHidden();
    const avatar = page.getByRole("img", { name: "Ada Lovelace" });
    await expect(avatar).toHaveAttribute("src", /^blob:/);
    // The export is 256 pixels across, and square: the crop is.
    expect(
      await avatar.evaluate((img) => [
        (img as HTMLImageElement).naturalWidth,
        (img as HTMLImageElement).naturalHeight,
      ]),
    ).toEqual([256, 256]);
  });

  test("closes without a change on Cancel and on Escape", async ({ page }) => {
    await page.goto("/image-cropper-avatar.html");
    const chooser = page.locator("input[type=file]");
    const buffer = await picture(page, 400, 400);
    await chooser.setInputFiles({
      name: "a.png",
      mimeType: "image/png",
      buffer,
    });
    const dialog = page.getByRole("dialog", { name: "Crop your photo" });
    await expect(
      dialog.getByRole("group", { name: "Crop your photo" }),
    ).toBeFocused();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    // The same file can be chosen again.
    await chooser.setInputFiles({
      name: "a.png",
      mimeType: "image/png",
      buffer,
    });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("group", { name: "Crop your photo" }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("img", { name: "Ada Lovelace" })).toHaveCount(
      0,
    );
  });
});
