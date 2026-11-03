import { expect, test } from "./helpers/host";

test.describe("Toggle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/toggle.html");
  });

  test("renders with label", async ({ page }) => {
    await expect(
      page.getByRole("switch", { name: "Enable notifications" }),
    ).toBeVisible();
  });

  test("can be located by getByRole when labelText is set", async ({
    page,
  }) => {
    const toggle = page.getByRole("switch", { name: "Enable notifications" });
    await expect(toggle).toBeVisible();
    await expect(toggle).not.toBeChecked();
    await page
      .getByTestId("toggle-notifications")
      .locator("label.bx--toggle-input__label")
      .click();
    await expect(toggle).toBeChecked();
  });

  test("can be located and interacted with by data-testid", async ({
    page,
  }) => {
    const wrapper = page.getByTestId("toggle-notifications");
    await expect(wrapper).toBeVisible();
    const toggle = wrapper.getByRole("switch");
    await wrapper.locator("label.bx--toggle-input__label").click();
    await expect(toggle).toBeChecked();
  });

  test("disabled toggle cannot be toggled", async ({ page }) => {
    const toggle = page.getByRole("switch", { name: "Disabled toggle" });
    await expect(toggle).toBeDisabled();
  });

  test("lays the state text out inside the toggle's box", async ({ page }) => {
    const row = page.getByTestId("toggle-row");
    const textRight = await row
      .locator(".bx--toggle__text--off")
      .evaluate((node) => node.getBoundingClientRect().right);
    const neighborLeft = await page
      .getByTestId("toggle-row-neighbor")
      .evaluate((node) => node.getBoundingClientRect().left);

    expect(textRight).toBeLessThanOrEqual(neighborLeft);
  });

  test("keeps its width when the state flips", async ({ page }) => {
    const toggle = page.getByTestId("toggle-row").locator(".bx--form-item");
    const before = (await toggle.boundingBox())?.width ?? 0;
    await page.getByTestId("toggle-row").getByText("Paused").click();
    await expect(
      page.getByRole("switch", { name: "Live prices" }),
    ).toBeChecked();
    const after = (await toggle.boundingBox())?.width ?? 0;

    expect(before).toBeGreaterThan(48);
    expect(after).toBe(before);
  });

  test("mirrors the handle and state text in RTL", async ({ page }) => {
    // How far the state text and the handle sit from the inline-start edge,
    // and how far the checked handle travels toward the inline end.
    const measure = (testId: string) =>
      page.getByTestId(testId).evaluate((node) => {
        const toggle = node.querySelector(".bx--toggle__switch");
        const text = [
          ...node.querySelectorAll(
            ".bx--toggle__text--off, .bx--toggle__text--on",
          ),
        ].find((el) => getComputedStyle(el).visibility === "visible");
        if (!toggle || !text) throw new Error("no switch or text");
        const rtl = getComputedStyle(toggle).direction === "rtl";
        const box = toggle.getBoundingClientRect();
        const label = text.getBoundingClientRect();
        const handle = getComputedStyle(toggle, "::after");
        const travel = new DOMMatrix(handle.transform).m41;
        return {
          textStart: rtl ? box.right - label.right : label.left - box.left,
          handleStart: Number.parseFloat(rtl ? handle.right : handle.left),
          handleTravel: rtl ? 0 - travel : travel,
        };
      });
    const flip = (testId: string) =>
      page.getByTestId(testId).locator("label.bx--toggle-input__label").click();
    const toggles = [
      { testId: "toggle-notifications", textStart: 56, travel: 24 },
      { testId: "toggle-row", textStart: 40, travel: 17 },
    ];

    await page.evaluate(() => document.fonts.ready);
    // Most pages set no `dir`, so that case must read as LTR.
    for (const dir of [null, "ltr", "rtl"]) {
      // biome-ignore lint/performance/noAwaitInLoops: one direction at a time
      await page.evaluate((dir) => {
        if (dir) document.documentElement.dir = dir;
        else document.documentElement.removeAttribute("dir");
      }, dir);
      for (const { testId, textStart, travel } of toggles) {
        const name = `${testId}, dir=${dir ?? "none"}`;
        // Poll: the handle slides for a moment after the flip.
        // biome-ignore lint/performance/noAwaitInLoops: one toggle at a time
        await expect
          .poll(() => measure(testId), { message: `${name}, off` })
          .toEqual({ textStart, handleStart: 3, handleTravel: 0 });
        await flip(testId);
        await expect
          .poll(() => measure(testId), { message: `${name}, on` })
          .toEqual({ textStart, handleStart: 3, handleTravel: travel });
        await flip(testId);
      }
    }
  });
});
