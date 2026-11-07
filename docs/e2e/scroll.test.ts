import { expect, type Page, test } from "@playwright/test";

// Lazy content must never move the page: Safari doesn't anchor the scroll.

test.beforeEach(async ({ page }) => {
  // IBM's CDN (fonts, footer, analytics) and the framed examples' iframes
  // only add noise to these checks.
  await page.route("**/*s81c.com/**", (route) => route.abort());
  await page.route("**/framed/**", (route) => route.abort());
});

const top = (page: Page, selector: string) =>
  page.$eval(selector, (el) => Math.round(el.getBoundingClientRect().top));

/** Follows a link to `hash` on this page, as a reader's click does. */
const clickHashLink = (page: Page, hash: string) =>
  page.evaluate((href) => {
    const link = document.createElement("a");
    link.href = href;
    document.body.append(link);
    link.click();
    link.remove();
  }, hash);

const firstVisibleHeading = (page: Page) =>
  page.evaluate(
    () =>
      [...document.querySelectorAll("h2[id]")].find(
        (heading) => heading.getBoundingClientRect().top >= 0,
      )?.id ?? "",
  );

async function expectLandsAndStays(page: Page, selector: string) {
  await page.waitForTimeout(400);
  const landed = await top(page, selector);
  const atEnd = await page.evaluate(
    () =>
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 1,
  );
  if (!atEnd) {
    expect(Math.abs(landed), `${selector} lands near the top`).toBeLessThan(
      120,
    );
  }
  await page.waitForTimeout(1200);
  expect(
    Math.abs((await top(page, selector)) - landed),
    `${selector} stays`,
  ).toBeLessThanOrEqual(2);
}

const toggleLink = (page: Page) =>
  page
    .locator(".bx--side-nav")
    .getByRole("link", { name: "Toggle", exact: true });

test("a plain visit mounts nearby examples first, the rest once idle, without moving the page", async ({
  page,
}) => {
  await page.goto("/components/DataTable");
  // Counted in the first frame the page has rendered in, before idle
  // mounting starts on the rest.
  const atFirstRender = await (
    await page.waitForFunction(
      () =>
        document.querySelector("h2#sorting") && {
          waiting: document.querySelectorAll(".preview-viewer [aria-busy=true]")
            .length,
          total: document.querySelectorAll(".preview-viewer:not(.framed)")
            .length,
        },
      null,
      { polling: "raf" },
    )
  ).jsonValue();
  if (!atFirstRender) throw new Error("The page never rendered");
  expect(atFirstRender.waiting).toBeGreaterThan(atFirstRender.total / 2);
  const waiting = page.locator(".preview-viewer [aria-busy=true]");

  const scrollY = await page.evaluate(() => window.scrollY);
  const headingTop = await top(page, "h2#sorting");
  await expect(waiting).toHaveCount(0, { timeout: 15_000 });
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
  expect(await top(page, "h2#sorting")).toBeGreaterThanOrEqual(headingTop);
});

test("a deep link lands on its heading and stays", async ({ page }) => {
  await page.goto("/components/DataTable#sorting");
  await page.waitForSelector("h2#sorting");
  await expectLandsAndStays(page, "h2#sorting");
});

for (const id of [
  "component-api-props",
  "component-api-slots",
  "component-api-dispatched-events",
]) {
  test(`a deep link into the API section, #${id}, lands and stays`, async ({
    page,
  }) => {
    await page.goto(`/components/DataTable#${id}`);
    await page.waitForSelector(`h2#${id}`);
    await expectLandsAndStays(page, `h2#${id}`);
  });
}

test("an in-page link lands on its heading and stays", async ({ page }) => {
  await page.goto("/components/DataTable");
  await page.waitForSelector("h2#sorting");
  await clickHashLink(page, "#highlighted-row");
  await expectLandsAndStays(page, "h2#highlighted-row");
});

test("an in-page link to the API section lands and stays, before it has mounted", async ({
  page,
}) => {
  await page.goto("/components/DataTable");
  await page.waitForSelector("h2#sorting");
  await clickHashLink(page, "#component-api-props");
  await page.waitForSelector("h2#component-api-props");
  await expectLandsAndStays(page, "h2#component-api-props");
});

test("the table of contents follows into the API section", async ({ page }) => {
  await page.goto("/components/DataTable");
  await page.waitForSelector("h2#component-api-slots", { state: "attached" });
  await page.evaluate(() =>
    document.getElementById("component-api-slots")?.scrollIntoView(),
  );
  await expect(page.locator(".toc-nav a.is-active").first()).toHaveAttribute(
    "href",
    "#component-api-slots",
  );
});

test("scrolling down through the API tables doesn't move the page", async ({
  page,
}) => {
  await page.goto("/components/DataTable");
  await page.waitForSelector("h2#component-api-props", { state: "attached" });
  const propsY = await page.evaluate(
    () =>
      (document.getElementById("component-api-props")?.getBoundingClientRect()
        .top ?? 0) + window.scrollY,
  );
  for (let y = propsY - 600; y < propsY + 4000; y += 400) {
    await page.evaluate((scrollTo) => window.scrollTo(0, scrollTo), y);
    await page.waitForTimeout(80);
    const before = await page.evaluate(() => {
      const el = document.elementFromPoint(400, 300);
      (window as { __ref?: Element | null }).__ref = el;
      return el?.getBoundingClientRect().top ?? 0;
    });
    await page.waitForTimeout(150);
    const after = await page.evaluate(
      () =>
        (window as { __ref?: Element | null }).__ref?.getBoundingClientRect()
          .top ?? 0,
    );
    expect(Math.abs(after - before), `at scrollY ${y}`).toBeLessThanOrEqual(1);
  }
});

test("back returns to the same place", async ({ page }) => {
  await page.goto("/components/DataTable");
  await page.waitForSelector("h2#sorting");
  for (let y = 0; y <= 6000; y += 600) {
    await page.evaluate((scrollTo) => window.scrollTo(0, scrollTo), y);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(500);
  const marker = await firstVisibleHeading(page);
  const markerTop = await top(page, `h2#${marker}`);

  await toggleLink(page).click();
  await page.waitForSelector('[data-component="Toggle"] h2');
  await page.goBack();
  await page.waitForSelector(`h2#${marker}`);
  await page.waitForTimeout(1200);
  expect(
    Math.abs((await top(page, `h2#${marker}`)) - markerTop),
  ).toBeLessThanOrEqual(2);
});

test("forward after back returns to the same place", async ({ page }) => {
  await page.goto("/components/DataTable");
  await page.waitForSelector("h2#sorting");
  await toggleLink(page).click();
  await page.waitForSelector('[data-component="Toggle"] h2');
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(300);
  const marker = await firstVisibleHeading(page);
  const markerTop = await top(page, `h2#${marker}`);

  await page.goBack();
  await page.waitForSelector("h2#sorting");
  await page.waitForTimeout(600);
  await page.goForward();
  await page.waitForSelector('[data-component="Toggle"] h2');
  await page.waitForTimeout(800);
  expect(
    Math.abs((await top(page, `h2#${marker}`)) - markerTop),
  ).toBeLessThanOrEqual(2);
});

test("back after an in-page link returns to where the link was clicked", async ({
  page,
}) => {
  await page.goto("/components/DataTable");
  await page.waitForSelector("h2#sorting");
  await page.evaluate(() => window.scrollTo(0, 1500));
  await page.waitForTimeout(300);
  const marker = await firstVisibleHeading(page);
  const markerTop = await top(page, `h2#${marker}`);

  await clickHashLink(page, "#highlighted-row");
  await page.waitForTimeout(500);
  await page.goBack();
  await page.waitForTimeout(800);
  expect(
    Math.abs((await top(page, `h2#${marker}`)) - markerTop),
  ).toBeLessThanOrEqual(2);
});
