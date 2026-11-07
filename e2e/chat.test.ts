import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, test } from "@playwright/test";

const distanceFromEnd = (log: Locator) =>
  log.evaluate(
    (node) => node.scrollHeight - node.scrollTop - node.clientHeight,
  );

test.describe("ChatLog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chat.html");
  });

  test("starts at the latest message", async ({ page }) => {
    expect(await distanceFromEnd(page.getByTestId("log"))).toBeLessThan(2);
  });

  test("keeps a new message in view while at the end", async ({ page }) => {
    await page.getByTestId("add").click();

    const log = page.getByTestId("log");
    await expect(log.getByText("Message 31")).toBeVisible();
    await expect.poll(() => distanceFromEnd(log)).toBeLessThan(2);
  });

  test("stays at the end when a message grows without a DOM change", async ({
    page,
  }) => {
    const log = page.getByTestId("log");
    // Stands in for a web font or an image that loads after mount.
    await log
      .locator(".bx--chat-message__bubble")
      .last()
      .evaluate((node) => {
        (node as HTMLElement).style.paddingBottom = "80px";
      });

    await expect.poll(() => distanceFromEnd(log)).toBeLessThan(2);
  });

  test("holds the wheel only while it has something to scroll", async ({
    page,
  }) => {
    const log = page.getByTestId("log");
    const overscroll = () =>
      log.evaluate((node) => getComputedStyle(node).overscrollBehaviorY);
    await expect.poll(overscroll).toBe("contain");

    // Chromium stops the wheel at a `contain` box even when it can't
    // scroll, so the page around a log that fits would never move.
    await log.evaluate((node) => {
      (node as HTMLElement).style.flex = "none";
      (node as HTMLElement).style.height = `${node.scrollHeight + 100}px`;
    });
    await expect.poll(overscroll).toBe("auto");
  });

  test("leaves the scroll alone while reading back", async ({ page }) => {
    const log = page.getByTestId("log");
    await log.evaluate((node) => {
      node.scrollTop = 0;
      node.dispatchEvent(new Event("scroll"));
    });

    await page.getByTestId("add").click();
    await expect(log.getByText("Message 31")).toBeAttached();

    expect(await log.evaluate((node) => node.scrollTop)).toBe(0);
  });

  test("brings a message I send into view while reading back", async ({
    page,
  }) => {
    const log = page.getByTestId("log");
    await log.evaluate((node) => {
      node.scrollTop = 0;
      node.dispatchEvent(new Event("scroll"));
    });

    await page.getByTestId("send").click();

    await expect.poll(() => distanceFromEnd(log)).toBeLessThan(2);
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .include('[data-testid="log"]')
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("takes no space for a meta slot that renders nothing", async ({
    page,
  }) => {
    const meta = page.getByTestId("no-meta").locator(".bx--chat-message__meta");
    await expect(meta).toBeAttached();
    await expect(meta).toBeHidden();
  });
});
