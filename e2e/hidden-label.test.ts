import { expect, test } from "@playwright/test";

/**
 * `hideLabel` must hide the label without leaving its box behind: no indent
 * before an inline control and no blank row above a stacked one (#4315).
 *
 * The unit tests only see the `bx--visually-hidden` class, which kept passing
 * when ProgressBar moved it onto the label text and left the label row in
 * place. Margins, padding and min-widths only show up with a layout engine.
 *
 * Each case wraps one component in a block box. With the label hidden, the
 * first visible part of the control should start at the wrapper's corner.
 */
const cases: { id: string; control: string; axes?: ("x" | "y")[] }[] = [
  { id: "text-input", control: "input" },
  { id: "text-input-inline", control: "input" },
  { id: "password-input", control: "input" },
  { id: "password-input-inline", control: "input" },
  { id: "number-input", control: "input" },
  { id: "select", control: "select" },
  { id: "select-inline", control: "select" },
  { id: "text-area", control: "textarea" },
  { id: "combo-box", control: ".bx--list-box" },
  { id: "dropdown", control: ".bx--list-box" },
  { id: "dropdown-inline", control: ".bx--list-box" },
  { id: "multi-select", control: ".bx--list-box" },
  { id: "multi-select-inline", control: ".bx--list-box" },
  { id: "time-picker", control: "input" },
  { id: "date-picker", control: "input" },
  { id: "copy-input", control: "input" },
  // The range labels sit to the slider's left by design.
  { id: "slider", control: ".bx--slider-container", axes: ["y"] },
  { id: "meter", control: "[role=meter]" },
];

test.describe("hideLabel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/hidden-label.html");
  });

  for (const { id, control, axes = ["x", "y"] } of cases) {
    test(`${id} leaves no space for the hidden label`, async ({ page }) => {
      const wrapper = page.getByTestId(id);
      const wrapperBox = await wrapper.boundingBox();
      const controlBox = await wrapper.locator(control).first().boundingBox();
      if (!wrapperBox || !controlBox) throw new Error(`${id} not rendered`);

      for (const axis of axes) {
        expect(controlBox[axis], axis).toBeCloseTo(wrapperBox[axis], 0);
      }
    });
  }
});
