import { expect, test } from "./helpers/host";

test("a summary holds every detail to the right edge, past a wrapping term", async ({
  page,
}) => {
  await page.goto("/description-list.html");
  const list = page.getByTestId("summary");
  const box = await list.boundingBox();
  const rights = await list
    .locator("dd")
    .evaluateAll((nodes) =>
      nodes.map((node) => Math.round(node.getBoundingClientRect().right)),
    );

  expect(new Set(rights).size).toBe(1);
  expect(rights[0]).toBe(Math.round((box?.x ?? 0) + (box?.width ?? 0)));

  const long = list.locator("dt").nth(1);
  const lineHeight = await long.evaluate((node) =>
    Number.parseFloat(getComputedStyle(node).lineHeight),
  );
  expect((await long.boundingBox())?.height).toBeGreaterThan(lineHeight);
});
