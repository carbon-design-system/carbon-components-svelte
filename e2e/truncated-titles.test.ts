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
  {
    name: "DatePicker multiple value",
    hover: ".bx--date-picker-input__wrapper",
    measure: ".bx--date-picker__input-overlay span",
    text: "09/09/2026, 09/10/2026, 09/11/2026, 09/12/2026",
  },
  {
    name: "Dropdown selected item",
    hover: "[data-testid=dropdown] .bx--list-box__label",
    text: "Legacy pager gateway for the on-call rotation",
  },
  {
    name: "MultiSelect label",
    hover: "[data-testid=multi-select] .bx--list-box__label",
    text: "Choose the regions to deploy to",
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

test("a focused multiple DatePicker shows the input's own text", async ({
  page,
}) => {
  await page.goto("/truncated-titles.html");
  const field = page.getByTestId("cut").getByTestId("date-picker");
  const input = field.getByRole("textbox", { name: "Blackout dates" });
  const read = () =>
    field.evaluate((el) => {
      const input = el.querySelector("input");
      const overlay = el.querySelector(".bx--date-picker__input-overlay");
      if (!input || !overlay) throw new Error("field not rendered");
      return {
        input: getComputedStyle(input).color,
        overlay: getComputedStyle(overlay).color,
        overlayVisibility: getComputedStyle(overlay).visibility,
        scrolled: input.scrollLeft > 0,
      };
    });

  // At rest, the overlay draws the value with an ellipsis over a
  // transparent input.
  const rest = await read();
  expect(rest.input).toBe("rgba(0, 0, 0, 0)");
  expect(rest.overlayVisibility).toBe("visible");

  // While focused, the input shows its own text, scrolled to the caret,
  // in the overlay's color.
  await input.focus();
  await page.keyboard.press("End");
  const focused = await read();
  expect(focused.overlayVisibility).toBe("hidden");
  expect(focused.input).toBe(rest.overlay);
  expect(focused.scrolled).toBe(true);

  await input.blur();
  expect(await read()).toMatchObject({
    input: "rgba(0, 0, 0, 0)",
    overlayVisibility: "visible",
  });
});
