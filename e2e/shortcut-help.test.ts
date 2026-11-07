import { expect, test } from "./helpers/host";

test.describe("ShortcutProvider scopes", () => {
  test("a nested scope shadows the same keys and heads its own group", async ({
    page,
  }) => {
    await page.goto("/shortcut-help.html?scoped");

    await page.keyboard.press("Control+s");
    await expect(page.getByTestId("last")).toHaveText("save profile");

    await page.keyboard.press("Control+k");
    await expect(page.getByTestId("last")).toHaveText("palette");

    await page.keyboard.press("?");
    const dialog = page.getByRole("dialog", { name: "Keyboard shortcuts" });
    await expect(
      dialog.getByRole("heading", { name: "Edit profile" }),
    ).toBeVisible();
    await expect(dialog.getByText("Save profile")).toBeVisible();
    await expect(dialog.getByText("Save draft")).toHaveCount(0);
    await expect(dialog.getByText("Open command palette")).toBeVisible();
  });
});
