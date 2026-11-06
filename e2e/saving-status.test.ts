// Each test opens one of these two pages, by a path the helper receives.
// @depends-on e2e/fixtures/saving-status.html e2e/fixtures/saving-status-statuses.html
import AxeBuilder from "@axe-core/playwright";
import type { Browser, Page, TestInfo } from "@playwright/test";
import { expect, test } from "./helpers/host";

type Seen = { lines: string[]; polite: string[]; assertive: string[] };

declare global {
  interface Window {
    __saving: { saves: unknown[]; fail: number; delay: number };
    __seen: Seen;
  }
}

// Every test opens its own page in its own context: the clock tests install
// a fake clock that cannot be taken off again, the offline test switches the
// network off for the whole context, and the unload test closes its page.

async function open(
  browser: Browser,
  testInfo: TestInfo,
  path: string,
  options: { clock?: boolean } = {},
) {
  const context = await browser.newContext({
    baseURL: testInfo.project.use.baseURL,
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();
  if (options.clock) await page.clock.install();
  await page.goto(path);
  return { context, page };
}

// The visible line, with whitespace squeezed.
const line = (page: Page, id: string) =>
  page
    .getByTestId(id)
    .locator(".bx--saving-status__content")
    .evaluate((el) => el.textContent?.replace(/\s+/g, " ").trim() ?? "");

/** Records every distinct text the visible line and the live regions show. */
async function record(page: Page) {
  await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>(
      "[data-testid=status-md]",
    ) as HTMLElement;
    const read = () => ({
      line: root
        .querySelector(".bx--saving-status__content")
        ?.textContent?.replace(/\s+/g, " ")
        .trim(),
      polite: root.querySelector('[role="status"]')?.textContent,
      assertive: root.querySelector('[role="alert"]')?.textContent,
    });
    const seen = {
      lines: [] as string[],
      polite: [] as string[],
      assertive: [] as string[],
    };
    const log = () => {
      const now = read();
      if (now.line !== undefined && seen.lines.at(-1) !== now.line)
        seen.lines.push(now.line);
      if (now.polite && seen.polite.at(-1) !== now.polite)
        seen.polite.push(now.polite);
      if (now.assertive && seen.assertive.at(-1) !== now.assertive)
        seen.assertive.push(now.assertive);
    };
    log();
    new MutationObserver(log).observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
    });
    window.__seen = seen;
  });
  return () => page.evaluate(() => window.__seen);
}

const saves = (page: Page) => page.evaluate(() => window.__saving.saves.length);

test.describe("SavingStatus", () => {
  test.describe("statuses", () => {
    test("has no axe violations in any status, in White, Gray 100 and RTL", async ({
      browser,
    }, testInfo) => {
      const { context, page } = await open(
        browser,
        testInfo,
        "/saving-status-statuses.html",
      );
      for (const mode of ["white", "g100", "rtl"] as const) {
        // eslint-disable-next-line no-await-in-loop -- one mode at a time
        await page.evaluate((mode) => {
          const html = document.documentElement;
          html.classList.toggle("bx--g100", mode === "g100");
          html.dir = mode === "rtl" ? "rtl" : "ltr";
        }, mode);
        // eslint-disable-next-line no-await-in-loop -- one mode at a time
        const results = await new AxeBuilder({ page })
          .include("#app")
          .analyze();
        expect(results.violations, mode).toEqual([]);
      }
      await context.close();
    });

    test("shows the icon at the inline start in LTR and RTL", async ({
      browser,
    }, testInfo) => {
      const { context, page } = await open(
        browser,
        testInfo,
        "/saving-status-statuses.html",
      );
      const gap = () =>
        page.evaluate(() => {
          const row = document.querySelector("[data-testid=md-saved]");
          const icon = row?.querySelector("svg")?.getBoundingClientRect();
          const text = row?.querySelector("time")?.getBoundingClientRect();
          if (!icon || !text) throw new Error("no icon or text");
          return { icon, text };
        });

      const ltr = await gap();
      expect(ltr.icon.right).toBeLessThanOrEqual(ltr.text.left);

      await page.evaluate(() => {
        document.documentElement.dir = "rtl";
      });
      const rtl = await gap();
      expect(rtl.icon.left).toBeGreaterThanOrEqual(rtl.text.right);
      await context.close();
    });

    test("keeps the same height in every status, so nothing moves", async ({
      browser,
    }, testInfo) => {
      const { context, page } = await open(
        browser,
        testInfo,
        "/saving-status-statuses.html",
      );
      for (const size of ["md", "sm"]) {
        // eslint-disable-next-line no-await-in-loop -- one size at a time
        const heights = await page.evaluate((size) => {
          return ["idle", "unsaved", "saving", "saved", "error", "offline"].map(
            (status) =>
              document
                .querySelector(`[data-testid=${size}-${status}]`)
                ?.getBoundingClientRect().height,
          );
        }, size);
        expect(new Set(heights).size, `${size}: ${heights}`).toBe(1);
      }
      await context.close();
    });

    test("draws every status icon in the text color under forced colors", async ({
      browser,
    }, testInfo) => {
      const { context, page } = await open(
        browser,
        testInfo,
        "/saving-status-statuses.html",
      );
      await page.emulateMedia({ forcedColors: "active" });
      const fills = await page.evaluate(() => {
        const probe = document.createElement("div");
        probe.style.color = "CanvasText";
        document.body.append(probe);
        const canvasText = getComputedStyle(probe).color;
        probe.remove();
        return Object.fromEntries(
          ["unsaved", "saved", "error", "offline"].map((status) => {
            const svg = document.querySelector(
              `[data-testid=md-${status}] svg`,
            ) as SVGElement;
            return [status, [getComputedStyle(svg).fill, canvasText]];
          }),
        );
      });
      for (const [status, [fill, canvasText]] of Object.entries(fills)) {
        expect(fill, status).toBe(canvasText);
      }
      // The spinner keeps a stroke that forced colors can paint.
      const stroke = await page
        .getByTestId("md-saving")
        .locator(".bx--loading__stroke")
        .evaluate((el) => getComputedStyle(el).stroke);
      expect(stroke).not.toBe("none");
      await context.close();
    });

    test("draws no animation of its own under reduced motion", async ({
      browser,
    }, testInfo) => {
      const { context, page } = await open(
        browser,
        testInfo,
        "/saving-status-statuses.html",
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      const animated = await page.evaluate(() =>
        ["unsaved", "saved", "error", "offline"].flatMap((status) =>
          (document.querySelector(`[data-testid=md-${status}]`) as HTMLElement)
            .getAnimations({ subtree: true })
            .map(() => status),
        ),
      );
      expect(animated).toEqual([]);
      await context.close();
    });

    test("opens the error details in a popover that names its button", async ({
      browser,
    }, testInfo) => {
      const { context, page } = await open(
        browser,
        testInfo,
        "/saving-status-statuses.html",
      );
      const details = page
        .getByTestId("md-error")
        .getByRole("button", { name: "Show error details" });
      await details.click();
      await expect(
        page.getByTestId("md-error").getByText("The server answered 503."),
      ).toBeVisible();
      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
      await page.keyboard.press("Escape");
      await expect(details).toHaveAttribute("aria-expanded", "false");
      await context.close();
    });
  });

  test.describe("autosave", () => {
    test("saves during 30 seconds of typing and never flashes", async ({
      browser,
    }, testInfo) => {
      const { context, page } = await open(
        browser,
        testInfo,
        "/saving-status.html?debounce=1000&maxWait=5000&delay=120",
        { clock: true },
      );
      const seen = await record(page);
      await page.getByLabel("Title").focus();

      // A keystroke every 200 ms, for 30 seconds.
      for (let i = 0; i < 150; i++) {
        // eslint-disable-next-line no-await-in-loop -- the clock steps with the keys
        await page.keyboard.type("x");
        // eslint-disable-next-line no-await-in-loop -- the clock steps with the keys
        await page.clock.runFor(200);
      }

      // maxWait saved the latest value about every 5 seconds, mid-typing.
      expect(await saves(page)).toBeGreaterThanOrEqual(5);
      expect(await saves(page)).toBeLessThanOrEqual(7);
      expect(await seen()).toMatchObject({
        lines: ["", "Unsaved changes"],
        polite: [],
        assertive: [],
      });

      // Typing stops: it settles on Saved, and says it once.
      await page.clock.runFor(4000);
      await expect.poll(() => line(page, "status-md")).toContain("Saved");
      expect((await seen()).polite).toEqual(["Saved"]);
      // The same state in the header.
      expect(await line(page, "status-sm")).toContain("Saved");
      await context.close();
    });

    test("survives a save that fails three times and then works", async ({
      browser,
    }, testInfo) => {
      const { context, page } = await open(
        browser,
        testInfo,
        "/saving-status.html?debounce=200&retryDelay=100&delay=50",
        { clock: true },
      );
      const seen = await record(page);
      await page.evaluate(() => {
        window.__saving.fail = 3;
      });
      await page.getByLabel("Title").fill("Quarterly report v2");
      await page.clock.runFor(10_000);

      expect(await saves(page)).toBe(4);
      await expect.poll(() => line(page, "status-md")).toContain("Saved");
      const { lines, assertive } = await seen();
      expect(lines.join("|")).not.toContain("Couldn't save");
      expect(assertive).toEqual([]);
      await context.close();
    });

    test("shows the error when the tries run out, and Retry saves", async ({
      browser,
    }, testInfo) => {
      const { context, page } = await open(
        browser,
        testInfo,
        "/saving-status.html?debounce=200&retryDelay=100&delay=50",
        { clock: true },
      );
      const seen = await record(page);
      await page.evaluate(() => {
        window.__saving.fail = 4;
      });
      await page.getByLabel("Title").fill("Quarterly report v2");
      await page.clock.runFor(10_000);

      const status = page.getByTestId("status-md");
      await expect(status).toContainText("Couldn't save");
      expect(await saves(page)).toBe(4);
      // Said once, at once, assertively.
      expect((await seen()).assertive).toEqual(["Couldn't save"]);

      // It does not go on by itself.
      await page.clock.runFor(60_000);
      expect(await saves(page)).toBe(4);

      const retry = status.getByRole("button", { name: "Retry" });
      await retry.focus();
      await page.keyboard.press("Enter");
      await page.clock.runFor(3000);
      await expect.poll(() => line(page, "status-md")).toContain("Saved");
      expect(await saves(page)).toBe(5);
      // Retry left with the error. Focus stayed with the status.
      const focused = await page.evaluate(
        () => document.activeElement?.className ?? "",
      );
      expect(focused).toContain("bx--saving-status");
      await context.close();
    });

    test("pauses offline, says so, and saves when it is back", async ({
      browser,
    }, testInfo) => {
      const { context, page } = await open(
        browser,
        testInfo,
        "/saving-status.html?debounce=200&delay=50",
        { clock: true },
      );
      const seen = await record(page);
      const input = page.getByLabel("Title");
      await input.focus();

      await context.setOffline(true);
      await page.keyboard.type("!");
      await page.clock.runFor(5000);
      await expect(page.getByTestId("status-md")).toContainText(
        "Offline: changes will save when you reconnect",
      );
      expect(await saves(page)).toBe(0);
      expect((await seen()).polite).toEqual([
        "Offline: changes will save when you reconnect",
      ]);

      await context.setOffline(false);
      await page.clock.runFor(2000);
      expect(await saves(page)).toBe(1);
      await expect.poll(() => line(page, "status-md")).toContain("Saved");
      await context.close();
    });

    test("asks before the page closes while changes are unsaved", async ({
      browser,
    }, testInfo) => {
      const { context, page } = await open(
        browser,
        testInfo,
        "/saving-status.html?debounce=60000&maxWait=0",
      );
      const dialogs: string[] = [];
      page.on("dialog", (dialog) => {
        dialogs.push(dialog.type());
        void dialog.dismiss();
      });
      // Chrome asks only after the user has acted on the page.
      await page.getByLabel("Title").click();
      await page.keyboard.type("!");
      await expect(page.getByTestId("status-md")).toContainText(
        "Unsaved changes",
      );
      await page.close({ runBeforeUnload: true });
      await expect.poll(() => dialogs).toEqual(["beforeunload"]);
      // A dismissed prompt keeps the page open.
      expect(page.isClosed()).toBe(false);
      await context.close();
    });

    test("does not ask once everything is saved", async ({
      browser,
    }, testInfo) => {
      const { context, page } = await open(
        browser,
        testInfo,
        "/saving-status.html?debounce=100&delay=20",
      );
      const dialogs: string[] = [];
      page.on("dialog", (dialog) => {
        dialogs.push(dialog.type());
        void dialog.dismiss();
      });
      await page.getByLabel("Title").click();
      await page.keyboard.type("!");
      await expect(page.getByTestId("status-md")).toContainText("Saved");
      await page.close({ runBeforeUnload: true });
      await expect.poll(() => page.isClosed()).toBe(true);
      expect(dialogs).toEqual([]);
      await context.close();
    });
  });
});
