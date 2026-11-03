import { expect, type Page, test } from "./helpers/host";

const SURFACES = [["MenuButton", "Actions"]] as const;

const KEYFRAME_METADATA = ["offset", "computedOffset", "easing", "composite"];

/** The properties each running animation on a menu animates. */
const menuAnimations = (page: Page) =>
  page.evaluate(
    (metadata) =>
      document
        .getAnimations()
        .filter(
          (animation) =>
            (animation.effect as KeyframeEffect | null)?.target?.getAttribute(
              "role",
            ) === "menu",
        )
        .flatMap((animation) =>
          (animation.effect as KeyframeEffect)
            .getKeyframes()
            .flatMap((keyframe) => Object.keys(keyframe))
            .filter((property) => !metadata.includes(property)),
        ),
    KEYFRAME_METADATA,
  );

async function openMenu(page: Page, name: string) {
  await page.goto("/motion-menus.html");
  const trigger = page.getByRole("button", { name, exact: true });
  await trigger.click();
  await expect(page.getByRole("menu")).toBeVisible();
  return trigger;
}

for (const [surface, name] of SURFACES) {
  test.describe(`Motion on ${surface}`, () => {
    test("flies the menu out, keeping it visible and inert, with the trigger already closed", async ({
      page,
      browserName,
    }) => {
      test.skip(browserName !== "chromium", "slows animations through CDP");
      await page.emulateMedia({ reducedMotion: "no-preference" });
      const trigger = await openMenu(page, name);
      // Let the entrance end, then slow the exit so it can be inspected.
      await expect.poll(() => menuAnimations(page)).toEqual([]);
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Animation.enable");
      await cdp.send("Animation.setPlaybackRate", { playbackRate: 0.05 });

      await page.keyboard.press("Escape");

      await expect.poll(() => menuAnimations(page)).not.toEqual([]);
      const properties = new Set(await menuAnimations(page));
      expect([...properties].sort()).toEqual(["opacity", "transform"]);
      const menu = page.getByRole("menu");
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(trigger).toBeFocused();
      await expect(menu).toHaveCount(1);
      expect(
        await menu.evaluate((node) => ({
          visibility: getComputedStyle(node).visibility,
          inert: (node as HTMLElement).inert,
        })),
      ).toEqual({ visibility: "visible", inert: true });

      await cdp.send("Animation.setPlaybackRate", { playbackRate: 1 });
      await expect(menu).toHaveCount(0);
    });

    test("removes the menu at once under reduced motion", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await openMenu(page, name);
      expect(await menuAnimations(page)).toEqual([]);

      await page.keyboard.press("Escape");

      await expect(page.getByRole("menu")).toHaveCount(0, { timeout: 100 });
      expect(await menuAnimations(page)).toEqual([]);
    });
  });
}
