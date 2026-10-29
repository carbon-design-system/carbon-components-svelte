import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// A pointer moving diagonally from an item to its open submenu crosses the
// items below it. Each crossing used to start the submenu's close, or a
// sibling's own open, so a slow move lost the submenu it aimed for.

type Point = { x: number; y: number };

/** Move the pointer in a straight line at `speed` px/s, one step a frame. */
async function glide(page: Page, from: Point, to: Point, speed: number) {
  const frame = 1000 / 60;
  const duration = (Math.hypot(to.x - from.x, to.y - from.y) / speed) * 1000;
  const steps = Math.max(1, Math.round(duration / frame));
  const start = performance.now();
  for (let i = 1; i <= steps; i++) {
    // biome-ignore lint/performance/noAwaitInLoops: one pointer step a frame
    await page.mouse.move(
      from.x + ((to.x - from.x) * i) / steps,
      from.y + ((to.y - from.y) * i) / steps,
    );
    const wait = start + i * frame - performance.now();
    if (wait > 0) await page.waitForTimeout(wait);
  }
}

/** Record every item whose `aria-expanded` changes from here on. */
async function watchExpanded(page: Page) {
  await page.evaluate(() => {
    const changes: string[] = [];
    (window as unknown as { __changes: string[] }).__changes = changes;
    new MutationObserver((records) => {
      for (const { target } of records) {
        const item = target as Element;
        changes.push(
          `${item.getAttribute("aria-expanded")} ${item.querySelector(".bx--menu-option__label")?.textContent?.trim()}`,
        );
      }
    }).observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-expanded"],
    });
  });
}

function expandedChanges(page: Page) {
  return page.evaluate(
    () => (window as unknown as { __changes: string[] }).__changes,
  );
}

/** Hover "Share" until its submenu opens; return where to start and aim. */
async function openShare(page: Page) {
  const share = page.getByRole("menuitem", { name: "Share" });
  const box = await share.boundingBox();
  if (!box) throw new Error("no Share item");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(share).toHaveAttribute("aria-expanded", "true");
  const first = await page
    .getByRole("menuitem", { name: "Leaf 1", exact: true })
    .boundingBox();
  const target = page.getByRole("menuitem", { name: "Leaf 4", exact: true });
  const leaf = await target.boundingBox();
  if (!first || !leaf) throw new Error("no submenu");
  const onRight = first.x > box.x;
  return {
    share,
    target,
    // Start 40px into the side away from the submenu. That is the label
    // when the submenu opens toward the inline end.
    from: {
      x: onRight ? box.x + 40 : box.x + box.width - 40,
      y: box.y + box.height / 2,
    },
    // Aim 30px into Leaf 4, three rows down.
    to: {
      x: onRight ? leaf.x + 30 : leaf.x + leaf.width - 30,
      y: leaf.y + leaf.height / 2,
    },
  };
}

for (const kind of ["menu", "context"]) {
  for (const [layout, query] of [
    ["opening right", ""],
    ["flipped left at the window edge", "&edge"],
    ["right to left", "&rtl"],
  ]) {
    test(`${kind}: a diagonal move keeps the submenu open, ${layout}`, async ({
      page,
    }) => {
      await page.goto(`/submenu-aim.html?kind=${kind}&siblings=sub${query}`);
      const { share, target, from, to } = await openShare(page);
      await page.mouse.move(from.x, from.y);
      await watchExpanded(page);

      // 300 px/s is a slow, deliberate move across three sibling items.
      await glide(page, from, to, 300);
      await page.waitForTimeout(400);

      expect(await expandedChanges(page)).toEqual([]);
      await expect(share).toHaveAttribute("aria-expanded", "true");
      await target.click();
      await expect(page.getByTestId("clicked")).toHaveText("Leaf 4");
    });
  }

  test(`${kind}: moving straight down still switches to a sibling's submenu`, async ({
    page,
  }) => {
    await page.goto(`/submenu-aim.html?kind=${kind}&siblings=sub`);
    const { share, from } = await openShare(page);
    const sibling = page.getByRole("menuitem", {
      name: "Sibling 2",
      exact: true,
    });
    const box = await sibling.boundingBox();
    if (!box) throw new Error("no sibling");

    await glide(page, from, { x: from.x, y: box.y + box.height / 2 }, 300);

    await expect(sibling).toHaveAttribute("aria-expanded", "true");
    await expect(share).toHaveAttribute("aria-expanded", "false");
  });
}
