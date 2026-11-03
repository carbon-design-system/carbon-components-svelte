import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

interface Motion {
  /** `box` for the dialog itself, otherwise the pseudo-element. */
  target: string;
  /** The keyframes name, or the transitioned property. */
  name: string;
  duration: number;
}

/** Clicks `selector` in the page, then lists what animates two frames on. */
function motionAfterClick(page: Page, selector: string): Promise<Motion[]> {
  return page.evaluate(
    (selector) =>
      new Promise<Motion[]>((resolve) => {
        document.querySelector<HTMLElement>(selector)?.click();
        requestAnimationFrame(() =>
          requestAnimationFrame(() =>
            resolve(
              document.getAnimations().flatMap((animation) => {
                const effect = animation.effect as KeyframeEffect;
                if (!effect.target?.matches("dialog")) return [];
                return {
                  target: effect.pseudoElement ?? "box",
                  name:
                    animation instanceof CSSAnimation
                      ? animation.animationName
                      : (animation as CSSTransition).transitionProperty,
                  duration: Number(effect.getTiming().duration),
                };
              }),
            ),
          ),
        );
      }),
    selector,
  );
}

test.describe("Dialog motion", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dialog.html");
  });

  test("the backdrop and the box animate in over 240 ms", async ({ page }) => {
    const motion = await motionAfterClick(page, '[data-testid="open-modal"]');

    expect(motion).toContainEqual({
      target: "::backdrop",
      name: "dialog-fade-in",
      duration: 240,
    });
    expect(motion).toContainEqual({
      target: "box",
      name: "dialog-enter",
      duration: 240,
    });
  });

  test("the dialog stays open while it animates out over 240 ms", async ({
    page,
  }) => {
    await page.getByTestId("open-modal").click();
    const dialog = page.getByTestId("modal-dialog");
    await expect(dialog).toBeVisible();
    await page.waitForFunction(() => document.getAnimations().length === 0);

    const motion = await motionAfterClick(
      page,
      '[data-testid="modal-close-button"]',
    );

    await expect(dialog).toHaveClass(/bx--dialog--closing/);
    expect(motion).toContainEqual({
      target: "::backdrop",
      name: "opacity",
      duration: 240,
    });
    for (const name of ["opacity", "transform"]) {
      expect(motion).toContainEqual({ target: "box", name, duration: 240 });
    }

    await expect(dialog).toBeHidden();
    await expect(page.getByTestId("modal-close-trigger")).toHaveText(
      "close-button",
    );
    await expect(page.getByTestId("open-modal")).toBeFocused();
  });

  test("a non-modal dialog animates its box without a backdrop", async ({
    page,
  }) => {
    const motion = await motionAfterClick(
      page,
      '[data-testid="open-non-modal"]',
    );

    expect(motion).toEqual([
      { target: "box", name: "dialog-enter", duration: 240 },
    ]);
  });

  test("nothing animates under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });

    expect(await motionAfterClick(page, '[data-testid="open-modal"]')).toEqual(
      [],
    );

    const dialog = page.getByTestId("modal-dialog");
    await expect(dialog).toBeVisible();
    await page.getByTestId("modal-close-button").click();

    await expect(dialog).toBeHidden();
    await expect(dialog).not.toHaveClass(/bx--dialog--closing/);
  });
});
