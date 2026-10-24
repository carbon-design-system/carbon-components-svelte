import { expect, type Page, test } from "@playwright/test";

// An open Popover stays in view: it takes the other side or edge when it
// would run past the window, and moves to a portal when a box around it
// would cut it off. One that fits stays as it is.
async function open(page: Page, id: string, name: string) {
  const host = page.getByTestId(id);
  await host.scrollIntoViewIfNeeded();
  await host.getByRole("button", { name }).click();
  const popover = page
    .locator(".bx--popover--open .bx--popover-contents")
    .last();
  await expect(popover).toBeVisible();
  await page.evaluate(
    () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
  return popover.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const corners = [
      [r.left + 4, r.top + 4],
      [r.right - 4, r.top + 4],
      [r.left + 4, r.bottom - 4],
      [r.right - 4, r.bottom - 4],
    ];
    return {
      inWindow:
        r.left >= 0 &&
        r.top >= 0 &&
        r.right <= document.documentElement.clientWidth &&
        r.bottom <= document.documentElement.clientHeight,
      covered: corners.filter(
        ([x, y]) => !el.contains(document.elementFromPoint(x, y)),
      ).length,
      align: [...(el.parentElement?.classList ?? [])]
        .filter((c) => /^bx--popover--(top|bottom|left|right)/.test(c))
        .join(" "),
    };
  });
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 600 });
  await page.goto("/popover-fit.html");
});

test("at the window's right edge, it aligns to its anchor's right edge", async ({
  page,
}) => {
  const p = await open(page, "edge", "Edge");
  expect(p.inWindow).toBe(true);
  expect(p.align).toContain("bottom-right");
});

test("at the bottom of the window, it opens above", async ({ page }) => {
  const p = await open(page, "bottom", "Bottom");
  expect(p.inWindow).toBe(true);
  expect(p.align).toContain("top-left");
});

for (const [id, name] of [
  ["scroll", "Panel"],
  ["card", "Card"],
] as const)
  test(`in a ${id === "scroll" ? "scrolling panel" : "clipping card"}, it shows whole`, async ({
    page,
  }) => {
    const p = await open(page, id, name);
    expect(p.covered).toBe(0);
    const scroll = await page
      .getByTestId(`${id}-box`)
      .evaluate((el) => el.scrollHeight - el.clientHeight);
    expect(scroll).toBeLessThanOrEqual(1);
  });

test("one that fits keeps its align, in place", async ({ page }) => {
  const p = await open(page, "plain", "Plain");
  expect(p.align).toBe("bx--popover--bottom-left");
  await expect(
    page.getByTestId("plain").locator(".bx--popover--open"),
  ).toHaveCount(1);
});
