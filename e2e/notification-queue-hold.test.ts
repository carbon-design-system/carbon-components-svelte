import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

function toasts(page: Page) {
  return page.locator(".bx--toast-notification");
}

function toast(page: Page, title: string) {
  return toasts(page).filter({ hasText: title });
}

function closeButton(page: Page, title: string) {
  return toast(page, title).getByRole("button", { name: "Close notification" });
}

function placeholders(page: Page) {
  return page.locator(".bx--notification-queue__placeholder");
}

async function center(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("The element has no box");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

// From the keyboard, so the pointer stays where the test put it.
async function addToasts(page: Page, count: number) {
  await page.getByTestId("nq-hold-add").focus();
  for (let i = 0; i < count; i++) {
    // biome-ignore lint/performance/noAwaitInLoops: one toast at a time, in order
    await page.keyboard.press("Enter");
  }
}

function titles(page: Page) {
  return page.locator(".bx--toast-notification__title");
}

function titleAt(page: Page, point: { x: number; y: number }) {
  return page.evaluate(
    ({ x, y }) =>
      document
        .elementFromPoint(x, y)
        ?.closest(".bx--toast-notification")
        ?.querySelector(".bx--toast-notification__title")?.textContent ?? null,
    point,
  );
}

async function leave(page: Page) {
  await page.mouse.move(1, 1);
}

for (const position of ["top-right", "bottom-right"]) {
  const top = position.startsWith("top");
  // Newest first from the screen edge.
  const settled = (...names: string[]) => (top ? names : names.reverse());

  test.describe(`NotificationQueue layout hold (${position})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/notification-queue-hold.html?position=${position}`);
    });

    test("a new toast does not move the toast under the pointer", async ({
      page,
    }) => {
      await addToasts(page, 2);
      const before = await center(closeButton(page, "Toast 1"));
      await page.mouse.move(before.x, before.y);

      await addToasts(page, 1);
      // A live region, so it is announced as it arrives.
      await expect(toast(page, "Toast 3")).toHaveAttribute("role", "status");
      const after = await center(closeButton(page, "Toast 1"));
      expect(after.y).toBeCloseTo(before.y, 0);

      await leave(page);
      await expect(titles(page)).toHaveText(
        settled("Toast 3", "Toast 2", "Toast 1"),
      );
    });

    test("a full queue drops a toast only after the pointer leaves", async ({
      page,
    }) => {
      await addToasts(page, 3);
      const before = await center(closeButton(page, "Toast 1"));
      await page.mouse.move(before.x, before.y);

      await addToasts(page, 1);
      await expect(toast(page, "Toast 4")).toBeVisible();
      await expect(toasts(page)).toHaveCount(4);
      const after = await center(closeButton(page, "Toast 1"));
      expect(after.y).toBeCloseTo(before.y, 0);

      await leave(page);
      await expect(titles(page)).toHaveText(
        settled("Toast 4", "Toast 3", "Toast 2"),
      );
    });

    test("a closed toast keeps its space until the pointer leaves", async ({
      page,
    }) => {
      await addToasts(page, 3);
      // The newest toast, at the screen edge. Closing it would slide the
      // others toward the edge.
      const target = await center(closeButton(page, "Toast 3"));
      const next = await center(closeButton(page, "Toast 2"));
      await page.mouse.move(target.x, target.y);

      await page.mouse.click(target.x, target.y);
      await expect(toast(page, "Toast 3")).toHaveCount(0);
      expect((await center(closeButton(page, "Toast 2"))).y).toBeCloseTo(
        next.y,
        0,
      );
      expect(await titleAt(page, target)).toBeNull();
      await expect(placeholders(page)).toHaveAttribute("aria-hidden", "true");
      await expect(placeholders(page)).toBeEmpty();

      await leave(page);
      await expect(placeholders(page)).toHaveCount(0);
      expect((await center(closeButton(page, "Toast 2"))).y).toBeCloseTo(
        target.y,
        0,
      );
    });

    test("a double click on a close button closes one toast", async ({
      page,
    }) => {
      await addToasts(page, 3);
      const target = await center(closeButton(page, "Toast 3"));
      await page.mouse.move(target.x, target.y);

      await page.mouse.dblclick(target.x, target.y);
      await expect(toast(page, "Toast 3")).toHaveCount(0);
      await expect(toasts(page)).toHaveCount(2);
    });

    test("a toast at the far end leaves no space", async ({ page }) => {
      await addToasts(page, 2);
      const target = await center(closeButton(page, "Toast 1"));
      await page.mouse.move(target.x, target.y);

      await page.mouse.click(target.x, target.y);
      await expect(toast(page, "Toast 1")).toHaveCount(0);
      await expect(placeholders(page)).toHaveCount(0);
    });
  });
}

test.describe("NotificationQueue layout hold", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/notification-queue-hold.html");
  });

  test("a keyboard close leaves no space", async ({ page }) => {
    await addToasts(page, 3);
    await page.keyboard.press("F6");
    await expect(closeButton(page, "Toast 3")).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(toast(page, "Toast 3")).toHaveCount(0);
    await expect(placeholders(page)).toHaveCount(0);
    await expect(closeButton(page, "Toast 2")).toBeFocused();
  });

  test("a keyboard close under the pointer keeps the space and moves focus on", async ({
    page,
  }) => {
    await addToasts(page, 3);
    const target = await center(closeButton(page, "Toast 3"));
    const next = await center(closeButton(page, "Toast 2"));
    await page.mouse.move(target.x, target.y);
    await page.keyboard.press("F6");
    await expect(closeButton(page, "Toast 3")).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(toast(page, "Toast 3")).toHaveCount(0);
    await expect(placeholders(page)).toHaveCount(1);
    await expect(closeButton(page, "Toast 2")).toBeFocused();
    expect((await center(closeButton(page, "Toast 2"))).y).toBeCloseTo(
      next.y,
      0,
    );

    // With a space before it, the focused toast's list index is not its
    // index among the toasts.
    const last = await center(closeButton(page, "Toast 1"));
    await page.keyboard.press("Enter");
    await expect(toast(page, "Toast 2")).toHaveCount(0);
    await expect(placeholders(page)).toHaveCount(2);
    await expect(closeButton(page, "Toast 1")).toBeFocused();
    expect((await center(closeButton(page, "Toast 1"))).y).toBeCloseTo(
      last.y,
      0,
    );
  });

  for (const [reducedMotion, animates] of [
    ["no-preference", true],
    ["reduce", false],
  ] as const) {
    test(`the space collapses (${reducedMotion} motion)`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion });
      await addToasts(page, 2);
      const target = await center(closeButton(page, "Toast 2"));
      await page.mouse.move(target.x, target.y);
      await page.mouse.click(target.x, target.y);
      await expect(placeholders(page)).toHaveCount(1);

      // The height as the collapse starts, before the timer removes it.
      const start = page.evaluate(
        () =>
          new Promise<number>((resolve) => {
            const node = document.querySelector(
              ".bx--notification-queue__placeholder",
            );
            if (!node) throw new Error("No placeholder");
            new MutationObserver(() =>
              resolve(node.getBoundingClientRect().height),
            ).observe(node, { attributeFilter: ["style"] });
          }),
      );
      await leave(page);
      expect((await start) > 0).toBe(animates);
      await expect(placeholders(page)).toHaveCount(0);
    });
  }
});
