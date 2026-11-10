import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const feed = (page: Page) => page.getByRole("feed", { name: "Activity" });
const articles = (page: Page) => feed(page).getByRole("article");
const composer = (page: Page) =>
  page.getByRole("textbox", { name: "Comment", exact: true });

/** The key chord that the platform check of the feed reads as `mod`. */
async function mod(page: Page, key: string) {
  const apple = await page.evaluate(() =>
    /mac|iphone|ipad/i.test(
      (navigator as unknown as { userAgentData?: { platform?: string } })
        .userAgentData?.platform || navigator.platform,
    ),
  );
  return `${apple ? "Meta" : "Control"}+${key}`;
}

/** The comments whose author is the reader: those with a menu. */
const mine = (page: Page) =>
  feed(page)
    .locator(".bx--activity-comment")
    .filter({ has: page.getByRole("button", { name: "Comment options" }) });

async function open(page: Page, query = "n=14") {
  await page.goto(`/activity-feed.html?${query}`);
  await expect(feed(page)).toBeVisible();
}

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).include("#app").analyze();
  expect(results.violations).toEqual([]);
}

test.describe("axe", () => {
  test("has no violations", async ({ page }) => {
    await open(page);
    await axe(page);
  });

  test("has none in Gray 100", async ({ page }) => {
    await open(page);
    await page.evaluate(() =>
      document.documentElement.classList.add("bx--g100"),
    );
    await axe(page);
  });

  test("has none under dir=rtl", async ({ page }) => {
    await open(page);
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    await axe(page);
  });

  test("has none with the reaction menu, the editor and a reply open", async ({
    page,
  }) => {
    await open(page);
    await articles(page)
      .last()
      .getByRole("button", { name: "Add reaction" })
      .click();
    await expect(page.getByRole("menu")).toBeVisible();
    await axe(page);
    await page.keyboard.press("Escape");

    await articles(page).last().getByRole("button", { name: "Reply" }).click();
    await expect(
      page.getByRole("textbox", { name: /^Reply to/ }),
    ).toBeFocused();
    await axe(page);
  });

  test("has none with the mention menu open", async ({ page }) => {
    await open(page);
    await composer(page).click();
    await composer(page).pressSequentially("Hi @gra");
    await expect(page.getByRole("listbox", { name: "People" })).toBeVisible();
    await axe(page);
  });

  test("has none in a virtual window", async ({ page }) => {
    await open(page, "n=2000&virtual=1");
    await axe(page);
  });
});

test.describe("keyboard", () => {
  test("reaches every control without a pointer and submits with mod+Enter", async ({
    page,
  }) => {
    await open(page);
    await page.locator("body").press("Tab");
    await expect(articles(page).first()).toBeFocused();

    await page.keyboard.press("PageDown");
    await expect(articles(page).nth(1)).toBeFocused();
    await page.keyboard.press("PageUp");
    await expect(articles(page).first()).toBeFocused();

    await composer(page).focus();
    await page.keyboard.type("Posted from the keyboard");
    await page.keyboard.press(await mod(page, "Enter"));
    await expect(
      feed(page).getByText("Posted from the keyboard"),
    ).toBeVisible();
    await expect(composer(page)).toHaveValue("");
    await expect(composer(page)).toBeFocused();
    await expect(page.getByText("Sending")).toHaveCount(0);
  });

  test("edits in place from the menu and returns focus to it", async ({
    page,
  }) => {
    await open(page, "n=14");
    await mine(page)
      .last()
      .getByRole("button", { name: "Comment options" })
      .focus();
    await page.keyboard.press("Enter");
    await page.getByRole("menuitem", { name: "Edit" }).press("Enter");
    await expect(page.getByRole("textbox", { name: "Edit" })).toBeFocused();
    await page.keyboard.press(await mod(page, "a"));
    await page.keyboard.type("Edited from the keyboard");
    await page.keyboard.press(await mod(page, "Enter"));

    const own = feed(page)
      .locator(".bx--activity-comment")
      .filter({ hasText: "Edited from the keyboard" });
    await expect(own.getByRole("button", { name: "edited" })).toBeVisible();
    await expect(
      own.getByRole("button", { name: "Comment options" }),
    ).toBeFocused();
  });

  test("escape closes the editor and leaves the text", async ({ page }) => {
    await open(page, "n=14");
    await mine(page)
      .last()
      .getByRole("button", { name: "Comment options" })
      .click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await page.keyboard.type(" more");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("textbox", { name: "Edit" })).toHaveCount(0);
    await expect(feed(page).getByText("Agreed. Shipping today.")).toBeVisible();
  });

  test("a mention completes with Enter and reaches the comment as a token", async ({
    page,
  }) => {
    await open(page);
    await composer(page).click();
    await composer(page).pressSequentially("Ping @gra");
    await page.keyboard.press("Enter");
    await expect(composer(page)).toHaveValue("Ping @[Grace Hopper](grace) ");
    // Enter chose the person. It did not submit.
    await page.keyboard.press(await mod(page, "Enter"));
    await expect(
      articles(page).last().locator(".bx--activity-body__mention"),
    ).toHaveText("@Grace Hopper");
  });

  test("a failed comment stays with its text and can be retried", async ({
    page,
  }) => {
    await open(page);
    await page.evaluate(() =>
      (
        window as unknown as { __activity: { failNext(op: string): void } }
      ).__activity.failNext("add"),
    );
    await composer(page).click();
    await page.keyboard.type("Lost in the tunnel");
    await page.keyboard.press(await mod(page, "Enter"));

    const failed = articles(page).filter({ hasText: "Lost in the tunnel" });
    await expect(failed.getByText("Not sent")).toBeVisible();
    await page.evaluate(() =>
      (
        window as unknown as { __activity: { failNext(op: string): void } }
      ).__activity.failNext(""),
    );
    await failed.getByRole("button", { name: "Retry" }).click();
    await expect(failed.getByText("Not sent")).toHaveCount(0);
  });
});

test.describe("menus", () => {
  test("a menu opened in a row is not cut off by the row", async ({ page }) => {
    await open(page, "n=30");
    const add = page.getByRole("button", { name: "Add reaction" }).nth(-2);
    const row = add.locator("xpath=ancestor::article[1]");
    await add.click();
    const last = page.getByRole("menuitem").last();
    await expect(last).toBeVisible();
    const rowBottom = await row.evaluate(
      (el) => el.getBoundingClientRect().bottom,
    );
    const box = await last.boundingBox();
    expect(box && box.y + box.height).toBeGreaterThan(rowBottom);
    // What is at the middle of the last item is the item: nothing clips it.
    const topmost = await last.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const hit = document.elementFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      );
      return el.contains(hit);
    });
    expect(topmost).toBe(true);
  });
});

test.describe("incoming", () => {
  test("counts new comments while scrolled up, announces them and jumps on request", async ({
    page,
  }) => {
    await open(page, "n=40");
    const scroller = page.locator(".bx--activity-feed__scroller");
    await scroller.evaluate((el) => {
      el.scrollTop = 0;
    });
    await expect(page.getByRole("button", { name: /new comment/ })).toHaveCount(
      0,
    );

    // The observer of the end of the feed reports on the next frames.
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    await page.evaluate(() =>
      (
        window as unknown as { __activity: { receive(n: number): void } }
      ).__activity.receive(2),
    );
    const pill = page.getByRole("button", { name: "2 new comments" });
    await expect(pill).toBeVisible();
    await expect(page.getByRole("status")).toHaveText("2 new comments");
    // Nothing moved under the reader, and focus is where it was.
    expect(await scroller.evaluate((el) => el.scrollTop)).toBeLessThan(5);

    await pill.click();
    await expect(pill).toHaveCount(0);
    await expect(feed(page).getByText("Incoming comment 42")).toBeInViewport();
  });

  test("follows new comments while the reader is at the end", async ({
    page,
  }) => {
    await open(page, "n=40");
    await page.evaluate(() =>
      (
        window as unknown as { __activity: { receive(n: number): void } }
      ).__activity.receive(1),
    );
    await expect(feed(page).getByText("Incoming comment 41")).toBeInViewport();
    await expect(page.getByRole("button", { name: /new comment/ })).toHaveCount(
      0,
    );
  });
});

test.describe("older activity", () => {
  test("loads a page above the first comment and moves focus to it", async ({
    page,
  }) => {
    await open(page, "n=10&older=1");
    const before = await articles(page).count();
    await page.getByRole("button", { name: "Load older activity" }).click();
    await expect.poll(() => articles(page).count()).toBeGreaterThan(before);
    await expect(articles(page).first()).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Load older activity" }),
    ).toHaveCount(0);
  });
});

test.describe("direction", () => {
  test("lays each paragraph out in its own direction on an LTR page", async ({
    page,
  }) => {
    await open(page, "n=30");
    const arabic = feed(page).getByText("مرحبا", { exact: false }).first();
    await expect(arabic).toBeAttached();
    expect(await arabic.evaluate((el) => getComputedStyle(el).direction)).toBe(
      "rtl",
    );
  });

  test("mirrors the layout and keeps an English paragraph LTR on an RTL page", async ({
    page,
  }) => {
    await open(page, "n=14");
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const paragraph = feed(page).getByText("Agreed. Shipping today.");
    expect(
      await paragraph.evaluate((el) => getComputedStyle(el).direction),
    ).toBe("ltr");

    const box = (selector: string) =>
      feed(page)
        .locator(selector)
        .last()
        .evaluate((el) => {
          const rect = el.getBoundingClientRect();
          return { left: rect.left, right: rect.right };
        });
    const avatar = await box(".bx--activity-comment .bx--user-avatar");
    const row = await box(".bx--activity-row");
    // The avatar leads from the right edge.
    expect(row.right - avatar.right).toBeLessThan(avatar.left - row.left);
  });
});

test.describe("forced colors", () => {
  test("tells a pressed reaction from an unpressed one and draws the edges", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await open(page, "n=14");
    const style = (selector: string) =>
      feed(page)
        .locator(selector)
        .first()
        .evaluate((el) => {
          const computed = getComputedStyle(el);
          return {
            background: computed.backgroundColor,
            border: computed.borderTopColor,
            width: computed.borderBottomWidth,
            color: computed.color,
          };
        });
    const pressed = await style(".bx--tag--selectable-selected");
    const rest = await style(
      ".bx--tag--selectable:not(.bx--tag--selectable-selected)",
    );
    expect(JSON.stringify(pressed)).not.toBe(JSON.stringify(rest));

    const code = await style(".bx--activity-body pre");
    expect(code.width).toBe("1px");
    const row = await style(".bx--activity-row");
    expect(row.width).not.toBe("0px");
  });
});

test.describe("2,000 items", () => {
  test("a virtual window renders only the rows near the viewport", async ({
    page,
  }) => {
    await open(page, "n=2000&virtual=1");
    expect(await articles(page).count()).toBeLessThan(40);

    await articles(page).last().focus();
    const key = await articles(page).last().getAttribute("aria-posinset");
    expect(Number(key)).toBeGreaterThan(1500);
    await expect(articles(page).last()).toHaveAttribute(
      "aria-setsize",
      /\d{4}/,
    );
    await page.keyboard.press("PageUp");
    await expect(page.locator("article:focus")).toHaveAttribute(
      "aria-posinset",
      String(Number(key) - 1),
    );
  });

  test("a feed with every row mounted still scrolls and takes keys", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await open(page, "n=600");
    expect(await articles(page).count()).toBeGreaterThan(450);
    await articles(page).first().focus();
    await page.keyboard.press("PageDown");
    await expect(articles(page).nth(1)).toBeFocused();
  });
});
