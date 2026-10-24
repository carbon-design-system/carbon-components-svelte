import { expect, test } from "./helpers/host";

/**
 * A fluid TimePicker splits its row by how many parts it has: with two
 * selects, the input and first select share half and the second takes
 * the rest; with one, the input and select take half each. The layout
 * comes from CSS alone, so server markup matches the hydrated picker.
 */
test("a fluid time picker splits its row by its parts", async ({ page }) => {
  await page.goto("/time-picker-fluid.html");

  const shares = (id: string) =>
    page
      .getByTestId(id)
      .locator(".bx--time-picker--fluid__wrapper > *")
      .evaluateAll((parts) => {
        const total = parts.reduce(
          (n, p) => n + p.getBoundingClientRect().width,
          0,
        );
        return parts.map((p) =>
          Math.round((p.getBoundingClientRect().width / total) * 100),
        );
      });

  expect(await shares("one-select")).toEqual([50, 50]);
  expect(await shares("two-selects")).toEqual([25, 25, 50]);
});

// Invalid and warning draw an outline around the whole field; the focused
// part still draws Carbon's focus inside it.
for (const status of ["invalid", "warning"]) {
  test(`a fluid time picker shows which part has focus when ${status}`, async ({
    page,
  }) => {
    await page.goto("/time-picker-fluid.html");
    const picker = page.getByTestId(status);
    const focusColor = await page.evaluate(() => {
      const probe = document.createElement("span");
      probe.style.color = "var(--cds-focus, #0f62fe)";
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });
    const outline = (selector: string) =>
      picker.locator(selector).evaluate((el) => {
        const style = getComputedStyle(el);
        return `${style.outlineStyle} ${style.outlineColor}`;
      });

    await picker.getByRole("textbox").focus();
    expect(await outline(".bx--text-input__field-wrapper")).toBe(
      `solid ${focusColor}`,
    );

    await picker.getByRole("combobox", { name: "Time zone" }).focus();
    expect(await outline(".bx--select-input__wrapper >> nth=1")).toBe(
      `solid ${focusColor}`,
    );
  });
}
