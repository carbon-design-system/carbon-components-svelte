import AxeBuilder from "@axe-core/playwright";
import type { Download, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const root = (page: Page) => page.locator(".bx--audit-log");
const grid = (page: Page) =>
  page.getByRole("grid", { name: "Events, newest first" });
const scroller = (page: Page) => page.locator(".bx--audit-log__grid");
const rows = (page: Page) =>
  scroller(page).locator('[role="row"]:not(.bx--audit-log__row--head)');
const search = (page: Page) =>
  page.getByRole("combobox", { name: "Search events" });
const count = (page: Page) => page.locator(".bx--audit-log__count");

/** A download's text, read from its stream so the test touches no file of the repository. */
async function readDownload(download: Download) {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

async function open(page: Page, query = "") {
  await page.goto(`/audit-log.html?${query}`);
  await expect(rows(page).first()).toBeVisible();
  await expect(grid(page)).not.toHaveAttribute("aria-busy", "true");
}

/** Wait until a query has settled: the grid is no longer busy and the count changed. */
async function settled(page: Page, before: string) {
  await expect(count(page)).not.toHaveText(before);
  await expect(grid(page)).not.toHaveAttribute("aria-busy", "true");
}

test.describe("AuditLogExplorer", () => {
  test("a facet and the query bar edit one model, and the URL carries it", async ({
    page,
  }) => {
    await open(page);
    const before = (await count(page).textContent()) ?? "";

    await page.getByRole("checkbox", { name: /Denied/ }).check({ force: true });
    await settled(page, before);
    await expect(search(page)).toHaveValue("outcome:denied");
    await expect(page).toHaveURL(/q=outcome%3Adenied/);
    for (const outcome of await rows(page).evaluateAll((els) =>
      els.map((el) => el.getAttribute("data-outcome")),
    )) {
      expect(outcome).toBe("denied");
    }

    // A typed qualifier checks its facet, and free text stays where it was typed.
    const denied = (await count(page).textContent()) ?? "";
    await search(page).fill("outcome:denied svc-ci");
    await search(page).press("Enter");
    await settled(page, denied);
    await page
      .getByRole("checkbox", { name: /Failure/ })
      .check({ force: true });
    await expect(search(page)).toHaveValue("outcome:denied,failure svc-ci");

    // The link is the whole state: a reload shows the same screen.
    const text = await search(page).inputValue();
    await open(page, new URL(page.url()).search.slice(1));
    await expect(rows(page).first()).toBeVisible();
    await expect(search(page)).toHaveValue(text);
    await expect(page.getByRole("checkbox", { name: /Denied/ })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: /Failure/ })).toBeChecked();

    // Back goes to the query before the facet click.
    await page.goBack();
    await expect(search(page)).toHaveValue("outcome:denied svc-ci");
    await expect(
      page.getByRole("checkbox", { name: /Failure/ }),
    ).not.toBeChecked();
  });

  test("a time range preset and a custom window reach the URL", async ({
    page,
  }) => {
    await open(page);
    await page.getByRole("combobox", { name: "Time range" }).click();
    const before = (await count(page).textContent()) ?? "";
    await page.getByRole("option", { name: "Last hour" }).click();
    await expect(page).toHaveURL(/range=1h/);
    await settled(page, before);
    const hour = Number((await count(page).textContent())?.replace(/\D/g, ""));
    expect(hour).toBeGreaterThan(500);
    expect(hour).toBeLessThan(2000);

    await page.goto(
      "/audit-log.html?from=2026-01-01T00%3A00&to=2026-01-01T01%3A00",
    );
    await expect(page.locator(".bx--audit-log__custom")).toBeVisible();
    await expect(page.getByText("No events match")).toBeVisible();
  });

  test("keyboard only: query, facets, list, details and back", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName === "webkit",
      "Safari does not tab to buttons and checkboxes by default",
    );
    await open(page);
    await search(page).focus();

    // Tab reaches the facets before the list.
    const order: string[] = [];
    for (let i = 0; i < 60; i++) {
      // biome-ignore lint/performance/noAwaitInLoops: one Tab at a time
      await page.keyboard.press("Tab");
      const where = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        if (el.closest("[role=grid]")) return "grid";
        if (el.closest(".bx--audit-log__facets")) return "facets";
        if (el.closest(".bx--audit-log__query")) return "query";
        return "other";
      });
      if (order.at(-1) !== where) order.push(where);
      if (where === "grid") break;
    }
    expect(order).toEqual(["query", "facets", "grid"]);

    // Arrows move through the rows without moving focus off the grid.
    await expect(grid(page)).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    const active = await grid(page).getAttribute("aria-activedescendant");
    expect(active).toBeTruthy();
    await expect(page.locator(`[id="${active}"]`)).toHaveAttribute(
      "aria-rowindex",
      "4",
    );

    // Enter opens the details and focus goes into the panel.
    const id = (active ?? "").replace(/^.*-(evt_\w+)$/, "$1");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Event details")).toBeVisible();
    await expect(
      page.locator(".bx--side-panel").getByText(id).first(),
    ).toBeVisible();
    await expect(page.locator(".bx--side-panel :focus")).toHaveCount(1);

    // Escape closes it and puts focus back on the grid, on the same row.
    await page.keyboard.press("Escape");
    await expect(grid(page)).toBeFocused();
    await expect(grid(page)).toHaveAttribute(
      "aria-activedescendant",
      active ?? "",
    );
  });

  test("the details panel shows the payload as a tree, and arrows browse while it is open", async ({
    page,
  }) => {
    await open(page);
    await rows(page).nth(1).click();
    const panel = page.locator(".bx--side-panel");
    await expect(panel.getByRole("tree", { name: "Payload" })).toBeVisible();
    await expect(
      panel.getByRole("treeitem", { name: /requestId/ }),
    ).toBeVisible();
    const first = await panel.getByText(/^evt_/).first().textContent();

    await grid(page).focus();
    await page.keyboard.press("ArrowDown");
    await expect(panel.getByText(/^evt_/).first()).not.toHaveText(first ?? "");
    await expect(rows(page).nth(2)).toHaveAttribute("aria-selected", "true");
  });

  test("1M events: load more by scrolling, and the DOM stays small", async ({
    page,
  }) => {
    await open(page);
    await expect(root(page)).toHaveAttribute("data-loaded", "100");
    for (let i = 1; i <= 5; i++) {
      // biome-ignore lint/performance/noAwaitInLoops: each page loads after the scroll
      await scroller(page).evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      await expect(root(page)).toHaveAttribute(
        "data-loaded",
        String(100 * (i + 1)),
      );
    }
    expect(await rows(page).count()).toBeLessThan(80);
    // The last rows are real: the page asked the source for the next cursor.
    const last = await rows(page).last().getAttribute("aria-rowindex");
    expect(Number(last)).toBeGreaterThan(500);
  });

  test("1M events: a filter answers within the budget", async ({ page }) => {
    await open(page);
    const before = (await count(page).textContent()) ?? "";
    const started = Date.now();
    await page
      .getByRole("checkbox", { name: /Failure/ })
      .check({ force: true });
    await settled(page, before);
    // A source scanning a million events, plus the render, in a dev server.
    expect(Date.now() - started).toBeLessThan(1500);
    expect(Number(await root(page).getAttribute("data-query-ms"))).toBeLessThan(
      1000,
    );
  });

  test("live tail at 20 events a second: prepends at the top, pauses on scroll, counts what it holds", async ({
    page,
  }) => {
    await open(page, "range=15m");
    await page.evaluate(() => {
      const w = window as unknown as { __frames: number[] };
      w.__frames = [];
      let last = performance.now();
      const tick = (t: number) => {
        w.__frames.push(t - last);
        last = t;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const first = () => rows(page).first().getAttribute("id");
    const id0 = await first();
    await page.getByText("Live tail").click();
    await expect(page).toHaveURL(/live=1/);
    await expect.poll(first).not.toBe(id0);

    // Scroll away: nothing moves, and a pill counts what arrives.
    await scroller(page).evaluate((el) => {
      el.scrollTop = 800;
    });
    const loaded = Number(await root(page).getAttribute("data-loaded"));
    const pill = page.locator(".bx--audit-log__new button");
    await expect(pill).toBeVisible();
    await expect
      .poll(async () => Number((await pill.textContent())?.match(/\d+/)?.[0]))
      .toBeGreaterThan(25);
    expect(
      Number(await root(page).getAttribute("data-loaded")),
    ).toBeLessThanOrEqual(loaded + 1);

    // The pill takes the rows in and goes to the top.
    await pill.click();
    await expect
      .poll(() => scroller(page).evaluate((el) => el.scrollTop))
      .toBe(0);
    await expect(pill).toHaveCount(0);

    // 20 events a second for a few seconds did not cost a frame budget.
    await page.waitForTimeout(3000);
    const frames = await page.evaluate(() =>
      (window as unknown as { __frames: number[] }).__frames.slice(5),
    );
    const over = frames.filter((ms) => ms > 100).length;
    expect(over).toBe(0);
    expect(await rows(page).count()).toBeLessThan(80);
  });

  test("export writes the current query as CSV and JSON", async ({ page }) => {
    await open(page, "q=outcome%3Adenied&range=1h");
    await expect(count(page)).toHaveText(/events$/);
    await page.getByRole("button", { name: "Export" }).click();
    const [csv] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("menuitem", { name: "CSV" }).click(),
    ]);
    expect(csv.suggestedFilename()).toMatch(
      /^audit-events-\d{4}-\d{2}-\d{2}\.csv$/,
    );
    const body = (await readDownload(csv)).split("\r\n");
    expect(body[0]).toBe("id,time,actor,action,target,outcome,ip,payload");
    expect(body.length).toBeGreaterThan(10);
    expect(body.slice(1, 6).every((line) => line.includes(",denied,"))).toBe(
      true,
    );

    await page.getByRole("button", { name: "Export" }).click();
    const [json] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("menuitem", { name: "JSON" }).click(),
    ]);
    const parsed = JSON.parse(await readDownload(json));
    expect(parsed.length).toBe(body.length - 2);
    expect(parsed[0].outcome).toBe("denied");
  });

  test("announces a result count once, after the query settles", async ({
    page,
  }) => {
    await open(page);
    const status = page.locator(".bx--audit-log > p[role=status]").first();
    await expect(status).toHaveText("");
    const before = (await count(page).textContent()) ?? "";
    await page
      .getByRole("checkbox", { name: /Failure/ })
      .check({ force: true });
    await page.getByRole("checkbox", { name: /Denied/ }).check({ force: true });
    await settled(page, before);
    await expect(status).toHaveText(/^[\d,]+ events$/);
    const said = await status.textContent();
    expect(said).toBe(`${(await count(page).textContent())?.trim()}`);
  });

  for (const [name, setup] of [
    ["White", async () => {}],
    [
      "Gray 100",
      async (page: Page) =>
        page.evaluate(() => document.documentElement.classList.add("bx--g100")),
    ],
    [
      "RTL",
      async (page: Page) =>
        page.evaluate(() =>
          document.documentElement.setAttribute("dir", "rtl"),
        ),
    ],
  ] as const) {
    test(`axe is clean: ${name}, with the details open`, async ({ page }) => {
      await open(page);
      await setup(page);
      await rows(page).nth(1).click();
      await expect(
        page.locator(".bx--side-panel").getByRole("tree"),
      ).toBeVisible();
      await page.waitForFunction(() => document.getAnimations().length === 0);
      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations.map((v) => `${v.id}: ${v.nodes.length}`),
      ).toEqual([]);
    });
  }

  test("RTL puts the facets at the inline start and docks the panel at the left", async ({
    page,
  }) => {
    await open(page);
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    await rows(page).nth(1).click();
    await page.waitForFunction(() => document.getAnimations().length === 0);
    const facets = await page.locator(".bx--audit-log__facets").boundingBox();
    const table = await page.locator(".bx--audit-log__table").boundingBox();
    const panel = await page.locator(".bx--side-panel").boundingBox();
    expect(facets && table && facets.x > table.x).toBe(true);
    expect(panel?.x).toBeLessThan(50);
  });

  test("forced colors: the selected row and the focused row stay visible", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "Safari has no forced colors mode");
    await page.emulateMedia({ forcedColors: "active" });
    await open(page);
    await rows(page).nth(1).click();
    await grid(page).focus();
    await expect(rows(page).nth(1)).toHaveAttribute("aria-selected", "true");
    const edge = await rows(page)
      .nth(1)
      .evaluate((el) => getComputedStyle(el).borderInlineStartColor);
    expect(edge).not.toBe("rgba(0, 0, 0, 0)");
    const outline = await rows(page)
      .nth(1)
      .evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe("none");
  });
});
