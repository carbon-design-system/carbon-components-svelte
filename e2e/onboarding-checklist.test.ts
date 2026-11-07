import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const INLINE_KEY = "carbon:onboarding";
const FLOATING_KEY = "carbon:onboarding:floating";

// Opening a fixture starts with empty storage.
async function openInline(page: Page, query = "") {
  if (query) await page.goto(`/onboarding-checklist.html?${query}`);
  else await page.goto("/onboarding-checklist.html");
  await expect(page.getByTestId("checklist")).toBeVisible();
}

async function openFloating(page: Page) {
  await page.goto("/onboarding-checklist-floating.html");
  await expect(page.getByTestId("checklist")).toBeVisible();
}

// The checkbox itself is visually hidden behind the task's title, which is
// the label users click.
async function checkTask(page: Page, title: string) {
  await page
    .locator("label.bx--onboarding__task-title", { hasText: title })
    .click();
  await expect(page.getByRole("checkbox", { name: title })).toBeChecked();
}

function stored(page: Page, key = INLINE_KEY) {
  return page.evaluate((k) => {
    const raw = localStorage.getItem(k);
    return raw === null ? null : JSON.parse(raw);
  }, key);
}

function focused(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    const labelledby = el?.getAttribute("aria-labelledby");
    return (
      el?.getAttribute("aria-label") ||
      (labelledby && document.getElementById(labelledby)?.textContent) ||
      el?.textContent?.trim().replace(/\s+/g, " ") ||
      el?.tagName ||
      ""
    );
  });
}

// axe reads colors, so let a running color transition finish.
function settle(page: Page) {
  return page.evaluate(() =>
    // An animation that is cancelled while it runs rejects, which is fine.
    Promise.allSettled(document.getAnimations().map((a) => a.finished)).then(
      () => undefined,
    ),
  );
}

async function setTheme(page: Page, theme: string) {
  await page.evaluate(async (theme) => {
    document.documentElement.setAttribute("theme", theme);
    // axe reads colors, so let a running color transition finish.
    await Promise.allSettled(document.getAnimations().map((a) => a.finished));
  }, theme);
}

test.describe("OnboardingChecklist", () => {
  test.describe("a11y", () => {
    for (const theme of ["white", "g100"]) {
      test(`has no detectable violations inline in ${theme}`, async ({
        page,
      }) => {
        await openInline(page);
        await setTheme(page, theme);

        const results = await new AxeBuilder({ page })
          .include("#app")
          .analyze();

        expect(results.violations).toEqual([]);
      });

      test(`has no detectable violations floating, open and minimized, in ${theme}`, async ({
        page,
      }) => {
        await openFloating(page);
        await setTheme(page, theme);
        const open = await new AxeBuilder({ page }).include("#app").analyze();
        expect(open.violations).toEqual([]);

        await page
          .getByRole("button", { name: "Minimize Getting started" })
          .click();
        const minimized = await new AxeBuilder({ page })
          .include("#app")
          .analyze();
        expect(minimized.violations).toEqual([]);
      });
    }

    test("has no detectable violations with twenty tasks, a skipped task and when all set", async ({
      page,
    }) => {
      await openInline(page, "n=20");
      await page.getByRole("button", { name: "Skip" }).first().click();
      await settle(page);
      const many = await new AxeBuilder({ page }).include("#app").analyze();
      expect(many.violations).toEqual([]);

      await openInline(page);
      await page.getByRole("button", { name: "Toggle connected" }).click();
      for (const name of [
        "Create an alert",
        "Build a dashboard",
        "Publish your first report",
        "Invite a teammate",
      ]) {
        await checkTask(page, name);
      }
      await page.getByRole("button", { name: "Skip" }).click();
      await expect(page.getByText("All set", { exact: true })).toBeVisible();
      await settle(page);
      const allSet = await new AxeBuilder({ page }).include("#app").analyze();
      expect(allSet.violations).toEqual([]);
    });
  });

  test.describe("keyboard", () => {
    test("checks, skips and starts a task without a pointer", async ({
      page,
    }) => {
      await openInline(page);

      const alert = page.getByRole("checkbox", { name: "Create an alert" });
      await alert.focus();
      await page.keyboard.press("Space");
      await expect(alert).toBeChecked();
      expect((await stored(page)).done).toEqual(["alert"]);

      await page.getByRole("button", { name: "Skip" }).first().focus();
      await page.keyboard.press("Enter");
      const undo = page.getByRole("button", { name: "Undo skip" });
      await expect(undo).toBeFocused();

      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("button", { name: "Skip" }).first(),
      ).toBeFocused();

      await page.getByRole("button", { name: "Connect source" }).focus();
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("events")).toHaveText(
        "check,skip,unskip,action",
      );
    });

    test("reaches every control in reading order", async ({
      page,
      browserName,
    }) => {
      test.skip(
        browserName === "webkit",
        "WebKit's default Tab order skips plain buttons and links",
      );
      await openInline(page);
      const order: string[] = [];
      for (let i = 0; i < 14; i++) {
        await page.keyboard.press("Tab");
        order.push(await focused(page));
      }

      expect(order).toEqual([
        "Set up Acme Cloud",
        "Dismiss Set up Acme Cloud",
        "Connect source",
        "Invite a teammate",
        "Invite",
        "Skip",
        "Create an alert",
        "Build a dashboard",
        "Open builder",
        "Skip",
        "Publish your first report",
        "Toggle connected",
        "Reset progress",
        "Restore checklist",
      ]);
    });

    test("collapses with Enter and keeps focus on the title", async ({
      page,
    }) => {
      await openInline(page);
      const toggle = page.getByRole("button", {
        name: "Set up Acme Cloud",
        exact: true,
      });
      await toggle.focus();

      await page.keyboard.press("Enter");

      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(toggle).toBeFocused();
      await expect(page.getByRole("checkbox").first()).toBeHidden();
    });

    test("minimizes to the launcher and opens from it, with focus following", async ({
      page,
    }) => {
      await openFloating(page);
      await page
        .getByRole("button", { name: "Minimize Getting started" })
        .focus();

      await page.keyboard.press("Enter");

      const launcher = page.getByRole("button", {
        name: "Getting started, 0 of 6 complete",
      });
      await expect(launcher).toBeFocused();
      await expect(page.getByTestId("checklist")).toBeHidden();

      await page.keyboard.press("Enter");

      await expect(page.getByTestId("checklist")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Getting started", exact: true }),
      ).toBeFocused();
    });
  });

  test.describe("persistence", () => {
    test("keeps progress, skips and the launcher across a reload", async ({
      page,
    }) => {
      await openInline(page);
      await checkTask(page, "Create an alert");
      await page.getByRole("button", { name: "Skip" }).first().click();

      await page.reload();

      await expect(
        page.getByRole("checkbox", { name: "Create an alert" }),
      ).toBeChecked();
      await expect(page.getByText("Skipped")).toBeVisible();
      await expect(page.getByRole("progressbar")).toHaveAttribute(
        "aria-valuetext",
        "1 of 5 complete",
      );

      await openFloating(page);
      await page
        .getByRole("button", { name: "Minimize Getting started" })
        .click();
      await page.reload();
      await expect(
        page.getByRole("button", { name: "Getting started, 0 of 6 complete" }),
      ).toBeVisible();
      expect((await stored(page, FLOATING_KEY)).minimized).toBe(true);
    });

    test("stays dismissed after a reload until it is restored", async ({
      page,
    }) => {
      await openInline(page);
      await page
        .getByRole("button", { name: "Dismiss Set up Acme Cloud" })
        .click();
      await expect(page.getByTestId("checklist")).toHaveCount(0);

      await page.reload();
      await expect(page.getByTestId("events")).toBeAttached();
      await expect(page.getByTestId("checklist")).toHaveCount(0);

      await page.getByRole("button", { name: "Restore checklist" }).click();
      await expect(page.getByTestId("checklist")).toBeVisible();
    });
  });

  test.describe("app-detected tasks", () => {
    test("completes when the app says so, and announces it once", async ({
      page,
    }) => {
      await openInline(page);
      const row = page.locator("li", { hasText: "Connect a data source" });
      await expect(row).toContainText("Not completed");
      await expect(
        page.getByRole("button", { name: "Connect source" }),
      ).toBeVisible();

      await page.getByRole("button", { name: "Toggle connected" }).click();

      await expect(row).toContainText("Completed");
      await expect(
        page.getByRole("button", { name: "Connect source" }),
      ).toHaveCount(0);
      await expect(page.getByRole("status")).toHaveText(
        "Completed: Connect a data source",
      );
      await expect(page.getByRole("progressbar")).toHaveAttribute(
        "aria-valuetext",
        "1 of 6 complete",
      );
      // The app owns the task: nothing the user did is stored for it.
      expect(await stored(page)).toBeNull();
    });

    test("celebrates and collapses when every task is done", async ({
      page,
    }) => {
      await openInline(page);
      await page.getByRole("button", { name: "Toggle connected" }).click();
      for (const name of [
        "Create an alert",
        "Build a dashboard",
        "Publish your first report",
        "Invite a teammate",
      ]) {
        await checkTask(page, name);
      }
      await expect(page.getByText("All set", { exact: true })).toHaveCount(0);

      await page.getByRole("button", { name: "Skip" }).click();

      await expect(page.getByText("All set", { exact: true })).toBeVisible();
      await expect(page.getByRole("status")).toHaveText(
        "All set. Set up Acme Cloud is complete.",
      );
      await expect(
        page.getByRole("button", { name: "Set up Acme Cloud", exact: true }),
      ).toHaveAttribute("aria-expanded", "false");
      await expect(page.getByRole("checkbox").first()).toBeHidden();
      await expect(page.getByTestId("events")).toContainText("complete");

      await page.reload();
      await expect(page.getByText("All set", { exact: true })).toBeVisible();
      await expect(page.getByRole("status")).toHaveText("");
    });

    test("plays no animation for the celebration or the collapse under reduced motion", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await openInline(page);
      await page.getByRole("button", { name: "Toggle connected" }).click();
      for (const name of [
        "Create an alert",
        "Build a dashboard",
        "Publish your first report",
        "Invite a teammate",
      ]) {
        await checkTask(page, name);
      }
      await page.getByRole("button", { name: "Skip" }).click();
      await expect(page.getByText("All set", { exact: true })).toBeVisible();

      const motion = await page.evaluate(() => {
        const icon = document.querySelector(
          ".bx--onboarding__celebrate-icon",
        ) as Element;
        const body = document.querySelector(".bx--onboarding__body") as Element;
        return {
          animation: getComputedStyle(icon).animationName,
          transition: getComputedStyle(body).transitionProperty,
          duration: getComputedStyle(body).transitionDuration,
          running: document
            .getAnimations()
            .filter(
              (a) =>
                a instanceof CSSAnimation &&
                a.animationName === "onboarding-celebrate",
            ).length,
        };
      });
      expect(motion.animation).toBe("none");
      expect(motion.transition).toBe("none");
      expect(motion.running).toBe(0);
    });
  });

  test.describe("twenty tasks", () => {
    test("renders every task in four sections and keeps the page unscrolled sideways", async ({
      page,
    }) => {
      await openInline(page, "n=20");

      await expect(page.getByRole("listitem")).toHaveCount(20);
      await expect(page.getByRole("group")).toHaveCount(4);
      await expect(page.getByRole("progressbar")).toHaveAttribute(
        "aria-valuetext",
        "0 of 20 complete",
      );
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
      ).toBe(true);
    });
  });

  test.describe("floating", () => {
    test("sits in the bottom inline-end corner, and in the other corner in RTL", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1024, height: 700 });
      await openFloating(page);
      await page
        .getByRole("button", { name: "Minimize Getting started" })
        .click();
      const launcher = page.getByRole("button", {
        name: /^Getting started,/,
      });

      const box = await launcher.boundingBox();
      expect(box).not.toBeNull();
      expect(1024 - (box?.x ?? 0) - (box?.width ?? 0)).toBeCloseTo(16, 0);
      expect(700 - (box?.y ?? 0) - (box?.height ?? 0)).toBeCloseTo(16, 0);

      await page.evaluate(() =>
        document.documentElement.setAttribute("dir", "rtl"),
      );
      const rtl = await launcher.boundingBox();
      expect(rtl?.x).toBeCloseTo(16, 0);

      // "0 of 6 complete" keeps its digits in order under dir="rtl".
      expect(
        await launcher
          .locator(".bx--onboarding-launcher__progress")
          .evaluate((el) => getComputedStyle(el).unicodeBidi),
      ).toBe("plaintext");
    });

    test("leaves the end of the page uncovered at 320px", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await openFloating(page);
      await page
        .getByRole("button", { name: "Minimize Getting started" })
        .click();
      const launcher = page.getByRole("button", {
        name: /^Getting started,/,
      });
      await page.evaluate(() =>
        window.scrollTo(0, document.documentElement.scrollHeight),
      );

      const launcherBox = await launcher.boundingBox();
      expect(launcherBox?.width).toBeLessThanOrEqual(48);
      expect(launcherBox?.height).toBeLessThanOrEqual(48);
      for (const target of [
        page.getByTestId("last-content"),
        page.getByRole("button", { name: "Open setup guide" }),
      ]) {
        const box = await target.boundingBox();
        const overlaps =
          !!box &&
          !!launcherBox &&
          box.x < launcherBox.x + launcherBox.width &&
          box.x + box.width > launcherBox.x &&
          box.y < launcherBox.y + launcherBox.height &&
          box.y + box.height > launcherBox.y;
        expect(overlaps).toBe(false);
      }
    });

    test("fits the viewport at 320px when open, and scrolls its tasks", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 480 });
      await openFloating(page);

      const box = await page.getByTestId("checklist").boundingBox();
      expect(box?.x).toBeGreaterThanOrEqual(0);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(320);
      expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(480);
      const scrolls = await page.evaluate(() => {
        const inner = document.querySelector(
          ".bx--onboarding__body-inner",
        ) as HTMLElement;
        return inner.scrollHeight > inner.clientHeight;
      });
      expect(scrolls).toBe(true);
    });

    test("shows the text of the launcher from 672px", async ({ page }) => {
      await page.setViewportSize({ width: 672, height: 600 });
      await openFloating(page);
      await page
        .getByRole("button", { name: "Minimize Getting started" })
        .click();

      await expect(
        page
          .getByRole("button", { name: /^Getting started,/ })
          .getByText("0 of 6 complete"),
      ).toBeVisible();
    });
  });

  test.describe("forced colors", () => {
    test("keeps the panel and the launcher bordered and the progress ring visible", async ({
      page,
    }) => {
      await page.emulateMedia({ forcedColors: "active" });
      await openFloating(page);
      const panel = await page.getByTestId("checklist").evaluate((el) => {
        const cs = getComputedStyle(el);
        return { width: cs.borderTopWidth, style: cs.borderTopStyle };
      });
      expect(panel.style).toBe("solid");
      expect(panel.width).toBe("1px");

      await page
        .getByRole("button", { name: "Minimize Getting started" })
        .click();
      const launcher = page.getByRole("button", { name: /^Getting started,/ });
      await launcher.focus();
      const ring = await launcher.evaluate((el) => {
        const cs = getComputedStyle(el);
        const track = getComputedStyle(
          el.querySelector(".bx--onboarding-launcher__track") as Element,
        );
        const arc = getComputedStyle(
          el.querySelector(".bx--onboarding-launcher__arc") as Element,
        );
        return {
          border: cs.borderTopStyle,
          outline: cs.outlineStyle,
          track: track.stroke,
          arc: arc.stroke,
        };
      });
      expect(ring.border).toBe("solid");
      expect(ring.outline).not.toBe("none");
      expect(ring.track).not.toBe(ring.arc);
    });
  });
});
