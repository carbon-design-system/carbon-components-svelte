import { expect, test } from "./helpers/host";

// The browser disables a fieldset's native controls but not a `role="slider"`
// thumb, a label scrub, or a click on an icon inside a disabled button. Each
// test tries one of those and checks nothing changed.
const initial = JSON.stringify({
  slider: 50,
  lower: 20,
  upper: 80,
  count: 5,
  team: "a",
}).replaceAll(",", ", ");

test.describe("Components in a disabled fieldset", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/fieldset-disabled.html");
    await expect(page.getByTestId("state")).toHaveText(initial);
  });

  test("slider thumbs leave the tab order and ignore keys and track clicks", async ({
    page,
  }) => {
    await page.getByTestId("before").focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("slider").first()).not.toBeFocused();

    await page.getByRole("slider", { name: "Volume" }).focus();
    await page.keyboard.press("ArrowRight");
    await page.getByRole("slider").nth(1).focus();
    await page.keyboard.press("ArrowRight");
    const track = await page
      .locator(".bx--slider__track")
      .first()
      .boundingBox();
    if (!track) throw new Error("missing slider track");
    await page.mouse.click(
      track.x + track.width * 0.9,
      track.y + track.height / 2,
    );

    await expect(page.getByTestId("state")).toHaveText(initial);
  });

  test("a NumberInput label drag doesn't scrub", async ({ page }) => {
    const label = await page.getByText("Count", { exact: true }).boundingBox();
    if (!label) throw new Error("missing label");
    await page.mouse.move(label.x + 5, label.y + 5);
    await page.mouse.down();
    await page.mouse.move(label.x + 60, label.y + 5, { steps: 6 });
    await page.mouse.up();

    await expect(page.getByTestId("state")).toHaveText(initial);
  });

  for (const name of ["Team", "Owner"]) {
    test(`the ${name} list box chevron doesn't open the menu`, async ({
      page,
    }) => {
      const field = page.locator(".bx--list-box__wrapper", { hasText: name });
      await field.locator(".bx--list-box__menu-icon").click({ force: true });

      await expect(page.getByRole("listbox")).toHaveCount(0);
    });
  }
});
