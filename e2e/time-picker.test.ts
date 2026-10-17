import { expect, test } from "./helpers/host";

test.describe("TimePicker", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/time-picker.html");
  });

  test("renders time picker", async ({ page }) => {
    await expect(page.getByTestId("time-picker")).toBeVisible();
    await expect(page.getByLabel("Meeting time")).toBeVisible();
  });

  test("can fill time input", async ({ page }) => {
    const input = page.getByLabel("Meeting time");
    await input.fill("02:30");
    await expect(input).toHaveValue("02:30");
  });

  test("can select AM/PM from dropdown", async ({ page }) => {
    const select = page.getByLabel("AM/PM");
    await select.selectOption("am");
    await expect(select).toHaveValue("am");
  });

  // The input and selects stay on one row where it fits and wrap onto a
  // second in a container too narrow for one.
  test("wraps the selects in a narrow container", async ({ page }) => {
    const layout = (id: string) =>
      page.getByTestId(id).evaluate((box) => {
        const edge = box.getBoundingClientRect().right;
        const tops = [
          ...box.querySelectorAll(
            ".bx--time-picker__input-field, .bx--select-input",
          ),
        ].map((el) => Math.round(el.getBoundingClientRect().top));
        const overflow = Math.max(
          0,
          ...[...box.querySelectorAll("*")].map(
            (el) => el.getBoundingClientRect().right - edge,
          ),
        );
        return { rows: new Set(tops).size, overflow: Math.round(overflow) };
      });

    expect(await layout("time-picker-400")).toEqual({ rows: 1, overflow: 0 });
    const narrow = await layout("time-picker-200");
    expect(narrow.rows).toBeGreaterThan(1);
    expect(narrow.overflow).toBe(0);
  });
});
