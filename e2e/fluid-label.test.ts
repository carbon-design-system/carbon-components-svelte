import { expect, test } from "./helpers/host";

/**
 * A fluid label too long for its field truncates with an ellipsis. It used
 * to scroll sideways under a hidden scrollbar, which made it a scroll
 * container: browsers put one with nothing focusable inside in the tab
 * order, so each cut-off label was a stop of its own.
 */
const TRUNCATING = [
  "text-input",
  "text-area",
  "select",
  "number-input",
  "combo-box",
  "multi-select",
  "date-picker",
  "time-picker",
  "search",
  "pin-code-input",
  "hidden-label",
];

const LABEL = "Billing contact for overdue invoices";

test.beforeEach(async ({ page }) => {
  await page.goto("/fluid-label.html");
  await expect(page.getByTestId("start")).toBeVisible();
});

for (const id of TRUNCATING) {
  test(`a long fluid label ends in an ellipsis (${id})`, async ({ page }) => {
    const style = await page
      .getByTestId(id)
      .locator(".bx--label")
      .evaluate((el) => {
        const s = getComputedStyle(el);
        const field = (el.parentElement ?? el).getBoundingClientRect();
        return {
          overflowX: s.overflowX,
          textOverflow: s.textOverflow,
          // An ellipsis renders in a block container, not a flex one.
          display: s.display,
          // Inside the field's 16px inline padding.
          inside: el.getBoundingClientRect().right <= field.right - 15,
          cut: el.scrollWidth > el.clientWidth,
        };
      });
    expect(style.overflowX).toBe("hidden");
    expect(style.display).toBe("block");
    expect(style.cut).toBe(true);
    expect(style.textOverflow).toBe("ellipsis");
    expect(style.inside).toBe(true);
  });
}

test("a cut-off fluid label shows its full text on hover", async ({ page }) => {
  // The hidden label has no box to hover.
  for (const id of TRUNCATING.filter((id) => id !== "hidden-label")) {
    const label = page.getByTestId(id).locator(".bx--label").first();
    // biome-ignore lint/performance/noAwaitInLoops: one hover at a time
    await label.hover();
    await expect.soft(label, id).toHaveAttribute("title", LABEL);
  }

  // A label that fits gets none.
  const wide = page.getByTestId("wide").locator(".bx--label");
  await expect(wide).toHaveCount(10);
  for (const label of await wide.all()) {
    // biome-ignore lint/performance/noAwaitInLoops: one hover at a time
    const cut = await label.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(cut).toBe(false);
    await label.hover();
    expect.soft(await label.getAttribute("title")).toBeNull();
  }

  // A slotted label scrolls to keep its control in reach, and gets none.
  const slotted = page.getByTestId("slotted-label").locator(".bx--label");
  await slotted.hover();
  expect(await slotted.getAttribute("title")).toBeNull();
});

test("a fluid label with a slotted control stays inside the field", async ({
  page,
}) => {
  const field = page.getByTestId("slotted-label");
  const label = field.locator(".bx--label");
  // The edge of the label's text, inside the padding that leaves room for
  // a focus ring.
  const box = () =>
    label.evaluate((el) => {
      const field = el
        .closest("[data-testid]")
        ?.querySelector(".bx--text-input");
      if (!field) throw new Error("field not rendered");
      return {
        fieldRight: field.getBoundingClientRect().right,
        labelRight:
          el.getBoundingClientRect().right -
          Number.parseFloat(getComputedStyle(el).paddingRight),
      };
    });
  const before = await box();
  // Inside the field's 16px inline padding, not spilling past its edge.
  expect(before.labelRight).toBeLessThanOrEqual(before.fieldRight - 15);

  // The trailing control is reachable: focusing it scrolls it into view.
  const button = label.getByRole("button", { name: "About billing contacts" });
  await button.focus();
  const [b, l] = await Promise.all([button.boundingBox(), label.boundingBox()]);
  if (!b || !l) throw new Error("button or label not rendered");
  expect(b.x).toBeGreaterThanOrEqual(l.x - 0.5);
  expect(b.x + b.width).toBeLessThanOrEqual(l.x + l.width + 0.5);
});

test("fluid labels are not tab stops", async ({ page, browserName }) => {
  // The controls a keyboard user should reach, in order.
  const controls = await page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLElement>(
        "input, textarea, select, button",
      ),
    ]
      .filter(
        (el) =>
          el.tabIndex >= 0 &&
          !(el as HTMLInputElement).disabled &&
          (el as HTMLInputElement).type !== "hidden" &&
          getComputedStyle(el).visibility === "visible" &&
          el.getClientRects().length > 0,
      )
      // WebKit's default tab order skips a button without a tabindex.
      .map((el) => ({
        tag: el.tagName,
        skippedByWebKit:
          el.tagName === "BUTTON" && !el.hasAttribute("tabindex"),
        inSlottedLabel: !!el.closest(".bx--label--slotted"),
      })),
  );
  expect(controls.length).toBeGreaterThan(8);
  // Firefox also stops on a label that scrolls, even one holding a
  // control: the slotted label scrolls so its toggletip stays reachable,
  // a stop this test records.
  const expected = controls.flatMap(
    ({ tag, skippedByWebKit, inSlottedLabel }, i) => {
      if (browserName === "webkit" && skippedByWebKit && i > 0) return [];
      if (browserName === "firefox" && inSlottedLabel) {
        return ["LABEL.bx--label bx--label--slotted", tag];
      }
      return [tag];
    },
  );

  await page.getByTestId("start").focus();
  // Bounded by the controls: Firefox wraps around the page instead of
  // landing on <body>, so waiting for <body> never ends there.
  const stops: string[] = [];
  for (let i = 1; i < expected.length; i++) {
    // biome-ignore lint/performance/noAwaitInLoops: tabs one stop at a time
    await page.keyboard.press("Tab");
    stops.push(
      await page.evaluate(() => {
        const el = document.activeElement;
        return el?.matches("input, textarea, select, button")
          ? el.tagName
          : `${el?.tagName}.${el?.className}`;
      }),
    );
  }
  expect(stops).toEqual(expected.slice(1));
});
