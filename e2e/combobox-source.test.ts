import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

declare global {
  interface Window {
    seen: string[];
    requests: string[];
    healed: boolean;
  }
}

const input = (page: Page) => page.getByRole("combobox", { name: "Person" });
const options = (page: Page) => page.getByRole("option");

test.describe("ComboBox with a source", () => {
  test("shows only the last answer at 50 keystrokes a second over 300 ms latency", async ({
    page,
  }) => {
    await page.goto("/combobox-source.html?latency=300");
    const typed = "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwx";
    expect(typed).toHaveLength(50);

    await input(page).click();
    // Record every text the menu shows from here on.
    await page.evaluate(() => {
      const seen: string[] = [];
      window.seen = seen;
      new MutationObserver(() => {
        for (const node of document.querySelectorAll(
          '[role="option"], .bx--list-box__menu-status',
        )) {
          const text = node.textContent?.trim() ?? "";
          if (text && !seen.includes(text)) seen.push(text);
        }
      }).observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    });
    await input(page).pressSequentially(typed, { delay: 20 });

    await expect(options(page).first()).toHaveText(`Alice (${typed})`);
    await expect(page.getByRole("listbox")).not.toHaveAttribute("aria-busy");
    const seen = await page.evaluate(() => window.seen);
    // No older answer ever showed, and nothing stood in for one.
    expect(seen.filter((text) => text.includes("("))).toEqual(
      seen.filter((text) => text.endsWith(`(${typed})`)),
    );
    expect(seen).not.toContain("No results");
    expect(await page.evaluate(() => window.requests.length)).toBe(51);
  });

  test("a debounce turns fast typing into one request", async ({ page }) => {
    await page.goto("/combobox-source.html?latency=50&debounce=150");
    await input(page).click();
    await input(page).pressSequentially("abcdefghijklmnopqrstuvwxyz", {
      delay: 20,
    });
    await expect(options(page).first()).toHaveText(
      "Alice (abcdefghijklmnopqrstuvwxyz)",
    );
    expect(await page.evaluate(() => window.requests)).toEqual([
      "abcdefghijklmnopqrstuvwxyz",
    ]);
  });

  test("keeps the last answer on screen while the next loads", async ({
    page,
  }) => {
    await page.goto("/combobox-source.html?latency=400");
    await input(page).click();
    await input(page).fill("a");
    await expect(options(page).first()).toHaveText("Alice (a)");
    await input(page).fill("ab");
    await expect(page.getByRole("listbox")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    await expect(options(page).first()).toHaveText("Alice (a)");
    await expect(page.getByText("Loading...")).toBeVisible();
    await expect(options(page).first()).toHaveText("Alice (ab)");
  });

  test("shows an error row for a failing source and recovers on the next input", async ({
    page,
  }) => {
    await page.goto("/combobox-source.html?latency=50&fail=1");
    await input(page).click();
    await input(page).fill("a");
    await expect(page.getByText("Unable to load results")).toBeVisible();
    await expect(page.getByText("No results")).toHaveCount(0);
    await expect(options(page)).toHaveCount(0);

    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);

    await page.evaluate(() => {
      window.healed = true;
    });
    await input(page).fill("ab");
    await expect(options(page).first()).toHaveText("Alice (ab)");
    await expect(page.getByText("Unable to load results")).toHaveCount(0);
  });

  test("fetches a failed query again when the browser comes back online", async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(
      browserName === "firefox",
      "Firefox's offline emulation does not fail a request to localhost.",
    );
    await page.goto("/combobox-source.html?latency=50");
    await input(page).click();
    await input(page).fill("a");
    await expect(options(page).first()).toHaveText("Alice (a)");

    try {
      await context.setOffline(true);
      await input(page).fill("ab");
      await expect(page.getByText("Unable to load results")).toBeVisible();
      await expect(options(page)).toHaveCount(0);

      await context.setOffline(false);
      await expect(options(page).first()).toHaveText("Alice (ab)");
      await expect(page.getByText("Unable to load results")).toHaveCount(0);
    } finally {
      await context.setOffline(false);
    }
  });

  test("has no detectable accessibility violations with answers or while loading", async ({
    page,
  }) => {
    await page.goto("/combobox-source.html?latency=400");
    await input(page).click();
    await input(page).fill("a");
    await expect(page.getByText("Loading...")).toBeVisible();
    const loading = await new AxeBuilder({ page }).include("#app").analyze();
    expect(loading.violations).toEqual([]);

    await expect(options(page).first()).toHaveText("Alice (a)");
    const loaded = await new AxeBuilder({ page }).include("#app").analyze();
    expect(loaded.violations).toEqual([]);
  });
});
