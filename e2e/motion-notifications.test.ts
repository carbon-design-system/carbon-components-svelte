import { expect, type Page, test } from "./helpers/host";

const SIZE_PROPERTY =
  /^(opacity|transform|overflow|height|(padding|margin|border)(Top|Bottom)(Width)?)$/;
const KEYFRAME_METADATA = new Set([
  "offset",
  "computedOffset",
  "easing",
  "composite",
]);

// Web Animations that script started, as Svelte does. CSS transitions, such
// as a button's hover color, are not motion this feature owns.
const animationCount = (page: Page) =>
  page.evaluate(
    () =>
      document
        .getAnimations()
        .filter(
          (animation) =>
            !(animation instanceof CSSTransition) &&
            !(animation instanceof CSSAnimation),
        ).length,
  );

/** Properties the running animations set, without keyframe metadata. */
const animatedProperties = (page: Page, metadata: string[]) =>
  page.evaluate((skip) => {
    const properties = new Set<string>();
    for (const animation of document.getAnimations()) {
      if (animation instanceof CSSTransition) continue;
      if (animation instanceof CSSAnimation) continue;
      const frames = (animation.effect as KeyframeEffect).getKeyframes();
      for (const frame of frames) {
        for (const key of Object.keys(frame)) {
          if (!skip.includes(key)) properties.add(key);
        }
      }
    }
    return [...properties];
  }, metadata);

/** Start an exit, then wait for the animation Svelte builds for it. */
async function exitAnimates(page: Page, close: () => Promise<void>) {
  await close();
  await expect
    .poll(
      async () =>
        (await animatedProperties(page, [...KEYFRAME_METADATA])).length,
    )
    .toBeGreaterThan(0);
  const properties = await animatedProperties(page, [...KEYFRAME_METADATA]);
  for (const property of properties) {
    expect(property).toMatch(SIZE_PROPERTY);
  }
}

const queueToasts = (page: Page) =>
  page
    .getByRole("region", { name: "Notifications" })
    .locator(".bx--toast-notification");

async function addToQueue(page: Page, count = 1) {
  for (let i = 0; i < count; i++) {
    // biome-ignore lint/performance/noAwaitInLoops: one toast at a time, in order
    await page.getByTestId("queue-add").click();
  }
  await expect(queueToasts(page)).toHaveCount(count);
  // Let the entrances end.
  await expect.poll(() => animationCount(page)).toBe(0);
}

test.describe("Motion on notifications (reduced motion)", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/motion-notifications.html");
  });

  test("InlineNotification closes and opens at once", async ({ page }) => {
    const close = page
      .getByTestId("inline")
      .getByRole("button", { name: "Close notification" });

    await close.click();
    await expect(page.getByTestId("inline")).toHaveCount(0, { timeout: 100 });
    expect(await animationCount(page)).toBe(0);

    await page.getByTestId("toggle-inline").click();
    await expect(page.getByTestId("inline")).toBeVisible();
    expect(await animationCount(page)).toBe(0);
  });

  test("ToastNotification closes and opens at once", async ({ page }) => {
    await page
      .getByTestId("toast")
      .getByRole("button", { name: "Close notification" })
      .click();
    await expect(page.getByTestId("toast")).toHaveCount(0, { timeout: 100 });
    expect(await animationCount(page)).toBe(0);

    await page.getByTestId("toggle-toast").click();
    await expect(page.getByTestId("toast")).toBeVisible();
    expect(await animationCount(page)).toBe(0);
  });

  test("NotificationQueue adds, removes and clears at once", async ({
    page,
  }) => {
    await page.getByTestId("queue-add").click();
    await page.getByTestId("queue-add").click();
    await expect(queueToasts(page)).toHaveCount(2);
    expect(await animationCount(page)).toBe(0);

    await queueToasts(page)
      .first()
      .getByRole("button", { name: "Close notification" })
      .click();
    await expect(queueToasts(page)).toHaveCount(1, { timeout: 100 });

    await page.getByTestId("queue-clear").click();
    await expect(queueToasts(page)).toHaveCount(0, { timeout: 100 });
    expect(await animationCount(page)).toBe(0);
  });
});

test.describe("Motion on notifications", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/motion-notifications.html");
    await expect.poll(() => animationCount(page)).toBe(0);
  });

  test("InlineNotification slides out, and the content below follows", async ({
    page,
  }) => {
    const below = page.getByTestId("below-inline");
    const before = (await below.boundingBox())?.y ?? 0;

    await exitAnimates(page, () =>
      page
        .getByTestId("inline")
        .getByRole("button", { name: "Close notification" })
        .click(),
    );
    await expect(page.getByTestId("inline")).toHaveCount(0);

    expect((await below.boundingBox())?.y ?? 0).toBeLessThan(before);
  });

  test("ToastNotification flies out", async ({ page }) => {
    await exitAnimates(page, () =>
      page
        .getByTestId("toast")
        .getByRole("button", { name: "Close notification" })
        .click(),
    );
    await expect(page.getByTestId("toast")).toHaveCount(0);
  });

  test("NotificationQueue plays the exit of every toast on clear", async ({
    page,
  }) => {
    await addToQueue(page, 2);

    await exitAnimates(page, () => page.getByTestId("queue-clear").click());
    await expect(queueToasts(page)).toHaveCount(0);
    await expect(
      page.getByRole("region", { name: "Notifications" }),
    ).toHaveCount(0);
  });

  test("a toast closed under the pointer leaves the others in place", async ({
    page,
  }) => {
    await addToQueue(page, 3);
    // The newest toast is at the screen edge. Closing it would slide the
    // others toward the edge, under the pointer.
    const newest = queueToasts(page).first();
    const next = queueToasts(page).nth(1);
    const close = newest.getByRole("button", { name: "Close notification" });
    const before = (await next.boundingBox())?.y ?? 0;

    await close.hover();
    await close.click();

    // Sample the next toast through the whole exit.
    const ys = await page.evaluate(async () => {
      const toast = document.querySelectorAll(
        '[aria-label="Notifications"] .bx--toast-notification',
      )[1];
      const samples: number[] = [];
      const end = performance.now() + 600;
      while (performance.now() < end) {
        samples.push(toast.getBoundingClientRect().y);
        // biome-ignore lint/performance/noAwaitInLoops: one sample per frame
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      return samples;
    });

    await expect(queueToasts(page)).toHaveCount(2);
    for (const y of ys) expect(Math.abs(y - before)).toBeLessThan(1);
  });
});
