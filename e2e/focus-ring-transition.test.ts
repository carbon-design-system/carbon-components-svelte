import { expect, test } from "@playwright/test";

// A focus ring should appear at once. Tab through every focusable control in
// the fixture and collect any outline or box-shadow transition running right
// after focus lands, which means a ring is fading in.
test("focus rings snap instead of fading in", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/focus-ring.html");
  await expect(page.getByRole("button", { name: "Button" })).toBeVisible();

  const fading = new Set<string>();
  let first = -1;
  for (let i = 0; i < 120; i++) {
    // biome-ignore lint/performance/noAwaitInLoops: each Tab must land before the next
    await page.keyboard.press("Tab");
    const { focused, transitions } = await page.evaluate(() => {
      const focused = document.activeElement
        ? [...document.querySelectorAll("*")].indexOf(document.activeElement)
        : -1;
      const transitions = document
        .getAnimations()
        .filter(
          (animation): animation is CSSTransition =>
            animation instanceof CSSTransition &&
            /^(outline|box-shadow)/.test(animation.transitionProperty),
        )
        .map((transition) => {
          const effect = transition.effect as KeyframeEffect;
          const target = effect.target as Element;
          return `${transition.transitionProperty} on .${[...target.classList].join(".")}${effect.pseudoElement ?? ""}`;
        });
      return { focused, transitions };
    });
    for (const transition of transitions) fading.add(transition);
    // Stop once focus wraps back around to the first control.
    if (i === 0) first = focused;
    else if (focused === first) break;
  }

  expect(first).toBeGreaterThan(-1);
  expect([...fading]).toEqual([]);
});
