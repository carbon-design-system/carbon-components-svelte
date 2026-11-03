import { expect, type Page, test } from "./helpers/host";

const MENUS = [
  ["Dropdown in place", "inplace", "In place"],
  ["Dropdown in a portal", "portal", "Portal"],
  ["ComboBox", "combo", "ComboBox"],
  ["MultiSelect", "multi", "MultiSelect"],
] as const;

// What a menu may animate: opacity, transform and the size of the one
// element that collapses.
const ALLOWED =
  /^(opacity|transform|overflow|height|(padding|margin)(Top|Bottom)|border(Top|Bottom)Width|offset|easing|composite|computedOffset)$/;

const field = (page: Page, name: string) =>
  page.getByRole("combobox", { name, exact: true });

/**
 * The properties animated on the menu, or null while none runs. The field and
 * its chevron have their own CSS transitions, so only the menu counts.
 */
const menuAnimation = (page: Page, id: string) =>
  page.evaluate((id) => {
    const menu = document.getElementById(`menu-${id}`);
    const running = document.getAnimations().filter((animation) => {
      const target = (animation.effect as KeyframeEffect | null)?.target;
      return menu && target && menu.contains(target);
    });
    return running.length === 0
      ? null
      : running.flatMap((animation) =>
          (animation.effect as KeyframeEffect)
            .getKeyframes()
            .flatMap((keyframe) => Object.keys(keyframe)),
        );
  }, id);

async function open(page: Page, id: string, name: string) {
  await field(page, name).click();
  await expect(page.locator(`#menu-${id}`)).toBeVisible();
  // Let the entrance end.
  await expect.poll(() => menuAnimation(page, id)).toBeNull();
}

test.describe("Motion on list box menus", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/motion-list-box-menu.html");
  });

  for (const [label, id, name] of MENUS) {
    test.describe(label, () => {
      test("removes the menu at once under reduced motion", async ({
        page,
      }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await field(page, name).click();
        await expect(page.locator(`#menu-${id}`)).toBeVisible();
        expect(await menuAnimation(page, id)).toBeNull();

        await field(page, name).press("Escape");

        await expect(page.locator(`#menu-${id}`)).toHaveCount(0, {
          timeout: 100,
        });
      });

      test("animates only opacity, transform and size, and takes no clicks while it leaves", async ({
        page,
      }) => {
        await page.emulateMedia({ reducedMotion: "no-preference" });
        await open(page, id, name);

        await field(page, name).press("Escape");

        await expect(field(page, name)).toHaveAttribute(
          "aria-expanded",
          "false",
        );
        await expect.poll(() => menuAnimation(page, id)).toContain("opacity");
        expect(
          (await menuAnimation(page, id))?.filter(
            (property) => !ALLOWED.test(property),
          ),
        ).toEqual([]);
        expect(
          await page.locator(`#menu-${id}`).evaluate((menu) => {
            return (menu as HTMLElement).inert;
          }),
        ).toBe(true);

        await expect(page.locator(`#menu-${id}`)).toHaveCount(0);
      });
    });
  }

  test("a menu that flips upward in a portal stays on its side while it opens and closes", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    // Leave less room below the field than the menu needs. A menu placed
    // while it is still short would open below and then jump above.
    await page.addStyleTag({
      content: ".bottom { position: fixed; bottom: 100px; width: 300px; }",
    });
    const sample = (until: "elapsed" | "removed") =>
      page.evaluate(
        (until) =>
          new Promise<number[]>((resolve) => {
            const rows: number[] = [];
            const start = performance.now();
            const tick = () => {
              const menu = document.getElementById("menu-portal-flip");
              if (menu) {
                rows.push(Math.round(menu.getBoundingClientRect().top));
              }
              const done =
                until === "elapsed"
                  ? performance.now() - start > 300
                  : menu === null;
              if (done) resolve(rows);
              else requestAnimationFrame(tick);
            };
            tick();
          }),
        until,
      );

    await field(page, "Portal, flips upward").click();
    const opening = await sample("elapsed");
    expect(opening.length).toBeGreaterThan(5);
    expect(new Set(opening).size).toBe(1);

    await field(page, "Portal, flips upward").press("Escape");
    const closing = await sample("removed");
    expect(closing.length).toBeGreaterThan(2);
    expect(new Set(closing)).toEqual(new Set(opening));
  });
});
