import { expect, test } from "./helpers/host";

/**
 * EmptyState sizes its illustration by the art's own size, within bounds.
 * A Carbon icon is drawn on a 32-unit grid and renders at 16 to 32px, so it
 * grows to 32px. A pictogram renders at 64px and keeps it, or shrinks to
 * 48px at `sm`. Art with no size of its own fills the bounds. Forcing
 * every svg to 64px drew icons at 4x, with strokes far heavier than the
 * pictograms the slot is meant for.
 */
const cases = [
  { id: "lg-icon", size: 32 },
  { id: "lg-icon-24", size: 32 },
  { id: "lg-pictogram", size: 64 },
  { id: "lg-large", size: 64 },
  { id: "lg-unsized", size: 64 },
  { id: "sm-icon", size: 32 },
  { id: "sm-pictogram", size: 48 },
  { id: "sm-unsized", size: 48 },
];

// Every case only reads layout, so the fixture loads once for all of them.
test("sizes the illustration by the art, within bounds", async ({ page }) => {
  await page.goto("/empty-state.html");

  for (const { id, size } of cases) {
    // biome-ignore lint/performance/noAwaitInLoops: reads one box at a time
    const box = await page
      .getByTestId(id)
      .locator(".bx--empty-state__illustration svg")
      .boundingBox();
    expect.soft(box?.width, `${id} width`).toBe(size);
    expect.soft(box?.height, `${id} height`).toBe(size);
  }
});
