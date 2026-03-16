import { expect, test } from "@playwright/test";

test.describe("MultiSelect", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/multiselect.html");
  });

  test("opens menu on click", async ({ page }) => {
    const multiselect = page.getByTestId("multiselect-fruits");
    await multiselect.click();

    await expect(page.getByRole("option", { name: "Apple" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Banana" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Cherry" })).toBeVisible();
  });

  test("selects multiple items", async ({ page }) => {
    const multiselect = page.getByTestId("multiselect-fruits");
    await multiselect.click();

    await page.getByRole("option", { name: "Apple" }).click();
    await page.getByRole("option", { name: "Cherry" }).click();

    await expect(page.getByTestId("selected-count")).toContainText("2");
  });

  test("filters items when filterable", async ({ page }) => {
    const multiselect = page.getByTestId("multiselect-fruits");
    await multiselect.click();

    const input = page.getByPlaceholder("Filter fruits");
    await input.fill("er");

    await expect(page.getByRole("option", { name: "Cherry" })).toBeVisible();
    await expect(
      page.getByRole("option", { name: "Elderberry" }),
    ).toBeVisible();
    await expect(page.getByRole("option", { name: "Apple" })).not.toBeVisible();
  });

  test("clears selection", async ({ page }) => {
    const multiselect = page.getByTestId("multiselect-fruits");
    await multiselect.click();

    await page.getByRole("option", { name: "Apple" }).click();
    await expect(page.getByTestId("selected-count")).toContainText("1");

    await page.getByRole("button", { name: /Clear/i }).click();
    await expect(page.getByTestId("selected-count")).not.toBeVisible();
  });

  test("opens with Enter and closes with Escape", async ({ page }) => {
    const trigger = page.getByTestId("multiselect-fruits");
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("option", { name: "Apple" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("option", { name: "Apple" })).not.toBeVisible();
  });

  test("ArrowDown and Enter toggle option selection", async ({ page }) => {
    const trigger = page.getByTestId("multiselect-fruits");
    await trigger.click();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("selected-count")).toContainText("1");
  });

  test.describe("isSelectAll", () => {
    test("renders select-all option first and applies selectall class", async ({
      page,
    }) => {
      const multiselect = page.getByTestId("multiselect-roles");
      await multiselect.click();

      await expect(
        page.getByRole("option", { name: "All roles" }),
      ).toBeVisible();
      const listboxWithSelectAll = page
        .getByRole("listbox")
        .filter({ has: page.getByRole("option", { name: "All roles" }) });
      await expect(
        listboxWithSelectAll.getByRole("option").first(),
      ).toContainText("All roles");

      await expect(page.locator(".bx--multi-select--selectall")).toBeVisible();
    });

    test("clicking select-all selects all non-disabled items", async ({
      page,
    }) => {
      const multiselect = page.getByTestId("multiselect-roles");
      await multiselect.click();

      await page.getByRole("option", { name: "All roles" }).click();

      await expect(page.getByTestId("selected-roles-count")).toContainText(
        "Selected roles: 3",
      );
      await expect(
        page.getByRole("option", { name: "Reader" }),
      ).toHaveAttribute("aria-selected", "false");
    });

    test("disabled item is not selected when using select-all", async ({
      page,
    }) => {
      const multiselect = page.getByTestId("multiselect-roles");
      await multiselect.click();
      await page.getByRole("option", { name: "All roles" }).click();

      const readerOption = page.getByRole("option", { name: "Reader" });
      await expect(readerOption).toHaveAttribute("aria-selected", "false");
    });

    test("clicking select-all again deselects all", async ({ page }) => {
      const multiselect = page.getByTestId("multiselect-roles");
      await multiselect.click();
      await page.getByRole("option", { name: "All roles" }).click();
      await expect(page.getByTestId("selected-roles-count")).toContainText(
        "Selected roles: 3",
      );

      await page.getByRole("option", { name: "All roles" }).click();
      await expect(page.getByTestId("selected-roles-count")).not.toBeVisible();
    });

    test("select-all shows indeterminate when some items selected", async ({
      page,
    }) => {
      const multiselect = page.getByTestId("multiselect-roles");
      await multiselect.click();
      await page.getByRole("option", { name: "Editor" }).click();

      const allRolesOption = page.getByRole("option", { name: "All roles" });
      await expect(allRolesOption).toHaveAttribute("aria-checked", "mixed");
    });

    test("clear button deselects all with select-all", async ({ page }) => {
      const multiselect = page.getByTestId("multiselect-roles");
      await multiselect.click();
      await page.getByRole("option", { name: "All roles" }).click();
      await expect(page.getByTestId("selected-roles-count")).toContainText(
        "Selected roles: 3",
      );

      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: /Clear/i }).click();
      await expect(page.getByTestId("selected-roles-count")).not.toBeVisible();
    });

    test("select-all option stays visible when filtering", async ({ page }) => {
      const multiselect = page.getByTestId("multiselect-roles");
      await multiselect.click();

      const input = page.getByPlaceholder("Filter roles...");
      await input.fill("Ed");

      await expect(
        page.getByRole("option", { name: "All roles" }),
      ).toBeVisible();
      await expect(page.getByRole("option", { name: "Editor" })).toBeVisible();
      await expect(
        page.getByRole("option", { name: "Owner" }),
      ).not.toBeVisible();
    });
  });
});
