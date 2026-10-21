import { expect, type Page, test } from "./helpers/host";

const thumb = (page: Page, name: string) =>
  page.getByRole("slider", { name, exact: true });

// Where the thumb's center sits along the track, from 0 (left) to 1 (right).
const thumbPosition = (page: Page, name: string) =>
  thumb(page, name).evaluate((el) => {
    const track = el.parentElement?.querySelector(".bx--slider__track");
    const box = el.getBoundingClientRect();
    const rect = track?.getBoundingClientRect();
    if (!rect) return Number.NaN;
    return (box.left + box.width / 2 - rect.left) / rect.width;
  });

test.describe("LayoutDirection", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/layout-direction.html");
  });

  test("puts min at the right end of an RTL Slider", async ({ page }) => {
    const cases = [
      ["Replicas", 0.8],
      ["Plain RTL replicas", 0.8],
      ["LTR replicas", 0.2],
    ] as const;
    for (const [name, position] of cases) {
      // biome-ignore lint/performance/noAwaitInLoops: reads one slider at a time
      await expect
        .poll(() => thumbPosition(page, name), { message: name })
        .toBeCloseTo(position, 1);
    }
  });

  test("moves an RTL Slider the way the pointer and keys point", async ({
    page,
  }) => {
    const slider = thumb(page, "Replicas");
    const track = page.locator(".bx--slider__track").first();
    const box = await track.boundingBox();
    if (!box) throw new Error("no track");

    // 10% in from the right edge is 1 in a 0 to 10 range.
    await page.mouse.click(box.x + box.width * 0.9, box.y + box.height / 2);
    await expect(slider).toHaveAttribute("aria-valuenow", "1");

    await slider.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(slider).toHaveAttribute("aria-valuenow", "2");
    await page.keyboard.press("ArrowRight");
    await expect(slider).toHaveAttribute("aria-valuenow", "1");
    await page.keyboard.press("ArrowUp");
    await expect(slider).toHaveAttribute("aria-valuenow", "2");
  });

  test("keeps a portalled menu in its subtree's direction", async ({
    page,
  }) => {
    for (const [name, dir] of [
      ["RTL region", "rtl"],
      ["LTR region", "ltr"],
    ] as const) {
      // biome-ignore lint/performance/noAwaitInLoops: one menu opens at a time
      await page.getByRole("combobox", { name }).click();
      const option = page.getByRole("option", { name: "eu-west-1" });
      await expect(option).toBeVisible();
      await expect(page.locator("body > [data-portal]")).toHaveAttribute(
        "dir",
        dir,
      );
      await expect(option).toHaveCSS("direction", dir);
      await page.keyboard.press("Escape");
      await expect(option).toBeHidden();
    }
  });
});
