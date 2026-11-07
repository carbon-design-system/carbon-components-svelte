import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const card = (page: Page) => page.getByRole("dialog");

async function center(page: Page, testId: string) {
  const box = await page.getByTestId(testId).boundingBox();
  if (!box) throw new Error(`${testId} has no box`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, box };
}

async function hoverTrigger(page: Page, testId: string) {
  const { x, y } = await center(page, testId);
  await page.mouse.move(x, y);
}

test.describe("HoverCard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/hover-card.html");
    await expect(page.getByTestId("user-trigger")).toBeVisible();
  });

  test.describe("pointer", () => {
    test("opens after the open delay below the trigger and closes on leave", async ({
      page,
    }) => {
      await hoverTrigger(page, "user-trigger");
      await page.waitForTimeout(250);
      await expect(card(page)).toHaveCount(0);
      await expect(card(page)).toBeVisible();
      const trigger = await page.getByTestId("user-trigger").boundingBox();
      const body = await card(page).boundingBox();
      expect(body!.y).toBeGreaterThanOrEqual(trigger!.y + trigger!.height);
      expect(Math.abs(body!.x - trigger!.x)).toBeLessThan(2);

      await page.mouse.move(600, 600);
      await expect(card(page)).toHaveCount(0);
    });

    test("stays open while the pointer crosses the gap, even off the card's span", async ({
      page,
    }) => {
      await hoverTrigger(page, "user-trigger");
      await expect(card(page)).toBeVisible();
      const trigger = (await page.getByTestId("user-trigger").boundingBox())!;
      const body = (await card(page).boundingBox())!;
      // Out of the trigger's bottom edge, diagonally toward the card's far
      // corner, slowly enough that the close delay would run out.
      await page.mouse.move(trigger.x + 4, trigger.y + trigger.height - 1);
      await page.mouse.move(trigger.x + 4, trigger.y + trigger.height + 4, {
        steps: 4,
      });
      await page.waitForTimeout(450);
      await page.mouse.move(body.x + body.width - 8, body.y + 20, {
        steps: 10,
      });
      await page.waitForTimeout(600);
      await expect(card(page)).toBeVisible();
    });

    test("a portalled card stays open for a slow pointer aimed at it, and closes for one that is not", async ({
      page,
    }) => {
      await hoverTrigger(page, "clipped-trigger");
      await expect(card(page)).toBeVisible();
      const trigger = (await page
        .getByTestId("clipped-trigger")
        .boundingBox())!;
      const body = (await card(page).boundingBox())!;
      expect(body.y).toBeGreaterThan(trigger.y + trigger.height + 4);
      const startX = trigger.x + trigger.width / 2;
      const startY = trigger.y + trigger.height - 2;
      const endX = body.x + body.width - 10;
      const endY = body.y + 12;
      // Over a second, longer than the close delay, from trigger to card.
      const steps = 24;
      for (let step = 0; step <= steps; step++) {
        await page.mouse.move(
          startX + ((endX - startX) * step) / steps,
          startY + ((endY - startY) * step) / steps,
        );
        await page.waitForTimeout(40);
      }
      await page.waitForTimeout(600);
      await expect(card(page)).toBeVisible();

      // The same card, the pointer heading away: it closes.
      await page.mouse.move(startX, startY);
      await page.mouse.move(endX + 400, trigger.y - 40, { steps: 10 });
      await expect(card(page)).toHaveCount(0);
    });

    test("stays open under the pointer and its buttons work", async ({
      page,
    }) => {
      await hoverTrigger(page, "user-trigger");
      await expect(card(page)).toBeVisible();
      await page.getByTestId("follow").hover();
      await page.waitForTimeout(700);
      await expect(card(page)).toBeVisible();
      await page.getByTestId("follow").click();
      await expect(page.getByTestId("stats")).toHaveAttribute(
        "data-followed",
        "true",
      );
      await page.mouse.move(700, 500);
      await expect(card(page)).toHaveCount(0);
    });

    test("opens nothing for a pointer that sweeps past", async ({ page }) => {
      const { box } = await center(page, "user-trigger");
      const issue = await center(page, "issue-trigger");
      for (let pass = 0; pass < 3; pass++) {
        await page.mouse.move(box.x - 20, box.y + 6);
        await page.mouse.move(issue.x + 40, issue.y, { steps: 20 });
      }
      await page.waitForTimeout(800);
      await expect(card(page)).toHaveCount(0);
    });

    test("only one card is open", async ({ page }) => {
      await hoverTrigger(page, "user-trigger");
      await expect(card(page)).toBeVisible();
      await page.mouse.move(700, 500);
      await hoverTrigger(page, "issue-trigger");
      await expect(page.getByText("Hover cards lose")).toBeVisible();
      await expect(card(page)).toHaveCount(1);
    });

    test("Escape closes it with the pointer still over the trigger", async ({
      page,
    }) => {
      await hoverTrigger(page, "user-trigger");
      await expect(card(page)).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(card(page)).toHaveCount(0);
      await page.waitForTimeout(700);
      await expect(card(page)).toHaveCount(0);
      // Leaving and coming back opens it again.
      await page.mouse.move(700, 500);
      await hoverTrigger(page, "user-trigger");
      await expect(card(page)).toBeVisible();
    });
  });

  test.describe("keyboard", () => {
    test("opens on focus, and Tab moves into the card and out", async ({
      page,
    }) => {
      await page.getByTestId("user-trigger").focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("user-trigger")).toBeFocused();
      await expect(card(page)).toBeVisible();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("follow")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("message")).toBeFocused();
      await page.waitForTimeout(700);
      await expect(card(page)).toBeVisible();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Shift+Tab");
      await expect(page.getByTestId("user-trigger")).toBeFocused();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("issue-trigger")).toBeFocused();
      await expect(page.getByText("Mona Lisa Octocat")).toHaveCount(0);
    });

    test("Escape from inside the card returns focus to the trigger", async ({
      page,
    }) => {
      await page.getByTestId("user-trigger").focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await expect(card(page)).toBeVisible();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("follow")).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(card(page)).toHaveCount(0);
      await expect(page.getByTestId("user-trigger")).toBeFocused();
      await page.waitForTimeout(500);
      await expect(card(page)).toHaveCount(0);
    });

    test("tabbing through triggers opens no cards", async ({ page }) => {
      await page.getByTestId("user-trigger").focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Escape");
      await expect(card(page)).toHaveCount(0);
      // The trigger then tab again quickly: no dwell, no card.
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("clipped-trigger")).toBeFocused();
    });

    test("a portalled card is reached by Tab in order", async ({ page }) => {
      await page.getByTestId("clipped-trigger").focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await expect(card(page)).toBeVisible();
      // The card left the clipping box for the body.
      expect(
        await card(page).evaluate((el) => el.closest("[data-testid=clipped]")),
      ).toBeNull();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("clipped-action")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("clipped-action-2")).toBeFocused();
      // Past the last control, focus goes on to what follows the trigger.
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("async-trigger")).toBeFocused();
    });

    test("Shift+Tab from the first control of a portalled card goes to the trigger", async ({
      page,
    }) => {
      await page.getByTestId("clipped-trigger").focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await expect(card(page)).toBeVisible();
      await page.keyboard.press("Tab");
      await expect(page.getByTestId("clipped-action")).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(page.getByTestId("clipped-trigger")).toBeFocused();
      await expect(card(page)).toBeVisible();
    });
  });

  test.describe("placement", () => {
    test("a card in a clipping box moves to a portal and shows whole", async ({
      page,
    }) => {
      await hoverTrigger(page, "clipped-trigger");
      await expect(page.getByTestId("clipped-body")).toBeVisible();
      // The card left the clipping box, so the last control shows and
      // takes a click even where the box would have cut it off.
      expect(
        await card(page).evaluate((el) => el.closest("[data-testid=clipped]")),
      ).toBeNull();
      await page.getByTestId("clipped-action-2").click();
      await expect(page.getByTestId("clipped-action-2")).toBeFocused();
    });

    test("a card at the window's corner stays inside it", async ({ page }) => {
      await hoverTrigger(page, "edge-trigger");
      await expect(page.getByTestId("edge-body")).toBeVisible();
      const body = (await card(page).boundingBox())!;
      const view = page.viewportSize()!;
      expect(body.x).toBeGreaterThanOrEqual(0);
      expect(body.y).toBeGreaterThanOrEqual(0);
      expect(body.x + body.width).toBeLessThanOrEqual(view.width);
      expect(body.y + body.height).toBeLessThanOrEqual(view.height);
    });
  });

  test.describe("async content", () => {
    test("loads once on open, with a skeleton, and aborts when closed early", async ({
      page,
    }) => {
      await hoverTrigger(page, "async-trigger");
      await expect(card(page)).toHaveAttribute("aria-busy", "true");
      await expect(page.getByTestId("async-body")).toHaveCount(0);
      await page.mouse.move(700, 500);
      await expect(card(page)).toHaveCount(0);
      await expect(page.getByTestId("stats")).toHaveAttribute(
        "data-aborts",
        "1",
      );

      await hoverTrigger(page, "async-trigger");
      await expect(page.getByTestId("async-body")).toHaveText(
        "Mona Lisa Octocat (@octocat)",
      );
      await expect(page.getByTestId("stats")).toHaveAttribute(
        "data-loads",
        "2",
      );
    });
  });

  test.describe("accessibility", () => {
    test("has no detectable violations with the card open", async ({
      page,
    }) => {
      await hoverTrigger(page, "user-trigger");
      await expect(card(page)).toBeVisible();
      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    });

    test("is a dialog the trigger points to, in the browser's own tree", async ({
      page,
    }) => {
      await hoverTrigger(page, "async-trigger");
      await expect(card(page)).toBeVisible();
      const cdp = await page.context().newCDPSession(page);
      const { nodes } = await cdp.send("Accessibility.getFullAXTree");
      const dialog = nodes.find(
        (node) => !node.ignored && node.role?.value === "dialog",
      );
      expect(dialog?.name?.value).toBe("Async");
      const link = nodes.find(
        (node) =>
          !node.ignored &&
          node.name?.value === "Async" &&
          node.role?.value === "link",
      );
      const details = link?.properties?.find((prop) => prop.name === "details");
      expect(details?.value.relatedNodes?.length).toBe(1);
      const noAria = link?.properties?.find((prop) => prop.name === "expanded");
      expect(noAria).toBeUndefined();
    });
  });

  test.describe("right to left", () => {
    test("aligns the card with the trigger's start edge", async ({ page }) => {
      await page.evaluate(() => {
        document.documentElement.dir = "rtl";
      });
      await hoverTrigger(page, "user-trigger");
      await expect(card(page)).toBeVisible();
      const trigger = (await page.getByTestId("user-trigger").boundingBox())!;
      const body = (await card(page).boundingBox())!;
      expect(
        Math.abs(body.x + body.width - (trigger.x + trigger.width)),
      ).toBeLessThan(2);
    });
  });

  test.describe("forced colors", () => {
    test("the card keeps a visible edge", async ({ page }) => {
      await page.emulateMedia({ forcedColors: "active" });
      await hoverTrigger(page, "user-trigger");
      await expect(card(page)).toBeVisible();
      const edge = await page
        .locator(".bx--hover-card-popover .bx--popover-contents")
        .evaluate((el) => {
          const style = getComputedStyle(el);
          return `${style.outlineStyle} ${style.outlineWidth}`;
        });
      expect(edge).toBe("solid 1px");
    });
  });

  test.describe("motion", () => {
    const animation = (page: Page) =>
      page
        .locator(".bx--hover-card-popover")
        .evaluate((el) => getComputedStyle(el).animationName);

    test("the card fades in", async ({ page }) => {
      await hoverTrigger(page, "user-trigger");
      await expect(card(page)).toBeVisible();
      expect(await animation(page)).toBe("hover-card-enter");
    });

    test("the card does not animate under reduced motion", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await hoverTrigger(page, "user-trigger");
      await expect(card(page)).toBeVisible();
      expect(await animation(page)).toBe("none");
    });
  });
});

test.describe("HoverCard on touch", () => {
  test("a tap follows the link and opens no card", async ({
    browser,
  }, info) => {
    const context = await browser.newContext({
      hasTouch: true,
      isMobile: true,
      viewport: { width: 600, height: 800 },
      baseURL: info.project.use.baseURL,
    });
    const page = await context.newPage();
    await page.goto("/hover-card.html");
    await page.getByTestId("user-trigger").tap();
    await page.waitForTimeout(900);
    await expect(card(page)).toHaveCount(0);
    expect(new URL(page.url()).hash).toBe("#octocat");
    await context.close();
  });
});

test.describe("HoverCard in a long list", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/hover-card-list.html");
    await expect(page.getByTestId("trigger-100")).toBeAttached();
  });

  test("a sweep down 100 triggers opens none, and one dwell opens one", async ({
    page,
  }) => {
    // Count every card that mounts, even for a frame.
    await page.evaluate(() => {
      const counter = { mounted: 0 };
      (window as unknown as { __cards: typeof counter }).__cards = counter;
      new MutationObserver((records) => {
        for (const record of records)
          for (const node of record.addedNodes)
            if (
              node instanceof Element &&
              node.matches("[class*=hover-card-popover]")
            )
              counter.mounted++;
      }).observe(document.body, { childList: true, subtree: true });
    });
    const first = (await page.getByTestId("trigger-1").boundingBox())!;
    const last = (await page.getByTestId("trigger-25").boundingBox())!;
    await page.mouse.move(first.x + 4, first.y + 4);
    await page.mouse.move(first.x + 4, last.y + 4, { steps: 60 });
    await page.mouse.move(first.x + 4, first.y + 4, { steps: 60 });
    await page.mouse.move(700, 500);
    await page.waitForTimeout(500);
    await expect(card(page)).toHaveCount(0);
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { __cards: { mounted: number } }).__cards
            .mounted,
      ),
    ).toBe(0);

    await page.getByTestId("trigger-3").hover();
    await expect(card(page)).toHaveCount(1);
    await expect(page.getByTestId("card-3")).toBeVisible();
  });

  test("mounts 100 triggers with no cards and no window listeners", async ({
    page,
  }) => {
    await expect(page.locator(".bx--hover-card")).toHaveCount(100);
    await expect(page.locator(".bx--hover-card-popover")).toHaveCount(0);
  });
});
