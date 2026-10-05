import { expect, type Page, test } from "@playwright/test";

/**
 * Scroll `testId` down in small steps, letting the window settle after each,
 * and return the position read before every step. Rows whose heights disagree
 * with the offsets let the browser's scroll anchoring stall or reverse this.
 */
function stepScroll(page: Page, testId: string, steps: number) {
  return page.getByTestId(testId).evaluate(async (el, steps) => {
    el.scrollTop = 500;
    const positions: number[] = [];
    for (let step = 0; step < steps; step++) {
      // Long enough for the scroll handler, measured heights, and any
      // anchoring adjustment to land.
      // biome-ignore lint/performance/noAwaitInLoops: each step must settle before the next
      await new Promise((resolve) => setTimeout(resolve, 80));
      positions.push(Math.round(el.scrollTop));
      el.scrollTop += 20;
    }
    return positions;
  }, steps);
}

/**
 * Scroll to the end until the last item renders there, then read it. Each
 * attempt re-scrolls, since measured heights can grow the list under it.
 */
async function scrollToEnd(page: Page, testId: string, setsize: number) {
  const scroller = page.getByTestId(testId);
  await expect
    .poll(() =>
      scroller.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
        const rows = el.querySelectorAll("li[aria-posinset]");
        return rows[rows.length - 1]?.getAttribute("aria-posinset");
      }),
    )
    .toBe(String(setsize));

  return scroller.evaluate((el) => {
    const rows = el.querySelectorAll("li[aria-posinset]");
    const last = rows[rows.length - 1];
    const box = last.getBoundingClientRect();
    const view = el.getBoundingClientRect();
    return {
      isLastChild: last === last.parentElement?.lastElementChild,
      inView: box.top >= view.top && box.bottom <= view.bottom + 1,
      separator: getComputedStyle(last, "::before").content,
    };
  });
}

function expectSteadyForward(positions: number[]) {
  for (let i = 1; i < positions.length; i++) {
    expect(positions[i] - positions[i - 1]).toBe(20);
  }
}

test.describe("VirtualList spacerTag", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/virtual-list-spacer.html");
    await expect(
      page.getByTestId("unordered-scroller").locator("li[aria-posinset]"),
    ).not.toHaveCount(0);
  });

  test("renders only list items into the parent lists", async ({ page }) => {
    const tags = await page
      .locator("ul")
      .evaluateAll((lists) =>
        lists.flatMap((list) => Array.from(list.children, (el) => el.tagName)),
      );
    expect(new Set(tags)).toEqual(new Set(["LI"]));
  });

  test.describe("in a narrow viewport where rows wrap", () => {
    test.use({ viewport: { width: 240, height: 800 } });

    test("UnorderedList scrolls steadily and reaches the last row", async ({
      page,
    }) => {
      expectSteadyForward(await stepScroll(page, "unordered-scroller", 30));

      const last = await scrollToEnd(page, "unordered-scroller", 3000);
      expect(last).toMatchObject({
        isLastChild: true,
        inView: true,
      });
    });

    test("ContainedList scrolls steadily and reaches the last row", async ({
      page,
    }) => {
      expectSteadyForward(await stepScroll(page, "contained-scroller", 30));

      const last = await scrollToEnd(page, "contained-scroller", 5000);
      expect(last).toMatchObject({
        isLastChild: true,
        inView: true,
      });
    });
  });

  test("ContainedList advances rows by their overlapped height", async ({
    page,
  }) => {
    const scroller = page.getByTestId("contained-scroller");
    const scrollHeight = () => scroller.evaluate((el) => el.scrollHeight);

    // 5000 rows advancing 47px (48px tall, overlapping by 1px) below a 48px
    // header. The height holds as the window moves.
    const expected = 5000 * 47 + 48;
    await expect.poll(scrollHeight).toBe(expected);
    await scroller.evaluate((el) => {
      el.scrollTop = 120_000;
    });
    await expect.poll(scrollHeight).toBe(expected);

    expectSteadyForward(await stepScroll(page, "contained-scroller", 10));

    // The true last row keeps Carbon's styling: no separator below it.
    const last = await scrollToEnd(page, "contained-scroller", 5000);
    expect(last.separator).toBe("none");
    await expect.poll(scrollHeight).toBe(expected);
  });
});
