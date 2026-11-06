import { expect, test } from "./helpers/host";

test("a box portalled into a transformed target sits under its anchor", async ({
  page,
}) => {
  await page.goto("/floating-portal-transformed-target.html");
  const portal = page.locator("[data-floating-portal]");
  await expect(portal).toBeVisible();
  // Placed again once the box has its size.
  await page.evaluate(
    () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );

  const [anchor, box] = await Promise.all(
    [page.getByTestId("anchor"), portal].map((locator) =>
      locator.evaluate((el) => {
        const { left, top, bottom } = el.getBoundingClientRect();
        return { left, top, bottom };
      }),
    ),
  );

  // Below the anchor and level with its left edge.
  expect(box.top).toBeGreaterThanOrEqual(anchor.bottom);
  expect(box.top - anchor.bottom).toBeLessThan(16);
  expect(Math.abs(box.left - anchor.left)).toBeLessThan(2);
});
