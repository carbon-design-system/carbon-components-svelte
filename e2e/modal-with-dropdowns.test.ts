import { expect, test } from "@playwright/test";

test.describe("Modal with Dropdowns", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/modal-with-dropdowns.html");
    await page.getByTestId("open-modal").click();
    await expect(page.locator(".bx--modal")).toHaveClass(/is-visible/);
  });

  test("renders dropdown components inside the modal", async ({ page }) => {
    await expect(
      page.getByRole("dialog", { name: "Add a contact" }),
    ).toBeVisible();
    await expect(page.getByText("Contact method")).toBeVisible();
    await expect(page.getByText("Preferred channel")).toBeVisible();
    await expect(page.getByText("Notification methods")).toBeVisible();
  });

  test("ComboBox opens and selects an item", async ({ page }) => {
    const combobox = page.getByRole("combobox", { name: "Contact method" });
    await combobox.click();

    await expect(combobox).toHaveAttribute("aria-expanded", "true");
    await page.getByRole("option", { name: "Email" }).click();
    await expect(combobox).toHaveValue("Email");
  });

  test("Dropdown opens and selects an item", async ({ page }) => {
    await page.getByRole("combobox", { name: "Preferred channel" }).click();

    const menu = page.getByRole("listbox", { name: "Preferred channel" });
    await expect(menu).toBeVisible();

    await menu.getByRole("option", { name: "Fax" }).click();
    await expect(
      page.getByRole("combobox", { name: "Preferred channel" }),
    ).toContainText("Fax");
  });

  test("MultiSelect opens and selects items", async ({ page }) => {
    const trigger = page.getByRole("combobox", { name: "Open menu" });
    await trigger.click();

    const menu = page.getByRole("listbox", { name: "Choose an item" });
    await expect(menu).toBeVisible();

    await menu.getByRole("option", { name: "Slack" }).click();
    await menu.getByRole("option", { name: "Email" }).click();

    await expect(
      menu.getByRole("option", { name: "Slack" }).getByRole("checkbox"),
    ).toBeChecked();
    await expect(
      menu.getByRole("option", { name: "Email" }).getByRole("checkbox"),
    ).toBeChecked();
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/3170
  test("MultiSelect keeps sequential label clicks selected and syncs bind:selectedIds", async ({
    page,
  }) => {
    const trigger = page.getByRole("combobox", { name: "Open menu" });
    await trigger.click();

    const menu = page.getByRole("listbox", { name: "Choose an item" });
    await expect(menu).toBeVisible();

    const picks = ["Slack", "Email", "Phone"];
    for (const name of picks) {
      const option = menu.getByRole("option", { name });
      // Click label text, not the checkbox input. That path double-toggled.
      // biome-ignore lint/performance/noAwaitInLoops: each click must finish before the next
      await option.getByText(name, { exact: true }).click();
      await expect(option.getByRole("checkbox")).toBeChecked();
    }

    await Promise.all(
      picks.map((name) =>
        expect(
          menu.getByRole("option", { name }).getByRole("checkbox"),
        ).toBeChecked(),
      ),
    );

    await expect(page.getByTestId("notification-count")).toHaveText("3");
    await expect(page.getByTestId("notification-ids")).toHaveText("0,1,4");
  });

  test("Dropdown menu renders outside the dialog (portal)", async ({
    page,
  }) => {
    await page.getByRole("combobox", { name: "Preferred channel" }).click();

    // The Dropdown listbox is portaled outside the dialog element.
    const dialog = page.getByRole("dialog", { name: "Add a contact" });
    const menuInsideDialog = dialog.getByRole("listbox", {
      name: "Preferred channel",
    });
    await expect(menuInsideDialog).toHaveCount(0);

    // But it exists on the page.
    const menu = page.getByRole("listbox", { name: "Preferred channel" });
    await expect(menu).toBeVisible();
  });

  test("modal closes via secondary button while dropdown is present", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.locator(".bx--modal")).not.toHaveClass(/is-visible/);
  });
});
