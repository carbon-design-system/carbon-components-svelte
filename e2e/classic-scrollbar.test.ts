import { expect, type Page, test } from "@playwright/test";

// Headless Chromium hides scrollbars. Without that flag, a styled
// `::-webkit-scrollbar` takes room from the page as a classic one does,
// while `100vw` still counts it.
test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });

test.skip(
  ({ browserName }) => browserName !== "chromium",
  "`::-webkit-scrollbar` and the flag are Chromium's",
);

const SCROLLBAR = 15;

async function addScrollbar(page: Page, dir: "ltr" | "rtl") {
  await page.addStyleTag({
    content: `html { overflow-y: scroll; }
      ::-webkit-scrollbar { width: ${SCROLLBAR}px; }`,
  });
  await page.evaluate((dir) => {
    document.documentElement.dir = dir;
  }, dir);
  const clientWidth = await page.evaluate(
    () => document.documentElement.clientWidth,
  );
  // Guard against a run where the scrollbar takes no room.
  expect(page.viewportSize()?.width).toBe(clientWidth + SCROLLBAR);
  return clientWidth;
}

/** The part of a box that lies off the page or under the scrollbar. */
function hiddenEdges(
  box: { x: number; width: number } | null,
  clientWidth: number,
) {
  if (!box) throw new Error("no box");
  return {
    start: Math.max(0, -box.x),
    end: Math.max(0, box.x + box.width - clientWidth),
  };
}

for (const dir of ["ltr", "rtl"] as const) {
  test(`keeps ProfileMenu clear of a classic scrollbar (${dir})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/profile-menu.html");
    const clientWidth = await addScrollbar(page, dir);

    const menu = page.locator(".bx--profile-menu").first();
    expect(hiddenEdges(await menu.boundingBox(), clientWidth)).toEqual({
      start: 0,
      end: 0,
    });
  });

  test(`keeps a resizable SideNav and its handle clear of a classic scrollbar (${dir})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 400, height: 720 });
    await page.goto("/side-nav-resize.html");
    const clientWidth = await addScrollbar(page, dir);
    await page.getByRole("button", { name: "Open menu" }).click();
    const handle = page.getByRole("separator", {
      name: "Resize side navigation",
    });
    // Wider than the page: the nav stops at the page's width.
    await handle.focus();
    await page.keyboard.press("End");
    await expect(page.getByTestId("width")).toHaveText("480");

    const nav = page.locator(".bx--side-nav--resizable");
    await expect
      .poll(async () => hiddenEdges(await nav.boundingBox(), clientWidth))
      .toEqual({ start: 0, end: 0 });
    // The handle's line, drawn over the nav's trailing 2 px, is in view.
    const line = await handle.evaluate((node) => {
      const { left, right } = node.getBoundingClientRect();
      return { left, right };
    });
    const inView = dir === "ltr" ? line.left < clientWidth : line.right > 0;
    expect(inView, JSON.stringify(line)).toBe(true);
  });
}
