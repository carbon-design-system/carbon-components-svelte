import AxeBuilder from "@axe-core/playwright";
import { type BrowserContext, expect, type Page, test } from "@playwright/test";

// The session timeout dialog and `createIdleTimer`, driven by Playwright's
// clock: the context is paused at a fixed time and moved with `runFor` (timers
// run, in order) or `setSystemTime` (the clock jumps, no timer runs, as when a
// laptop wakes). Each test gets its own browser context, so pages in one test
// share a BroadcastChannel and localStorage as two tabs of a browser do.

const SECOND = 1000;
const MIN = 60 * SECOND;
const T0 = new Date("2026-03-02T09:00:00Z");

declare global {
  interface Window {
    __timer: {
      setExpiresAt(
        expiresAt: number,
        options?: { serverNow?: number },
      ): boolean;
      expiresAt(): Date | null;
    };
    __said: string[];
  }
}

async function freeze(context: BrowserContext) {
  await context.clock.install({ time: T0 });
  await context.clock.pauseAt(new Date(T0.getTime() + SECOND));
}

async function open(context: BrowserContext, params = "") {
  const page = await context.newPage();
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(message.text());
  });
  await page.goto(`/session-timeout.html?${params}`);
  await expect(page.getByTestId("status")).toHaveText("active");
  return Object.assign(page, { problems });
}

const status = (page: Page) => page.getByTestId("status");
const dialog = (page: Page) => page.getByRole("alertdialog");
const log = (page: Page) => page.getByTestId("log");

test.describe("SessionTimeoutModal", () => {
  test.beforeEach(async ({ context }) => {
    await freeze(context);
  });

  test("warns two minutes before a 15 minute session ends", async ({
    context,
  }) => {
    const page = await open(context);
    await context.clock.runFor(13 * MIN - SECOND);
    await expect(dialog(page)).toBeHidden();

    await context.clock.runFor(SECOND);
    await expect(status(page)).toHaveText("warning");
    await expect(
      page.getByRole("alertdialog", { name: "Your session is about to end" }),
    ).toBeVisible();
    await expect(page.getByRole("timer")).toHaveText("2:00");

    await context.clock.runFor(5 * SECOND);
    await expect(page.getByRole("timer")).toHaveText("1:55");
    expect(page.problems).toEqual([]);
  });

  test("works by keyboard alone, and the user has to choose", async ({
    context,
  }) => {
    const page = await open(context);
    await page.getByTestId("name").focus();
    await context.clock.runFor(14 * MIN);
    const stay = page.getByRole("button", { name: "Stay signed in" });
    const signOut = page.getByRole("button", { name: "Sign out" });
    await expect(stay).toBeFocused();

    // Tab stays inside the dialog.
    await page.keyboard.press("Tab");
    await expect(signOut).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(stay).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(signOut).toBeFocused();
    await page.keyboard.press("Shift+Tab");

    // Activity, Escape and a click outside leave it open.
    await context.clock.runFor(2 * SECOND);
    await page.keyboard.press("a");
    await page.keyboard.press("Escape");
    await page.mouse.click(5, 5);
    await expect(dialog(page)).toBeVisible();
    await expect(status(page)).toHaveText("warning");
    await expect(stay).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(status(page)).toHaveText("active");
    await expect(dialog(page)).toBeHidden();
    await expect(page.getByTestId("name")).toBeFocused();
    await expect(log(page)).toHaveText("warn,extend");
  });

  test("announces at 1 minute, 30 and 10 seconds, not every second", async ({
    context,
    browserName,
  }) => {
    const page = await open(context);
    await context.clock.runFor(13 * MIN);
    await expect(dialog(page)).toBeVisible();
    await page.evaluate(() => {
      window.__said = [];
      const region = document.querySelector<HTMLElement>(
        '.bx--modal [role="status"]',
      );
      if (!region) throw new Error("no live region");
      new MutationObserver(() => {
        if (region.textContent) window.__said.push(region.textContent);
      }).observe(region, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    });

    await context.clock.runFor(60 * SECOND + 500);
    if (browserName === "chromium") {
      // What an assistive technology is given: a polite, atomic status.
      const cdp = await context.newCDPSession(page);
      const { nodes } = await cdp.send("Accessibility.getFullAXTree");
      const region = nodes.find(
        (node) =>
          node.role?.value === "status" &&
          !node.ignored &&
          node.properties?.some(
            (p) => p.name === "live" && p.value.value === "polite",
          ),
      );
      expect(region).toBeDefined();
    }
    expect(
      await page.evaluate(
        () => document.querySelector('.bx--modal [role="status"]')?.textContent,
      ),
    ).toBe("Your session will end in 1 minute");

    await context.clock.runFor(60 * SECOND);
    await expect(status(page)).toHaveText("expired");
    expect(await page.evaluate(() => window.__said)).toEqual([
      "Your session will end in 1 minute",
      "Your session will end in 30 seconds",
      "Your session will end in 10 seconds",
      "You've been signed out. Your session ended because you were inactive. Sign in again to continue.",
    ]);
  });

  test("shows the end, and Sign in, once the session has run out", async ({
    context,
  }) => {
    const page = await open(context);
    await context.clock.runFor(15 * MIN);
    await expect(
      page.getByRole("alertdialog", { name: "You've been signed out" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Sign in" })).toBeFocused();
    await expect(log(page)).toHaveText("warn,expire:timeout:false");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(log(page)).toHaveText("warn,expire:timeout:false,signin");
  });

  test.describe("sleep and resume", () => {
    test("a wake inside the warning shows the real time left", async ({
      context,
    }) => {
      const page = await open(context);
      await context.clock.runFor(5 * MIN);
      // The lid closes at 5 minutes and opens at 14:10. No timer ran.
      await context.clock.setSystemTime(
        new Date(T0.getTime() + 14 * MIN + 10 * SECOND + SECOND),
      );
      await page.evaluate(() =>
        document.dispatchEvent(new Event("visibilitychange")),
      );
      await expect(status(page)).toHaveText("warning");
      await expect(page.getByRole("timer")).toHaveText("0:50");
    });

    test("a wake after the end signs out and is not activity", async ({
      context,
    }) => {
      const page = await open(context);
      await context.clock.setSystemTime(new Date(T0.getTime() + 61 * MIN));
      await page.keyboard.press("a");
      await expect(status(page)).toHaveText("expired");
      await expect(log(page)).toHaveText("expire:timeout:false");
      await expect(
        page.getByRole("alertdialog", { name: "You've been signed out" }),
      ).toBeVisible();
    });
  });

  test("a hidden tab keeps counting, and being shown is not activity", async ({
    context,
  }) => {
    const page = await open(context);
    const setHidden = (hidden: boolean) =>
      page.evaluate((hidden) => {
        Object.defineProperty(document, "hidden", {
          configurable: true,
          get: () => hidden,
        });
        Object.defineProperty(document, "visibilityState", {
          configurable: true,
          get: () => (hidden ? "hidden" : "visible"),
        });
        document.dispatchEvent(new Event("visibilitychange"));
      }, hidden);

    await context.clock.runFor(5 * MIN);
    await setHidden(true);
    await context.clock.runFor(8 * MIN + 30 * SECOND);
    await expect(status(page)).toHaveText("warning");
    await setHidden(false);
    await expect(dialog(page)).toBeVisible();
    await expect(page.getByRole("timer")).toHaveText("1:30");
  });

  test("a server end time is not moved by activity, and can move", async ({
    context,
  }) => {
    const page = await open(context, `expiresIn=${10 * MIN}`);
    await context.clock.runFor(5 * MIN);
    await page.keyboard.press("a");
    await context.clock.runFor(3 * MIN);
    await expect(status(page)).toHaveText("warning");

    // The server extends: its time is 10 minutes ahead of this clock.
    await page.evaluate(() => {
      const now = Date.now();
      window.__timer.setExpiresAt(now + 25 * 60000, {
        serverNow: now + 10 * 60000,
      });
    });
    await expect(status(page)).toHaveText("active");
    expect(
      await page.evaluate(() => {
        const end = window.__timer.expiresAt();
        return end ? end.getTime() - Date.now() : 0;
      }),
    ).toBe(15 * MIN);
    await expect(dialog(page)).toBeHidden();
  });

  test("keeps the dialog up, with the reason, when the server will not extend", async ({
    context,
  }) => {
    const page = await open(context, "extend=fail");
    await context.clock.runFor(14 * MIN);
    await page.getByRole("button", { name: "Stay signed in" }).click();
    await expect(
      page.getByText("We could not extend your session. Try again."),
    ).toBeVisible();
    await expect(dialog(page)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Stay signed in" }),
    ).toBeFocused();
    await expect(status(page)).toHaveText("warning");
  });

  test.describe("two tabs", () => {
    test("activity in one extends the other", async ({ context }) => {
      const a = await open(context);
      const b = await open(context);
      await context.clock.runFor(10 * MIN);
      await a.keyboard.press("a");
      // B would warn at 13 minutes on its own.
      await context.clock.runFor(4 * MIN);
      await expect(status(b)).toHaveText("active");
      await context.clock.runFor(9 * MIN + 30 * SECOND);
      await expect(status(a)).toHaveText("warning");
      await expect(status(b)).toHaveText("warning");
    });

    test("staying in one closes the warning in both", async ({ context }) => {
      const a = await open(context);
      const b = await open(context);
      await context.clock.runFor(14 * MIN);
      await expect(dialog(a)).toBeVisible();
      await expect(dialog(b)).toBeVisible();

      await a.getByRole("button", { name: "Stay signed in" }).click();
      await expect(status(a)).toHaveText("active");
      await expect(status(b)).toHaveText("active");
      await expect(dialog(b)).toBeHidden();
    });

    test("signing out of one signs out both", async ({ context }) => {
      const a = await open(context);
      const b = await open(context);
      await context.clock.runFor(14 * MIN);
      await a.getByRole("button", { name: "Sign out" }).click();

      await expect(log(a)).toHaveText("warn,expire:signout:false,signout");
      await expect(status(b)).toHaveText("expired");
      await expect(log(b)).toHaveText("warn,expire:signout:true");
      await expect(
        b.getByRole("alertdialog", { name: "You've been signed out" }),
      ).toBeVisible();
      await expect(b.getByRole("alertdialog")).toContainText(
        "You were signed out.",
      );
    });

    test("tabs on different channels do not share a session", async ({
      context,
    }) => {
      const a = await open(context, "channel=one");
      const b = await open(context, "channel=two");
      await context.clock.runFor(14 * MIN);
      await a.getByRole("button", { name: "Sign out" }).click();
      await expect(status(a)).toHaveText("expired");
      await expect(status(b)).toHaveText("warning");
    });
  });

  for (const state of ["warning", "expired"] as const) {
    test.describe(`${state} state`, () => {
      async function show(context: BrowserContext, params = "") {
        const page = await open(context, params);
        await context.clock.runFor((state === "warning" ? 13 : 16) * MIN);
        await expect(status(page)).toHaveText(state);
        await expect(dialog(page)).toBeVisible();
        // axe waits on timers, so let the clock run again.
        await context.clock.resume();
        return page;
      }

      test("has no accessibility violations", async ({ context }) => {
        const page = await show(context);
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations).toEqual([]);
      });

      test("has none in Gray 100", async ({ context }) => {
        const page = await show(context);
        await page.evaluate(() =>
          document.documentElement.classList.add("bx--g100"),
        );
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations).toEqual([]);
      });

      test("has none in RTL, with the primary action at the start", async ({
        context,
      }) => {
        const page = await show(context);
        const primary = page.locator(".bx--modal-footer .bx--btn--primary");
        const before = await primary.boundingBox();
        await page.evaluate(() =>
          document.documentElement.setAttribute("dir", "rtl"),
        );
        const after = await primary.boundingBox();
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations).toEqual([]);
        const container = await page
          .locator(".bx--modal-container")
          .boundingBox();
        if (!(before && after && container)) throw new Error("not laid out");
        const middle = container.x + container.width / 2;
        // The same modal mirrors: the primary was at the end of the footer
        // and now sits at the end of a right-to-left line, on the left.
        expect(before.x + before.width / 2).toBeGreaterThan(middle);
        expect(after.x + after.width / 2).toBeLessThan(middle);
      });

      test("keeps its buttons and edges visible in forced colors", async ({
        context,
        browserName,
      }) => {
        test.skip(browserName === "webkit", "WebKit has no forced colors");
        const page = await show(context);
        await page.emulateMedia({ forcedColors: "active" });
        const buttons = page.locator(".bx--modal-footer .bx--btn");
        const edges = await buttons.evaluateAll((nodes) =>
          nodes.map((node) => {
            const style = getComputedStyle(node);
            return {
              width: Number.parseFloat(style.borderTopWidth),
              color: style.borderTopColor,
              outline: style.outlineStyle,
            };
          }),
        );
        for (const edge of edges) {
          expect(edge.width).toBeGreaterThan(0);
          expect(edge.color).not.toBe("rgba(0, 0, 0, 0)");
        }
        await expect(buttons.first()).toBeVisible();
      });
    });
  }
});
