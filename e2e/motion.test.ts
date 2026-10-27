import { expect, test } from "./helpers/host";

test.describe("Motion transitions", () => {
  test("runs an animation on exit, then removes the element", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/motion.html");

    await page.getByRole("button", { name: "Toggle" }).click();

    // Three exits are running; `fly` and `slide` last 240ms.
    await expect
      .poll(() => page.evaluate(() => document.getAnimations().length))
      .toBeGreaterThan(0);
    await expect(page.getByTestId("fly")).toBeVisible();

    await expect(page.getByTestId("fly")).toHaveCount(0);
    await expect(page.getByTestId("slide")).toHaveCount(0);
    await expect(page.getByTestId("fade")).toHaveCount(0);
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  });

  test("slide shrinks the box rather than its colors", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/motion.html");

    await page.getByRole("button", { name: "Toggle" }).click();
    const animatedProperties = () =>
      page.evaluate(() =>
        document
          .getAnimations()
          .flatMap(
            (animation) =>
              (animation.effect as KeyframeEffect | null)
                ?.getKeyframes()
                .flatMap((keyframe) => Object.keys(keyframe)) ?? [],
          ),
      );

    // Svelte starts the exit a microtask after the click.
    await expect.poll(animatedProperties).toContain("height");
    const properties = await animatedProperties();
    expect(properties).toContain("opacity");
    expect(properties).toContain("transform");
    for (const property of properties) {
      expect(property).not.toMatch(
        /color|outline|boxShadow|borderTopColor|borderBottomColor/i,
      );
    }
  });

  test("removes the element at once under reduced motion, with no animation", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/motion.html");

    await page.getByRole("button", { name: "Toggle" }).click();

    await expect(page.getByTestId("fly")).toHaveCount(0, { timeout: 100 });
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  });
});
