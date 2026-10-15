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

  test("takes no space for a meta slot that renders nothing", async ({
    page,
  }) => {
    const meta = page.getByTestId("no-meta").locator(".bx--chat-message__meta");
    await expect(meta).toBeAttached();
    await expect(meta).toBeHidden();
  });
});
