import { expect, type Locator, type Page, test } from "./helpers/host";

const CALENDAR = ".bx--date-picker__calendar.bx--date-picker__calendar--open";

/**
 * Opens the calendar, inserts 80px of content above the field inside
 * `container` (no scroll, no resize), and checks the calendar stays next
 * to the field. The insert stands in for a notice appearing in a dialog.
 */
async function expectCalendarToFollow(
  page: Page,
  input: Locator,
  container: string,
) {
  await input.click();
  const calendar = page.locator(CALENDAR);
  await expect(calendar).toBeVisible();

  // Distance from the field to the calendar's near edge, below or above:
  // the calendar flips above when the shift leaves no room under the field.
  const gap = async () => {
    const field = await input.boundingBox();
    const box = await calendar.boundingBox();
    if (!field || !box) throw new Error("field or calendar has no box");
    const below = box.y - (field.y + field.height);
    const above = field.y - (box.y + box.height);
    return Math.round(Math.abs(below) < Math.abs(above) ? below : above);
  };
  const top = async () => (await input.boundingBox())?.y ?? 0;
  const before = await top();

  await page.evaluate((selector) => {
    const notice = document.createElement("div");
    notice.style.height = "80px";
    document.querySelector(selector)?.prepend(notice);
  }, container);

  await expect.poll(top).not.toBe(before);
  await expect(calendar).toBeVisible();
  // Opening above overlaps the field by a few pixels, so allow a little
  // either way. Without following, the calendar is ~40px off.
  await expect.poll(async () => Math.abs(await gap())).toBeLessThanOrEqual(8);
}

test.describe("DatePicker calendar after a layout shift", () => {
  test("follows its field in a Modal", async ({ page }) => {
    await page.goto("/date-picker-modal.html");
    await expect(page.locator(".bx--modal")).toHaveClass(/is-visible/);
    await expectCalendarToFollow(
      page,
      page.getByRole("textbox", { name: "Start date" }),
      ".bx--modal-content",
    );
  });

  test("follows its field in a native dialog", async ({ page }) => {
    await page.goto("/date-picker-top-layer.html");
    await page.getByTestId("open-dialog").click();
    await expectCalendarToFollow(
      page,
      page.getByTestId("dialog-date-picker-portal-input"),
      "[data-testid=native-dialog]",
    );
  });
});
