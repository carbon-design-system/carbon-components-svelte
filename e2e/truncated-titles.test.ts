import { expect, test } from "./helpers/host";

/**
 * Text that a component cuts off with an ellipsis gets a `title` with the
 * full text when the pointer is over it, so a mouse user can read it. Text
 * that fits gets none, so nothing shows a tooltip that repeats it.
 */
const CASES: {
  name: string;
  hover: string;
  /** The element that truncates, inside `hover`. */
  measure?: string;
  text: string;
}[] = [
  {
    name: "Pagination item count",
    hover: ".bx--pagination__items-count",
    text: "21–30 of 120 items",
  },
  {
    name: "ProgressStep label",
    hover: ".bx--progress-step-button >> nth=0",
    measure: ".bx--progress-label",
    text: "Team members",
  },
  {
    name: "ProgressStep slotted label",
    hover: ".bx--progress-step-button >> nth=1",
    measure: ".bx--progress-label",
    text: "Billing plan",
  },
  {
    name: "Switch label",
    hover: ".bx--content-switcher__label >> nth=0",
    text: "Table of contents",
  },
];

test("truncated text has a title on hover, and text that fits has none", async ({
  page,
}) => {
  await page.goto("/truncated-titles.html");
  await page.evaluate(() => document.fonts.ready);

  for (const box of ["cut", "fits"] as const) {
    for (const { name, hover, measure, text } of CASES) {
      const target = page.getByTestId(box).locator(hover);
      const measured = measure ? target.locator(measure) : target;
      const label = `${name} (${box})`;
      // The fixture still cuts off what it means to.
      // biome-ignore lint/performance/noAwaitInLoops: one hover at a time
      const cut = await measured.evaluate(
        (el) => el.scrollWidth > el.clientWidth,
      );
      expect.soft(cut, label).toBe(box === "cut");

      await target.hover();
      if (box === "cut") {
        await expect.soft(target, label).toHaveAttribute("title", text);
      } else {
        expect.soft(await target.getAttribute("title"), label).toBeNull();
      }
    }
  }
});

test("the title follows a width change", async ({ page }) => {
  await page.goto("/truncated-titles.html");
  const box = page.getByTestId("fits");
  const count = box.locator(".bx--pagination__items-count");
  await count.hover();
  expect(await count.getAttribute("title")).toBeNull();

  await box.evaluate((el) => {
    el.style.width = "200px";
  });
  await page.mouse.move(0, 0);
  await count.hover();
  await expect(count).toHaveAttribute("title", "21–30 of 120 items");
});
