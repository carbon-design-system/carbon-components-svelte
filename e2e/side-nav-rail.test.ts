import { expect, type Locator, test } from "@playwright/test";

const RAIL_WIDTH = 48;
const EXPANDED_WIDTH = 256;

const width = (nav: Locator) =>
  nav.evaluate((el) => el.getBoundingClientRect().width);

test.describe("SideNav rail", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/side-nav-rail.html");
  });

  test("expands only after the enter delay", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Side navigation" });
    expect(await width(nav)).toBe(RAIL_WIDTH);

    await nav.hover();
    await page.waitForTimeout(150);
    expect(await width(nav)).toBe(RAIL_WIDTH);

    await expect.poll(() => width(nav)).toBe(EXPANDED_WIDTH);
  });

  test("collapses after the leave delay", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Side navigation" });

    await nav.hover();
    await expect.poll(() => width(nav)).toBe(EXPANDED_WIDTH);

    await page.mouse.move(800, 400);
    await page.waitForTimeout(100);
    expect(await width(nav)).toBe(EXPANDED_WIDTH);

    await expect.poll(() => width(nav)).toBe(RAIL_WIDTH);
  });

  test("does not expand when the pointer passes through", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Side navigation" });

    await nav.hover();
    await page.mouse.move(800, 400);
    await page.waitForTimeout(700);
    expect(await width(nav)).toBe(RAIL_WIDTH);
  });

  test("shows the scrollbar only after the enter delay", async ({
    page,
    browserName,
  }) => {
    const items = page.locator(".bx--side-nav__items");
    // Overflow the item list so it can scroll.
    await items.evaluate((el) => {
      const li = el.querySelector("li") as Element;
      for (let i = 0; i < 30; i++) el.appendChild(li.cloneNode(true));
    });
    const scrollbarWidth = () =>
      items.evaluate((el) => getComputedStyle(el).scrollbarWidth);

    await page.locator(".bx--side-nav").hover();
    await page.waitForTimeout(150);
    expect(await scrollbarWidth()).toBe("none");

    // Playwright's Firefox reports `scrollbar-width: none` for every element.
    if (browserName !== "firefox") {
      await expect.poll(scrollbarWidth).toBe("auto");
    }
  });

  test("closes from the menu button or overlay without the leave delay", async ({
    page,
  }) => {
    // Below the expansion breakpoint, the menu button opens the rail.
    await page.setViewportSize({ width: 800, height: 800 });
    const nav = page.locator(".bx--side-nav");

    await page.getByRole("button", { name: "Open menu" }).click();
    await expect.poll(() => width(nav)).toBe(EXPANDED_WIDTH);

    await page.getByRole("button", { name: "Close menu" }).click();
    // Well under the fixture's 500ms leave delay.
    await page.waitForTimeout(250);
    expect(await width(nav)).toBe(RAIL_WIDTH);

    // Same for a click on the overlay.
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect.poll(() => width(nav)).toBe(EXPANDED_WIDTH);
    await page.mouse.click(600, 400);
    await page.waitForTimeout(250);
    expect(await width(nav)).toBe(RAIL_WIDTH);
  });

  test("expands on keyboard focus without a hover", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Side navigation" });

    await page.getByRole("link", { name: "Dashboard" }).focus();
    await expect.poll(() => width(nav)).toBe(EXPANDED_WIDTH);
  });
});

test("expands after the enter delay without JavaScript", async ({
  page,
  browser,
  baseURL,
}) => {
  // Stand-in for server-rendered markup before hydration: the mounted DOM,
  // with its styles, reloaded with JavaScript off.
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/side-nav-rail.html");
  await expect(page.locator(".bx--side-nav")).toBeVisible();
  const html = await page.evaluate(() => {
    for (const script of document.querySelectorAll("script")) script.remove();
    return document.documentElement.outerHTML;
  });

  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    viewport: { width: 1280, height: 800 },
  });
  const staticPage = await context.newPage();
  // Load the page URL first so the production build's relative stylesheet
  // links still resolve; `setContent` keeps the current URL.
  await staticPage.goto("/side-nav-rail.html");
  await staticPage.setContent(html);
  const nav = staticPage.locator(".bx--side-nav");
  expect(await width(nav)).toBe(RAIL_WIDTH);

  await nav.hover();
  await staticPage.waitForTimeout(150);
  expect(await width(nav)).toBe(RAIL_WIDTH);
  await expect.poll(() => width(nav)).toBe(EXPANDED_WIDTH);
  await context.close();
});
