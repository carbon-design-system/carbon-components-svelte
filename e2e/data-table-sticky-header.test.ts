import { expect, test } from "./helpers/host";

test.describe("DataTable sticky header", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/data-table-sticky-header.html");
  });

  test("does not overflow the document horizontally", async ({ page }) => {
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test("aligns header cells with body cells per column", async ({ page }) => {
    const headerCell = page.getByRole("columnheader", { name: "Service" });
    const bodyCell = page.getByRole("cell", {
      name: "payments-api-0",
      exact: true,
    });

    const headerBox = await headerCell.boundingBox();
    const bodyBox = await bodyCell.boundingBox();

    expect(Math.abs((headerBox?.x ?? 0) - (bodyBox?.x ?? 0))).toBeLessThan(1);
  });

  test("keeps the header pinned to the container top while scrolling", async ({
    page,
  }) => {
    const container = page
      .getByTestId("data-table-sticky-root")
      .locator(".bx--data-table_inner-container");
    const headerCell = page.getByRole("columnheader", { name: "Region" });

    const containerTop = (await container.boundingBox())?.y ?? 0;
    const initialHeaderTop = (await headerCell.boundingBox())?.y ?? 0;

    expect(Math.abs(initialHeaderTop - containerTop)).toBeLessThan(2);

    await container.evaluate((el) => {
      el.scrollTop = 300;
    });

    const scrolledHeaderTop = (await headerCell.boundingBox())?.y ?? 0;

    expect(Math.abs(scrolledHeaderTop - containerTop)).toBeLessThan(2);
  });
});

// A browser scrolls a focused control just into the scroll region, which
// leaves it behind the sticky header when it comes in from above.
test("keeps a focused row control below the sticky header", async ({
  page,
}) => {
  await page.goto("/data-table-sticky-focus.html");
  const container = page.locator(".bx--data-table_inner-container");
  await container.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  const controls = await page
    .locator(
      "tbody :is(input.bx--checkbox, .bx--table-expand__button, .bx--overflow-menu)",
    )
    .all();
  expect(controls).toHaveLength(90);

  // Walk up the table, a control at a time, as Shift+Tab does.
  const hidden: unknown[] = [];
  for (const [i, control] of controls.reverse().entries()) {
    // biome-ignore lint/performance/noAwaitInLoops: each focus follows the last
    await control.focus();
    // A checkbox's input is hidden: its label draws the focus ring.
    const { top, header } = await control.evaluate((el) => {
      const ring =
        el instanceof HTMLInputElement && el.labels?.[0] ? el.labels[0] : el;
      const cell = document.querySelector("thead th") as HTMLElement;
      return {
        top: ring.getBoundingClientRect().top,
        header: cell.getBoundingClientRect().bottom,
      };
    });
    if (top < header - 0.5) hidden.push({ control: i, top, header });
  }
  expect(hidden).toEqual([]);
});
