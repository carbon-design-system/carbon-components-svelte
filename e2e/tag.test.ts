import { expect, test } from "./helpers/host";

test.describe("Tag", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tag.html");
  });

  test("renders tag", async ({ page }) => {
    await expect(page.getByText("Carbon")).toBeVisible();
    await expect(page.getByText("Static tag")).toBeVisible();
  });

  test("filterable tag has close button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Clear filter" }),
    ).toBeVisible();
  });

  test("can be located by data-testid", async ({ page }) => {
    const tag = page.getByTestId("tag-filter");
    await expect(tag).toBeVisible();
    await expect(tag).toContainText("Carbon");
  });

  test("close button removes filterable tag", async ({ page }) => {
    await expect(page.getByTestId("tag-filter")).toBeVisible();

    await page.getByRole("button", { name: "Clear filter" }).click();

    await expect(page.getByTestId("tag-filter")).not.toBeVisible();
  });

  test("rings a close button for the keyboard, not the pointer", async ({
    page,
    browserName,
  }) => {
    const set = page.getByTestId("tag-pointer-focus");
    const ringed = () =>
      set
        .locator(".bx--tag__close-icon")
        .evaluateAll((buttons) =>
          buttons
            .filter((button) => getComputedStyle(button).boxShadow !== "none")
            .map((button) => button.closest(".bx--tag")?.textContent?.trim()),
        );

    // A click removes Alpha. TagSet hands focus to Beta's button, which
    // the pointer never touched, so it shows no ring. WebKit doesn't focus
    // a clicked button, so focus doesn't move there at all.
    await set.getByRole("button", { name: "Remove Alpha" }).click();
    await expect(set.getByText("Alpha")).toHaveCount(0);
    expect(await ringed()).toEqual([]);

    // From the keyboard, Beta's button shows the ring. WebKit's Tab skips
    // buttons, so this half runs in Chromium and Firefox.
    if (browserName === "webkit") return;
    await page.getByRole("button", { name: "Clear filter" }).focus();
    await page.keyboard.press("Tab");
    await expect(
      set.getByRole("button", { name: "Remove Beta" }),
    ).toBeFocused();
    expect(await ringed()).toEqual(["Beta"]);
  });

  test("keeps the same space beside the icon in RTL as in LTR", async ({
    page,
  }) => {
    // Distance from the inline-start edge to the icon, and from the label to
    // the inline-end edge.
    const gaps = (testId: string) =>
      page.getByTestId(testId).evaluate((tag) => {
        const rtl = getComputedStyle(tag).direction === "rtl";
        const box = tag.getBoundingClientRect();
        const icon = tag
          .querySelector(".bx--tag__custom-icon")
          ?.getBoundingClientRect();
        const label = tag
          .querySelector(".bx--tag__label")
          ?.getBoundingClientRect();
        if (!icon || !label) throw new Error("no icon or label");
        return rtl
          ? [box.right - icon.right, label.left - box.left]
          : [icon.left - box.left, box.right - label.right];
      });

    await page.evaluate(() => document.fonts.ready);

    for (const testId of ["tag-icon", "tag-icon-lg"]) {
      const ltr = await gaps(testId);
      await page.evaluate(() => {
        document.documentElement.dir = "rtl";
      });
      expect(await gaps(testId), testId).toEqual(ltr);
      await page.evaluate(() => {
        document.documentElement.dir = "ltr";
      });
    }
  });

  test("a truncated tag with tabindex -1 adds no tab stop in a TagSet", async ({
    page,
  }) => {
    const region = page.getByTestId("tag-focus-order");
    // Each label overflows the 208px cap, so it renders a tooltip trigger.
    await expect(region.locator(".bx--tag__label-tooltip")).toHaveCount(3);

    await region.getByRole("button", { name: "Before" }).focus();
    const order: string[] = [];
    for (let step = 0; step < 5; step++) {
      await page.keyboard.press("Tab");
      const name = await page.evaluate(
        () => document.activeElement?.textContent?.trim() ?? "",
      );
      order.push(name);
      if (name === "After") break;
    }

    expect(order).toEqual([
      "status:active AND region:us-south AND service:storage three",
      "After",
    ]);
  });
});
