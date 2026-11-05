import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const composer = (page: Page) => page.getByRole("textbox", { name: "Message" });
const log = (page: Page) => page.getByRole("log");
const replies = (page: Page) =>
  page.locator(".bx--chat-message:not(.bx--chat-message--me)");
const complete = (page: Page) =>
  expect(page.getByRole("button", { name: "Send", exact: true })).toBeVisible();

async function ask(page: Page, text: string) {
  await composer(page).click();
  await composer(page).fill(text);
  await page.keyboard.press("Enter");
}

test.describe("Chat assistant", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chat-assistant.html");
    await expect(replies(page)).toHaveCount(1);
  });

  test("streams a reply, keeps focus in the composer and ends complete", async ({
    page,
  }) => {
    await ask(page, "How many workers should I use?");

    const reply = replies(page).last();
    await expect(reply).toHaveAttribute("aria-busy", "true");
    await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
    await expect(composer(page)).toBeFocused();

    await expect(reply).not.toHaveAttribute("aria-busy", "true", {
      timeout: 15_000,
    });
    await complete(page);
    await expect(reply.getByRole("heading", { level: 4 })).toContainText(
      "Why the invoice export is slow",
    );
    await expect(
      reply.getByRole("button", { name: "Copy code" }),
    ).toBeVisible();
    await expect(composer(page)).toBeFocused();
  });

  test("announces the start and the end, not every chunk", async ({ page }) => {
    await page.evaluate(() => {
      const w = window as unknown as { seen: string[] };
      w.seen = [];
      new MutationObserver(() => {
        const texts = [
          ...document.querySelectorAll(
            ".bx--chat-message:not(.bx--chat-message--me) [role=status].bx--visually-hidden",
          ),
        ]
          .map((n) => n.textContent)
          .join("|");
        if (w.seen[w.seen.length - 1] !== texts) w.seen.push(texts ?? "");
      }).observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
      });
    });

    await ask(page, "How many workers should I use?");
    await complete(page);

    const seen = await page.evaluate(
      () => (window as unknown as { seen: string[] }).seen,
    );
    const phrases = seen.join("|").split("|").filter(Boolean);
    expect(phrases).toContain("Response started");
    expect(phrases.at(-1)).toBe("Response complete");
    // Two messages' worth of statuses, never a status per chunk.
    expect(new Set(phrases)).toEqual(
      new Set(["Response started", "Response complete"]),
    );
    expect(seen.length).toBeLessThanOrEqual(6);
    const reply = replies(page).last();
    await expect(reply.locator(".bx--chat-message__bubble")).toHaveAttribute(
      "aria-live",
      "off",
    );
  });

  test("stops a reply and keeps what arrived", async ({ page }) => {
    await ask(page, "How many workers should I use?");
    await expect(replies(page).last()).toContainText("Why the invoice");

    await page.getByRole("button", { name: "Stop" }).click();

    await complete(page);
    const reply = replies(page).last();
    await expect(reply.getByText("Stopped")).toBeVisible();
    const text = (await reply.textContent()) ?? "";
    expect(text).toContain("Why the invoice");
    expect(text).not.toContain("See the export runbook");
    await expect(composer(page)).toBeFocused();
  });

  test("stops with Escape from the composer", async ({ page }) => {
    await ask(page, "How many workers should I use?");
    await expect(replies(page).last()).toContainText("Why the invoice");

    await page.keyboard.press("Escape");

    await complete(page);
    await expect(replies(page).last().getByText("Stopped")).toBeVisible();
  });

  test("regenerates the last reply", async ({ page }) => {
    await page.getByRole("button", { name: "Regenerate response" }).click();

    await expect(replies(page)).toHaveCount(1);
    await expect(replies(page).last()).toHaveAttribute("aria-busy", "true");
    await expect(replies(page).last()).not.toHaveAttribute(
      "aria-busy",
      "true",
      {
        timeout: 15_000,
      },
    );
    await expect(
      replies(page).last().getByRole("button", { name: "Copy response" }),
    ).toBeVisible();
  });

  test("edits the last prompt and sends it again", async ({ page }) => {
    await page.getByRole("button", { name: "Edit and resend" }).click();
    await page
      .getByRole("textbox", { name: "Edit your message" })
      .fill("Why is the export slower on Mondays?");
    await page.getByRole("button", { name: "Resend" }).click();

    await expect(
      page.getByText("Why is the export slower on Mondays?"),
    ).toBeVisible();
    await expect(
      page.getByText("Why is the nightly invoice export"),
    ).toHaveCount(0);
    await expect(replies(page)).toHaveCount(1);
    await expect(replies(page).last()).not.toHaveAttribute(
      "aria-busy",
      "true",
      {
        timeout: 15_000,
      },
    );
  });

  test("shows an error with a retry that works", async ({ page }) => {
    await ask(page, "This will fail");

    const reply = replies(page).last();
    await expect(reply.getByText("Response failed")).toBeVisible({
      timeout: 15_000,
    });
    await complete(page);

    await reply.getByRole("button", { name: "Retry" }).click();

    await expect(reply.getByText("Response failed")).toBeHidden();
  });

  test("lists sources in a disclosure and takes feedback", async ({ page }) => {
    const sources = page.getByRole("button", { name: /Sources \(2\)/ });
    await sources.click();
    await expect(
      page.getByRole("link", { name: "Billing export runbook" }),
    ).toBeVisible();

    const down = page.getByRole("button", { name: "Bad response" });
    await down.click();
    await expect(down).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("textbox", { name: /What went wrong/ }),
    ).toBeVisible();
  });

  test("leaves the scroll alone for a reader who scrolled back, and offers a jump", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 900, height: 420 });
    await ask(page, "How many workers should I use?");
    await expect(replies(page).last()).toContainText("Why the invoice");

    await log(page).evaluate((node) => {
      node.scrollTop = 0;
      node.dispatchEvent(new Event("scroll"));
    });
    const jump = page.getByRole("button", { name: "Jump to latest" });
    await expect(jump).toBeVisible();
    const before = await log(page).evaluate((node) => ({
      top: node.scrollTop,
      height: node.scrollHeight,
    }));
    await page.waitForTimeout(600);
    const during = await log(page).evaluate((node) => ({
      top: node.scrollTop,
      height: node.scrollHeight,
    }));

    expect(during.height).toBeGreaterThan(before.height);
    expect(during.top).toBe(0);
    await jump.click();
    await expect(jump).toBeHidden();
    expect(
      await log(page).evaluate(
        (node) => node.scrollHeight - node.scrollTop - node.clientHeight,
      ),
    ).toBeLessThan(2);
    await expect(log(page)).toBeFocused();
  });

  test("keeps the latest in view while the reader stays at the end", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 900, height: 420 });
    await ask(page, "How many workers should I use?");
    await expect(replies(page).last()).not.toHaveAttribute(
      "aria-busy",
      "true",
      {
        timeout: 15_000,
      },
    );

    expect(
      await log(page).evaluate(
        (node) => node.scrollHeight - node.scrollTop - node.clientHeight,
      ),
    ).toBeLessThan(2);
    await expect(
      page.getByRole("button", { name: "Jump to latest" }),
    ).toBeHidden();
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    await ask(page, "How many workers should I use?");
    await complete(page);

    const white = await new AxeBuilder({ page }).include("#app").analyze();
    expect(white.violations).toEqual([]);

    await page.evaluate(() =>
      document.documentElement.setAttribute("theme", "g100"),
    );
    await page.waitForTimeout(400);
    const g100 = await new AxeBuilder({ page }).include("#app").analyze();
    expect(g100.violations).toEqual([]);
  });

  test("draws no moving caret or dots when reduced motion is preferred", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await ask(page, "How many workers should I use?");

    const dots = page.locator(".bx--chat-message__dot").first();
    await expect(dots).toBeVisible();
    expect(await dots.evaluate((n) => getComputedStyle(n).animationName)).toBe(
      "none",
    );
    const caret = page.locator(".bx--markdown__caret");
    await expect(caret).toBeVisible();
    expect(await caret.evaluate((n) => getComputedStyle(n).animationName)).toBe(
      "none",
    );
  });
});
