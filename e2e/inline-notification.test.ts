import { expect, test } from "./helpers/host";

test.describe("InlineNotification", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/inline-notification.html");
  });

  test("renders notification", async ({ page }) => {
    await expect(page.getByTestId("inline-notification")).toBeVisible();
    const notification = page.getByTestId("inline-notification");
    await expect(notification).toHaveRole("status");
    // Named once, by role="img" and <title>, so it isn't read twice.
    const icon = notification.getByRole("img", { name: "Information" });
    await expect(icon).toBeVisible();
    await expect(icon).not.toHaveAttribute("aria-label");
    await expect(page.getByText("Notification title")).toBeVisible();
    await expect(page.getByText("Notification subtitle")).toBeVisible();
  });

  test("can be dismissed via close button", async ({ page }) => {
    await expect(page.getByTestId("inline-notification")).toBeVisible();
    await page.getByRole("button", { name: "Close notification" }).click();
    await expect(page.getByTestId("inline-notification")).not.toBeVisible();
  });

  test("fills a wide parent with fullWidth, with no outer margin", async ({
    page,
  }) => {
    const notification = page
      .getByTestId("notification-wide")
      .locator(".bx--inline-notification");
    expect((await notification.boundingBox())?.width).toBe(1200);
    await expect(notification).toHaveCSS("margin-top", "0px");
    await expect(notification).toHaveCSS("margin-bottom", "0px");
  });

  // A high-contrast notification has an inverse fill, so components in its
  // text take the inverse text and link colors, as its title does.
  test("draws slotted components in the inverse colors", async ({ page }) => {
    // Links fade between colors, so read them at rest after a theme change.
    await page.addStyleTag({
      content: "*, *::before, *::after { transition: none !important; }",
    });
    for (const theme of ["white", "g100"]) {
      await page.evaluate(
        (t) => document.documentElement.setAttribute("theme", t),
        theme,
      );
      for (const id of ["inline-content", "toast-content"]) {
        const root = page.getByTestId(id);
        const colors = await root.evaluate((node) => {
          const color = (selector: string) =>
            getComputedStyle(node.querySelector(selector) as Element).color;
          const probe = document.createElement("span");
          probe.style.color = "var(--cds-link-inverse)";
          node.append(probe);
          const link = getComputedStyle(probe).color;
          probe.remove();
          return {
            item: color(".bx--list__item"),
            link: color(".bx--link"),
            title: getComputedStyle(node).color,
            linkInverse: link,
          };
        });
        expect.soft(colors.item, `${theme} ${id} list`).toBe(colors.title);
        expect
          .soft(colors.link, `${theme} ${id} link`)
          .toBe(colors.linkInverse);
      }
    }
  });
});
