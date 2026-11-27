import AxeBuilder from "@axe-core/playwright";
import { type Page, test as plain } from "@playwright/test";
import { expect, test } from "./helpers/host";

const results = (page: Page) => page.getByTestId(/^result-\d+$/);
const loadMore = (page: Page) =>
  page.getByRole("button", { name: /^Load more$/ });
const status = (page: Page) => page.getByRole("status").last();

/** The top edge of a result in the viewport, or the scroll area's. */
function topOf(page: Page, id: number) {
  return page
    .getByTestId(`result-${id}`)
    .evaluate(
      (el) => el.closest("li, [role=article]")?.getBoundingClientRect().top,
    );
}

async function scrollToEnd(page: Page) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
}

async function click(page: Page, times: number, expected: number) {
  for (let i = 0; i < times; i++) {
    const before = await results(page).count();
    await loadMore(page).click();
    await expect(results(page)).toHaveCount(before + 20);
  }
  await expect(results(page)).toHaveCount(expected);
}

test.describe("InfiniteList", () => {
  test("loads a page a click, announces it and focuses the first new result", async ({
    page,
  }) => {
    await page.goto("/infinite-list.html");
    await expect(results(page)).toHaveCount(20);
    await expect(page.getByText("Showing 20 of 4,000")).toBeVisible();
    await expect(page.getByRole("list")).toHaveAttribute(
      "aria-label",
      "Search results",
    );

    await loadMore(page).click();
    await expect(results(page)).toHaveCount(40);
    await expect(status(page)).toHaveText("20 more results loaded");
    await expect(page.getByTestId("result-21")).toBeFocused();
    await expect(page.getByRole("listitem").nth(30)).toHaveAttribute(
      "aria-posinset",
      "31",
    );
    await expect(page.getByRole("listitem").nth(30)).toHaveAttribute(
      "aria-setsize",
      "4000",
    );
  });

  test("a button-only list never loads on its own", async ({ page }) => {
    await page.goto("/infinite-list.html");
    await expect(results(page)).toHaveCount(20);
    await scrollToEnd(page);
    await page.waitForTimeout(400);
    await expect(results(page)).toHaveCount(20);
  });

  test("auto-then-button loads two pages on scroll and leaves the footer reachable", async ({
    page,
  }) => {
    await page.goto("/infinite-list.html?mode=auto-then-button&autoPages=2");
    await expect(results(page)).toHaveCount(20);
    await expect(async () => {
      await scrollToEnd(page);
      await expect(results(page)).toHaveCount(60, { timeout: 500 });
    }).toPass();

    await scrollToEnd(page);
    await page.waitForTimeout(400);
    await expect(results(page)).toHaveCount(60);
    await expect(loadMore(page)).toBeVisible();
    await expect(page.getByTestId("footer-link")).toBeInViewport();

    await loadMore(page).click();
    await expect(results(page)).toHaveCount(80);
  });

  test("auto mode keeps loading while the reader scrolls", async ({ page }) => {
    await page.goto("/infinite-list.html?mode=auto");
    await expect(async () => {
      await scrollToEnd(page);
      await expect(results(page)).toHaveCount(100, { timeout: 500 });
    }).toPass();
  });

  test("a keyboard reaches the footer without a page loading under it", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "Safari's Tab skips links");
    await page.goto("/infinite-list.html?mode=auto");
    await expect(results(page)).toHaveCount(20);
    await page.getByTestId("before").focus();

    // Skip link, then the 20 results.
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "Skip to end of results" }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("result-1")).toBeFocused();
    for (let i = 0; i < 19; i++) await page.keyboard.press("Tab");
    await expect(page.getByTestId("result-20")).toBeFocused();
    // The last result is in view and the end of the list is near, and
    // nothing has loaded.
    await page.waitForTimeout(500);
    await expect(results(page)).toHaveCount(20);

    await page.keyboard.press("Tab");
    await expect(loadMore(page)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("footer-link")).toBeFocused();
  });

  test("the skip link jumps past the list", async ({ page, browserName }) => {
    test.skip(browserName === "webkit", "Safari's Tab skips links");
    await page.goto("/infinite-list.html");
    await loadMore(page).click();
    await expect(results(page)).toHaveCount(40);
    await page.getByTestId("before").focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page.locator("#results-end")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("footer-link")).toBeFocused();
  });

  test("shows a slow page as busy", async ({ page }) => {
    await page.goto("/infinite-list.html?latency=600");
    await loadMore(page).click();
    const busy = page.getByRole("button", { name: "Loading more" });
    await expect(busy).toHaveAttribute("aria-busy", "true");
    await expect(page.getByRole("list")).toHaveAttribute("aria-busy", "true");
    await expect(results(page)).toHaveCount(40);
    await expect(page.getByRole("list")).not.toHaveAttribute("aria-busy");
  });

  test("keeps the results and offers a retry when a page fails", async ({
    page,
  }) => {
    await page.goto("/infinite-list.html?fail=2");
    await loadMore(page).click();
    await expect(page.getByRole("alert")).toContainText(
      "Could not load results.",
    );
    await expect(results(page)).toHaveCount(20);
    await expect(loadMore(page)).toHaveCount(0);

    await page.getByRole("button", { name: "Try again" }).click();
    await expect(results(page)).toHaveCount(40);
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByTestId("result-21")).toBeFocused();
  });

  test("retries a first page that failed", async ({ page }) => {
    await page.goto("/infinite-list.html?pages=0&fail=1");
    await expect(page.getByRole("alert")).toBeVisible();
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(results(page)).toHaveCount(20);
  });

  test("stops at the depth cap", async ({ page }) => {
    await page.goto("/infinite-list.html?cap=40");
    await loadMore(page).click();
    await expect(results(page)).toHaveCount(40);
    await expect(loadMore(page)).toHaveCount(0);
    await expect(
      page.getByText("Showing 40 of 4,000. Refine your search to see more."),
    ).toBeVisible();
  });

  test("ends the list when there is no more", async ({ page }) => {
    await page.goto("/infinite-list.html?total=30");
    await loadMore(page).click();
    await expect(results(page)).toHaveCount(30);
    await expect(
      page.getByText("You have reached the end of the results."),
    ).toBeVisible();
    await expect(loadMore(page)).toHaveCount(0);
  });

  test("a feed moves between articles with Page Down and Page Up", async ({
    page,
  }) => {
    await page.goto("/infinite-list.html?pattern=feed");
    await expect(page.getByRole("feed")).toBeVisible();
    await page.getByTestId("result-1").focus();
    await page.keyboard.press("PageDown");
    await expect(page.getByRole("article").nth(1)).toBeFocused();
    await page.keyboard.press("PageUp");
    await expect(page.getByRole("article").first()).toBeFocused();
  });

  test("scrolls its own container and leaves the page alone", async ({
    page,
  }) => {
    await page.goto("/infinite-list.html?scroll=container&mode=auto");
    const area = page.locator(".bx--infinite-list");
    await expect(results(page)).toHaveCount(20);
    await expect(area).toHaveCSS("overflow-y", "auto");
    await expect(async () => {
      await area.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      await expect(results(page)).toHaveCount(60, { timeout: 500 });
    }).toPass();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    await area.focus();
    await expect(area).toBeFocused();
  });

  test("meets WCAG in white, Gray 100 and RTL, with the error and cap rows", async ({
    page,
  }) => {
    await page.goto("/infinite-list.html?fail=2&cap=40");
    await expect(results(page)).toHaveCount(20);
    // A theme change fades colors; read them once it has settled.
    await page.addStyleTag({ content: "* { transition: none !important; }" });
    const check = async () =>
      (await new AxeBuilder({ page }).include("#app").analyze()).violations;

    expect(await check()).toEqual([]);

    await page.evaluate(() =>
      document.documentElement.classList.add("bx--g100"),
    );
    expect(await check()).toEqual([]);

    await page.evaluate(() => {
      document.documentElement.classList.remove("bx--g100");
      document.documentElement.dir = "rtl";
    });
    expect(await check()).toEqual([]);

    await loadMore(page).click();
    await expect(page.getByRole("alert")).toBeVisible();
    expect(await check()).toEqual([]);

    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByText(/Refine your search/)).toBeVisible();
    expect(await check()).toEqual([]);
  });

  test("draws the error edge on the inline start, in both directions", async ({
    page,
  }) => {
    await page.goto("/infinite-list.html?fail=2");
    await loadMore(page).click();
    const error = page.locator(".bx--infinite-list__error");
    await expect(error).toBeVisible();
    await expect(error).toHaveCSS("border-left-width", "3px");
    await expect(error).toHaveCSS("border-right-width", "0px");

    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    await expect(error).toHaveCSS("border-right-width", "3px");
    await expect(error).toHaveCSS("border-left-width", "0px");
  });

  test("keeps its focus rings under forced colors", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "WebKit does not force colors");
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/infinite-list.html?fail=2&scroll=container");
    await expect(results(page)).toHaveCount(20);
    await page.locator(".bx--infinite-list").focus();
    const ring = await page
      .locator(".bx--infinite-list")
      .evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(ring).not.toBe("none");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to end of results" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    expect(
      await skip.evaluate((el) => getComputedStyle(el).outlineStyle),
    ).not.toBe("none");
  });
});

// Back needs a real navigation, which the shared host page does not make.
plain.describe("InfiniteList restoration", () => {
  /** Scroll so result `id` sits `offset` px below the top of the viewport. */
  async function place(page: Page, id: number, offset: number) {
    await page.getByTestId(`result-${id}`).evaluate((el, offset) => {
      const li = el.closest("li") as HTMLElement;
      window.scrollBy(0, li.getBoundingClientRect().top - offset);
    }, offset);
  }

  plain("brings back the pages and the place after Back", async ({ page }) => {
    await page.goto("/infinite-list.html?restore");
    await click(page, 3, 80);
    await place(page, 55, 120);
    // Let the scroll settle, so it is saved before the click.
    await page.waitForTimeout(400);
    const before = await topOf(page, 55);
    expect(before).toBeCloseTo(120, 0);

    await page.getByTestId("result-55").click();
    await expect(page).toHaveURL(/index\.html\?result=55/);
    await page.goBack();

    await expect(results(page)).toHaveCount(80);
    await expect.poll(() => topOf(page, 55)).toBeCloseTo(before ?? 0, 0);
    expect(await page.evaluate(() => history.scrollRestoration)).toBe("manual");
    // Restoring is not announced.
    await expect(status(page)).toHaveText("");
    // The list works on: the next page follows the 80th result.
    await loadMore(page).click();
    await expect(results(page)).toHaveCount(100);
  });

  plain("restores on Forward too", async ({ page }) => {
    await page.goto("/infinite-list.html?restore");
    await click(page, 2, 60);
    await place(page, 45, 80);
    await page.waitForTimeout(400);
    const before = await topOf(page, 45);

    await page.getByTestId("result-45").click();
    await page.goBack();
    await expect(results(page)).toHaveCount(60);
    await page.goForward();
    await page.goBack();
    await expect(results(page)).toHaveCount(60);
    await expect.poll(() => topOf(page, 45)).toBeCloseTo(before ?? 0, 0);
  });

  plain("restores on reload", async ({ page }) => {
    await page.goto("/infinite-list.html?restore");
    await click(page, 2, 60);
    await place(page, 50, 200);
    await page.waitForTimeout(400);
    const before = await topOf(page, 50);

    await page.reload();
    await expect(results(page)).toHaveCount(60);
    await expect.poll(() => topOf(page, 50)).toBeCloseTo(before ?? 0, 0);
  });

  plain(
    "starts at the top on a new visit to the same URL",
    async ({ page }) => {
      await page.goto("/infinite-list.html?restore");
      await click(page, 2, 60);
      await place(page, 50, 200);
      await page.waitForTimeout(400);

      // A different page first: going to the same URL again would replace
      // this history entry, and the browser keeps an entry's key.
      await page.goto("/index.html");
      await page.goto("/infinite-list.html?restore");
      await expect(results(page)).toHaveCount(20);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
    },
  );

  plain(
    "puts history.scrollRestoration back when the list leaves",
    async ({ page }) => {
      await page.goto("/infinite-list.html?restore");
      await expect(results(page)).toHaveCount(20);
      expect(await page.evaluate(() => history.scrollRestoration)).toBe(
        "manual",
      );
      await page.goto("/infinite-list.html");
      expect(await page.evaluate(() => history.scrollRestoration)).toBe("auto");
    },
  );

  plain("restores a list that scrolls its own container", async ({ page }) => {
    await page.goto("/infinite-list.html?restore&scroll=container&mode=auto");
    const area = page.locator(".bx--infinite-list");
    await expect(async () => {
      await area.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      await expect(results(page)).toHaveCount(60, { timeout: 500 });
    }).toPass();
    await page.getByTestId("result-55").evaluate((el) => {
      const li = el.closest("li") as HTMLElement;
      const root = li.closest(".bx--infinite-list") as HTMLElement;
      root.scrollTop +=
        li.getBoundingClientRect().top - root.getBoundingClientRect().top - 24;
    });
    await page.waitForTimeout(400);
    const before = await topOf(page, 55);

    await page.getByTestId("result-55").click();
    await page.goBack();
    await expect(results(page).nth(59)).toBeAttached();
    await expect.poll(() => topOf(page, 55)).toBeCloseTo(before ?? 0, 0);
  });

  plain(
    "restores the place in a list with lazy items",
    async ({ page, browserName }) => {
      plain.skip(
        browserName === "webkit",
        "Scrolling to the button moves it as skipped items take their real size, so a click misses",
      );
      await page.goto("/infinite-list.html?restore&lazy&weight=heavy");
      await expect(page.locator(".bx--infinite-list__item").first()).toHaveCSS(
        "content-visibility",
        "auto",
      );
      await click(page, 3, 80);
      await place(page, 55, 120);
      await page.waitForTimeout(400);
      const before = await topOf(page, 55);

      await page.getByTestId("result-55").click();
      await page.goBack();
      await expect(results(page)).toHaveCount(80);
      await expect.poll(() => topOf(page, 55)).toBeCloseTo(before ?? 0, 0);
    },
  );

  plain(
    "restores a list that loads its first page itself",
    async ({ page }) => {
      await page.goto("/infinite-list.html?restore&pages=0");
      await expect(results(page)).toHaveCount(20);
      await click(page, 2, 60);
      await place(page, 41, 100);
      await page.waitForTimeout(400);
      const before = await topOf(page, 41);

      await page.getByTestId("result-41").click();
      await page.goBack();
      await expect(results(page)).toHaveCount(60);
      await expect.poll(() => topOf(page, 41)).toBeCloseTo(before ?? 0, 0);
    },
  );
});
