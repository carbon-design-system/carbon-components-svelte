import { expect, type Page, test } from "@playwright/test";
import { createServer } from "vite";

// A Masonry rendered on the server is a plain grid with its items in rows
// until the script packs them, unless the browser packs them itself. These
// tests serve that markup, hold the script back so the first paint is the
// server's, and measure what moves once the script runs. Chromium's
// layout-shift entries do not report the switch from rows to packed
// columns, so the tests compare where the items are.

type Props = { native: boolean; hideUntilPlaced: boolean };

// The tests run one after another: each starts a Vite server to render.
test.describe.configure({ mode: "serial" });

async function serverMarkup(props: Props) {
  const vite = await createServer({
    configFile: "e2e/vite.config.ts",
    server: { middlewareMode: true, hmr: false },
    appType: "custom",
    logLevel: "silent",
  });
  try {
    const { render } = await vite.ssrLoadModule("svelte/server");
    const { default: Fixture } = await vite.ssrLoadModule(
      "/MasonrySsrFixture.svelte",
    );
    return render(Fixture, { props }).body;
  } finally {
    await vite.close();
  }
}

/** The top-left corner of every item. */
function corners(page: Page) {
  return page.evaluate(() =>
    [...(document.querySelector("[data-testid=masonry]")?.children ?? [])].map(
      (el) => {
        const { left, top } = el.getBoundingClientRect();
        return [Math.round(left), Math.round(top)];
      },
    ),
  );
}

const firstItemVisibility = (page: Page) =>
  page
    .locator("[data-testid=masonry] > :first-child")
    .evaluate((el) => getComputedStyle(el).visibility);

/** Open the server's markup, and return a function that lets the script run. */
async function openServerRendered(page: Page, props: Props) {
  const body = await serverMarkup(props);
  // The dev server injects the stylesheet with the script, so take it from
  // a page that has run, and put it in the markup for the first paint.
  await page.goto("/masonry.html");
  const styles = await page.evaluate(() =>
    [...document.querySelectorAll("style, link[rel=stylesheet]")]
      .map((node) => node.outerHTML)
      .join(""),
  );
  expect(body).toContain("bx--masonry");
  expect(body).not.toContain("bx--masonry--placed");

  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  // The dev server serves the entry as masonry-ssr.ts, a build as a hashed
  // asset.
  await page.route(/masonry-ssr[^/]*\.(ts|js)(\?.*)?$/, async (route) => {
    await held;
    await route.continue();
  });
  await page.route("**/masonry-ssr.html*", async (route) => {
    const response = await route.fetch();
    const html = (await response.text())
      .replace("</head>", `${styles}</head>`)
      .replace('<div id="app"></div>', `<div id="app">${body}</div>`);
    await route.fulfill({ response, body: html });
  });
  await page.setViewportSize({ width: 1000, height: 900 });
  await page.goto(
    `/masonry-ssr.html?native=${props.native ? 1 : 0}&hide=${props.hideUntilPlaced ? 1 : 0}`,
    { waitUntil: "commit" },
  );
  await page.waitForSelector("[data-testid=masonry]", { state: "attached" });
  await page.waitForTimeout(300);
  return release;
}

test("script placement keeps the server's columns and moves the items up", async ({
  page,
}) => {
  const release = await openServerRendered(page, {
    native: false,
    hideUntilPlaced: false,
  });

  // The plain grid: row by row, a column per track, in source order.
  const server = await corners(page);
  const columns = new Set(server.map(([left]) => left)).size;
  expect(columns).toBeGreaterThan(2);
  for (let i = 1; i < server.length; i++) {
    const [left, top] = server[i];
    const [prevLeft, prevTop] = server[i - 1];
    expect(top > prevTop || (top === prevTop && left > prevLeft)).toBe(true);
  }

  release();
  await expect(page.locator(".bx--masonry--placed")).toHaveCount(1);
  const packed = await corners(page);
  expect(packed.map(([left]) => left).slice(0, columns)).toEqual(
    server.map(([left]) => left).slice(0, columns),
  );
  expect(packed.reduce((sum, [, top]) => sum + top, 0)).toBeLessThan(
    server.reduce((sum, [, top]) => sum + top, 0),
  );
});

test("hideUntilPlaced keeps the rows out of sight until the items are packed", async ({
  page,
}) => {
  const release = await openServerRendered(page, {
    native: false,
    hideUntilPlaced: true,
  });
  expect(await firstItemVisibility(page)).toBe("hidden");

  release();
  await expect(page.locator(".bx--masonry--placed")).toHaveCount(1);
  expect(await firstItemVisibility(page)).toBe("visible");
});

test("with display: grid-lanes the server markup is already packed", async ({
  page,
}) => {
  const release = await openServerRendered(page, {
    native: true,
    hideUntilPlaced: true,
  });
  const lanes = await page.evaluate(
    () =>
      getComputedStyle(document.querySelector("[data-testid=masonry]")!)
        .display === "grid-lanes",
  );
  test.skip(!lanes, "this browser has no display: grid-lanes");

  const server = await corners(page);
  expect(await firstItemVisibility(page)).toBe("visible");

  release();
  // The script has run once the page answers to it; give it a moment.
  await page.waitForTimeout(500);
  expect(await corners(page)).toEqual(server);
  expect(await page.locator(".bx--masonry--placed").count()).toBe(0);
});
