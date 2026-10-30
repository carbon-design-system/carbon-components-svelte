import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const PANEL = ".bx--header-panel";
const ROW = ".bx--notifications-panel__item";

const bell = (page: Page) =>
  page.getByRole("button", { name: /^Notifications \(\d+ unread\)/ });

const events = (page: Page) =>
  page.getByTestId("events").evaluate((el) => el.textContent);

test.describe("NotificationsPanel", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test("works from the keyboard alone: open, move, dismiss, close", async ({
    page,
  }) => {
    await page.goto("/notifications-panel.html?count=12");
    await bell(page).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(PANEL)).toBeVisible();

    // Tab order: Dismiss all, the settings action, the toggle, then rows.
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "Dismiss all" }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Settings" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("switch")).toBeFocused();
    await page.keyboard.press("Space");
    await expect(page.getByTestId("dnd")).toHaveText("true");

    await page.keyboard.press("Tab");
    const first = page.getByRole("button", {
      name: /^Unread Notification 1\b/,
    });
    await expect(first).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(
      page.getByRole("link", { name: /Notification 2/ }),
    ).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(first).toBeFocused();

    // Delete dismisses the focused row and focus lands on the next row.
    await page.keyboard.press("Delete");
    await expect(page.locator(ROW)).toHaveCount(11);
    await expect(
      page.getByRole("link", { name: /Notification 2/ }),
    ).toBeFocused();

    // Tab reaches the row's dismiss button. Enter dismisses the row, and
    // focus lands on the next row's dismiss button. Notification 3 has none
    // (it is not dismissible), so its main button takes the focus.
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", {
        name: "Dismiss notification: Notification 2",
      }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator(ROW)).toHaveCount(10);
    await expect(
      page.getByRole("button", { name: /^Notification 3/ }),
    ).toBeFocused();
    // Notification 4 has an action: main button, Retry, then dismiss.
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Retry" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", {
        name: "Dismiss notification: Notification 4",
      }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("button", {
        name: "Dismiss notification: Notification 5",
      }),
    ).toBeFocused();

    // Escape closes the panel and returns focus to the bell.
    await page.keyboard.press("Escape");
    await expect(page.locator(PANEL)).toHaveCount(0);
    await expect(bell(page)).toBeFocused();
  });

  test("a link row closes the panel; Dismiss all sends focus to the heading", async ({
    page,
  }) => {
    await page.goto("/notifications-panel.html?count=12&open");
    await page.getByRole("link", { name: /Notification 2/ }).click();
    await expect(page.locator(PANEL)).toHaveCount(0);
    await expect(page.getByTestId("events")).toHaveText("click:n1");

    await bell(page).click();
    await page.getByRole("button", { name: "Dismiss all" }).focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("heading", { name: "Notifications", level: 2 }),
    ).toBeFocused();
    await expect(page.getByText("You're all caught up")).toBeVisible();
  });

  test("holds the rows still while the pointer rests on them", async ({
    page,
  }) => {
    await page.goto("/notifications-panel.html?count=12&open");
    const dismiss = (title: string) =>
      page.getByRole("button", {
        name: `Dismiss notification: ${title}`,
        exact: true,
      });
    const second = dismiss("Notification 2");
    await second.hover();
    const before = await second.boundingBox();
    if (!before) throw new Error("no dismiss button");

    // A new notification waits; the live region announces it at once.
    await page.evaluate(() =>
      (window as unknown as { addNotification: () => void }).addNotification(),
    );
    await expect(
      page.locator(".bx--notifications-panel [role=status]"),
    ).toHaveText("New notification 1");
    await expect(page.locator(ROW)).toHaveCount(12);
    expect(await second.boundingBox()).toEqual(before);

    // A dismissed row leaves its space, so a second click lands on nothing.
    await second.click();
    // Notification 3 has no dismiss button, so its main button takes focus.
    await expect(
      page.getByRole("button", { name: /^Notification 3/ }),
    ).toBeFocused();
    await page.mouse.click(before.x + 16, before.y + 16);
    expect(await events(page)).toBe("dismiss:n1");
    await expect(
      page.getByRole("button", { name: /^Notification 3/ }),
    ).toBeFocused();

    // Leaving the rows shows the new row and closes the space.
    await page.mouse.move(0, 400);
    await expect(page.locator(ROW)).toHaveCount(12);
    await expect(
      page.getByRole("button", { name: /^Unread New notification 1/ }),
    ).toBeVisible();
    await expect(page.locator(`${ROW}[aria-hidden]`)).toHaveCount(0);
  });

  test("shows the unread count on the bell and updates it", async ({
    page,
  }) => {
    await page.goto("/notifications-panel.html?count=200");
    const badge = page.locator(".bx--badge-indicator");
    await expect(badge).toHaveText("67");

    await bell(page).click();
    await page
      .getByRole("button", {
        name: "Dismiss notification: Notification 1",
        exact: true,
      })
      .click();
    // The open action shows its close icon, so the badge returns on close.
    await expect(badge).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(badge).toHaveText("66");
    await expect(bell(page)).toHaveAccessibleName(/66 unread/);
  });

  test("scrolls 200 rows inside the panel and keeps the footer in view", async ({
    page,
  }) => {
    await page.goto("/notifications-panel.html?count=200&open");
    await expect(page.locator(ROW)).toHaveCount(200);

    const geometry = await page.evaluate(() => {
      const body = document.querySelector<HTMLElement>(
        ".bx--notifications-panel__body",
      );
      const footer = document.querySelector<HTMLElement>(
        ".bx--notifications-panel__footer",
      );
      const panel = document.querySelector<HTMLElement>(".bx--header-panel");
      if (!body || !footer || !panel) throw new Error("missing");
      return {
        scrolls: body.scrollHeight > body.clientHeight,
        footerBottom: footer.getBoundingClientRect().bottom,
        viewport: window.innerHeight,
        panelScrolls: panel.scrollHeight > panel.clientHeight,
      };
    });
    expect(geometry.scrolls).toBe(true);
    expect(geometry.panelScrolls).toBe(false);
    expect(geometry.footerBottom).toBeLessThanOrEqual(geometry.viewport);

    await page.keyboard.press("Tab");
    await page.locator(".bx--notifications-panel__main").first().focus();
    await page.keyboard.press("End");
    await expect(
      page.locator(".bx--notifications-panel__main").last(),
    ).toBeFocused();
    await expect(
      page.locator(".bx--notifications-panel__main").last(),
    ).toBeInViewport();
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/notifications-panel.html?count=30&open");
    await expect(page.locator(ROW).first()).toBeVisible();

    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);

    await page.goto("/notifications-panel.html?plain&count=0");
    await expect(page.getByText("You're all caught up")).toBeVisible();
    const empty = await new AxeBuilder({ page }).include("#app").analyze();
    expect(empty.violations).toEqual([]);
  });

  test("fits a 320px viewport with no horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/notifications-panel.html?count=12&open");

    const panel = page.locator(PANEL);
    await expect(panel).toHaveCSS("width", "320px");
    const overflow = await page.evaluate(() => {
      const body = document.querySelector<HTMLElement>(
        ".bx--notifications-panel__body",
      );
      return body ? body.scrollWidth - body.clientWidth : -1;
    });
    expect(overflow).toBe(0);
    // The dismiss button stays inside the panel on touch-width screens.
    await expect(
      page
        .getByRole("button", { name: "Dismiss notification: Notification 1" })
        .first(),
    ).toBeInViewport({ ratio: 1 });
  });

  test("renders the panel without a header, on the page", async ({ page }) => {
    await page.goto("/notifications-panel.html?plain&count=12");
    const region = page.getByRole("region", { name: "Notifications" });
    await expect(region).toBeVisible();
    await expect(region.getByRole("heading", { level: 3 })).toHaveText([
      "Today",
      "Yesterday",
      "Previous",
    ]);
    expect(await events(page)).toBe("");
  });

  test.describe("right-to-left", () => {
    test("mirrors the dot, icon, dismiss button and the panel", async ({
      page,
    }) => {
      await page.goto("/notifications-panel.html?count=12&open");
      const measure = () =>
        page.evaluate(() => {
          const rect = (selector: string) => {
            const el = document.querySelector(selector);
            if (!el) throw new Error(`no ${selector}`);
            const { left, right } = el.getBoundingClientRect();
            return { left, right };
          };
          const dot = getComputedStyle(
            document.querySelector(
              ".bx--notifications-panel__item--unread",
            ) as Element,
            "::before",
          );
          return {
            width: document.documentElement.clientWidth,
            panel: rect(".bx--header-panel"),
            icon: rect(".bx--notifications-panel__icon"),
            content: rect(".bx--notifications-panel__content"),
            dismiss: rect(".bx--notifications-panel__dismiss"),
            dotWidth: dot.width,
          };
        });

      await page.evaluate(() => document.fonts.ready);
      const ltr = await measure();
      await page.evaluate(() => {
        document.documentElement.dir = "rtl";
      });
      const rtl = await measure();

      expect(ltr.panel.right).toBe(ltr.width);
      expect(rtl.panel.left).toBe(0);
      // The icon leads the text, and the dismiss button trails it.
      expect(ltr.icon.left).toBeLessThan(ltr.content.left);
      expect(ltr.dismiss.left).toBeGreaterThan(ltr.content.left);
      expect(rtl.icon.left).toBeGreaterThan(rtl.content.left);
      expect(rtl.dismiss.left).toBeLessThan(rtl.content.left);
      // Each part sits as far from the panel's edge as it did from the other.
      expect(Math.round(rtl.icon.right - rtl.panel.left)).toBe(
        Math.round(ltr.panel.right - ltr.icon.left),
      );
      expect(Math.round(rtl.dismiss.left - rtl.panel.left)).toBe(
        Math.round(ltr.panel.right - ltr.dismiss.right),
      );
      expect(rtl.dotWidth).toBe("6px");
    });
  });

  test.describe("forced colors", () => {
    test.beforeEach(async ({ page, browserName }) => {
      test.skip(browserName === "webkit", "WebKit does not force colors");
      await page.emulateMedia({ forcedColors: "active" });
    });

    test("keeps the unread dot, dividers and focus ring visible", async ({
      page,
    }) => {
      await page.goto("/notifications-panel.html?plain&count=12");
      const colors = await page.evaluate(() => {
        const probe = document.createElement("div");
        document.body.append(probe);
        const read = (color: string) => {
          probe.style.backgroundColor = color;
          return getComputedStyle(probe).backgroundColor;
        };
        const result = {
          canvasText: read("CanvasText"),
          grayText: read("GrayText"),
        };
        probe.remove();
        return result;
      });

      const dot = await page.evaluate(() => {
        const unread = document.querySelector(
          ".bx--notifications-panel__item--unread",
        ) as Element;
        const read = document.querySelector(
          ".bx--notifications-panel__item:not(.bx--notifications-panel__item--unread)",
        ) as Element;
        return {
          unread: getComputedStyle(unread, "::before").backgroundColor,
          read: getComputedStyle(read, "::before").backgroundColor,
        };
      });
      expect(dot.unread).toBe(colors.canvasText);
      expect(dot.read).not.toBe(colors.canvasText);

      const divider = await page
        .locator(`${ROW} + ${ROW}`)
        .first()
        .evaluate((el) => {
          const style = getComputedStyle(el);
          return { color: style.borderTopColor, width: style.borderTopWidth };
        });
      expect(divider.color).toBe(colors.grayText);
      expect(divider.width).toBe("1px");

      await page
        .getByRole("button", { name: /^Unread Notification 1\b/ })
        .focus();
      const ring = await page
        .locator(".bx--notifications-panel__main")
        .first()
        .evaluate((el) => {
          const style = getComputedStyle(el, "::after");
          return { style: style.outlineStyle, width: style.outlineWidth };
        });
      expect(ring.style).toBe("solid");
      expect(ring.width).toBe("2px");

      // The dismiss button's focus ring, even though it hides until hover.
      const dismiss = page
        .getByRole("button", { name: "Dismiss notification: Notification 1" })
        .first();
      await dismiss.focus();
      await expect(dismiss).toHaveCSS("outline-style", "solid");
      await expect(dismiss).toHaveCSS("opacity", "1");
    });
  });
});
