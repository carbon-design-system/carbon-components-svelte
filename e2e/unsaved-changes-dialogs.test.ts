import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

const kinds = ["modal", "composed", "sidepanel"] as const;

for (const kind of kinds) {
  test.describe(`${kind} close guard`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/unsaved-changes-dialogs.html?kind=${kind}`);
      await page.getByRole("button", { name: "Edit profile" }).click();
      await expect(page.getByTestId("state")).toHaveText("open:clean");
    });

    test("Escape on a clean form closes the dialog", async ({ page }) => {
      await page.getByLabel("Name").click();
      await page.keyboard.press("Escape");

      await expect(page.getByTestId("state")).toHaveText("closed:clean");
      await expect(page.getByRole("alertdialog")).toHaveCount(0);
    });

    test("Keep editing returns focus to the field and keeps the edits", async ({
      page,
    }) => {
      const name = page.getByLabel("Name");
      await name.fill("Ada!");
      await page.keyboard.press("Escape");

      const prompt = page.getByRole("alertdialog");
      await expect(prompt).toBeVisible();
      await expect(prompt).toHaveAccessibleName("Discard unsaved changes?");
      await expect(
        page.getByRole("button", { name: "Keep editing" }),
      ).toBeFocused();
      await expect(page.getByTestId("state")).toHaveText("open:dirty");

      await page.keyboard.press("Enter");
      await expect(prompt).toBeHidden();
      await expect(name).toBeFocused();
      await expect(name).toHaveValue("Ada!");
      await expect(page.getByTestId("state")).toHaveText("open:dirty");
    });

    test("Discard closes the dialog, restores the value and returns focus to a modal opener", async ({
      page,
    }) => {
      await page.getByLabel("Name").fill("Ada!");
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Discard" }).click();

      await expect(page.getByTestId("state")).toHaveText("closed:clean");
      // A non-modal SidePanel never takes focus, so it has none to return.
      if (kind !== "sidepanel") {
        await expect(
          page.getByRole("button", { name: "Edit profile" }),
        ).toBeFocused();
      }

      await page.getByRole("button", { name: "Edit profile" }).click();
      await expect(page.getByLabel("Name")).toHaveValue("Ada");
    });

    test("the prompt has no detectable accessibility violations", async ({
      page,
    }) => {
      await page.getByLabel("Name").fill("Ada!");
      await page.keyboard.press("Escape");
      await expect(page.getByRole("alertdialog")).toBeVisible();
      // Axe reads a half-faded dialog as low contrast.
      await page.evaluate(() =>
        Promise.allSettled(
          document.getAnimations().map((animation) => animation.finished),
        ),
      );

      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    });
  });
}
