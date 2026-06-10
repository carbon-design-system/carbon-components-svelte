import { expect, test } from "@playwright/test";

test.describe("ComboBox", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/combobox.html");
  });

  test("renders with placeholder", async ({ page }) => {
    await expect(page.getByPlaceholder("Select contact method")).toBeVisible();
  });

  test("can be located by getByLabel when labelText is set", async ({
    page,
  }) => {
    // With labelText="Contact", the combobox is findable via its associated label.
    // The label's for attribute points to the input; use locator to get the input.
    const combobox = page.getByLabel("Contact").locator("input");
    await expect(combobox).toBeVisible();
    await combobox.fill("Email");
    await expect(combobox).toHaveValue("Email");
  });

  test("can be located and interacted with by data-testid", async ({
    page,
  }) => {
    const combobox = page.getByTestId("combobox-contact");
    await expect(combobox).toBeVisible();
    await combobox.click();
    await combobox.fill("Slack");
    await expect(combobox).toHaveValue("Slack");
  });

  test("opens menu on click and filters items", async ({ page }) => {
    const combobox = page.getByTestId("combobox-contact");
    await combobox.click();
    const menu = page.locator(".bx--list-box__menu");
    await expect(menu).toBeVisible();
    await combobox.fill("Fax");
    await expect(page.getByRole("option", { name: "Fax" })).toBeVisible();
  });

  test("selects item from dropdown", async ({ page }) => {
    const combobox = page.getByTestId("combobox-contact");
    await combobox.click();
    await page.getByRole("option", { name: "Email" }).click();
    await expect(combobox).toHaveValue("Email");
  });

  test("filters items by typing", async ({ page }) => {
    const combobox = page.getByTestId("combobox-contact");
    await combobox.click();
    await combobox.fill("Sl");
    await expect(page.getByRole("option", { name: "Slack" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Email" })).not.toBeVisible();
  });

  test("opens menu with Enter and selects with Arrow Down + Enter", async ({
    page,
  }) => {
    const combobox = page.getByTestId("combobox-contact");
    await combobox.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".bx--list-box__menu")).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(combobox).toHaveValue("Slack");
  });

  test("opens closed menu with ArrowDown and highlights the first option", async ({
    page,
  }) => {
    const combobox = page.getByTestId("combobox-contact");
    await combobox.focus();
    await expect(page.locator(".bx--list-box__menu")).not.toBeVisible();

    await page.keyboard.press("ArrowDown");

    await expect(page.locator(".bx--list-box__menu")).toBeVisible();
    // Slack (id="0") is the first option.
    await expect(combobox).toHaveAttribute("aria-activedescendant", /-0$/);

    await page.keyboard.press("Enter");
    await expect(combobox).toHaveValue("Slack");
  });

  test("opens closed menu with ArrowUp and highlights the last option", async ({
    page,
  }) => {
    const combobox = page.getByTestId("combobox-contact");
    await combobox.focus();

    await page.keyboard.press("ArrowUp");

    await expect(page.locator(".bx--list-box__menu")).toBeVisible();
    // Fax (id="2") is the last option.
    await expect(combobox).toHaveAttribute("aria-activedescendant", /-2$/);

    await page.keyboard.press("Enter");
    await expect(combobox).toHaveValue("Fax");
  });

  test("opens closed menu with Alt+ArrowDown without moving the highlight", async ({
    page,
  }) => {
    const combobox = page.getByTestId("combobox-contact");
    await combobox.focus();

    await page.keyboard.press("Alt+ArrowDown");

    await expect(page.locator(".bx--list-box__menu")).toBeVisible();
    await expect(combobox).toHaveAttribute("aria-activedescendant", "");
  });

  test("closes open menu with Alt+ArrowUp", async ({ page }) => {
    const combobox = page.getByTestId("combobox-contact");
    await combobox.click();
    await expect(page.locator(".bx--list-box__menu")).toBeVisible();

    await page.keyboard.press("Alt+ArrowUp");

    await expect(page.locator(".bx--list-box__menu")).not.toBeVisible();
    await expect(combobox).toBeFocused();
  });

  test("closes menu with Escape", async ({ page }) => {
    const combobox = page.getByTestId("combobox-contact");
    await combobox.click();
    await expect(page.locator(".bx--list-box__menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".bx--list-box__menu")).not.toBeVisible();
  });

  test("does not trap focus when clicking an outside element while menu is open", async ({
    page,
  }) => {
    const combobox = page.getByTestId("combobox-contact");
    await combobox.click();
    await expect(page.locator(".bx--list-box__menu")).toBeVisible();

    // Click an outside focusable element while the menu is open.
    // The blur handler should not yank focus back to the input.
    const outsideLink = page.getByTestId("outside-link");
    await outsideLink.focus();

    await expect(outsideLink).toBeFocused();
  });

  test("closes the menu on an outside mouse click", async ({ page }) => {
    // Real-browser proof for the `use:dismiss` outside-click listener: jsdom
    // bubbles synthetic clicks differently, so this guards the actual behavior.
    const combobox = page.getByTestId("combobox-contact");
    await combobox.click();
    const menu = page.locator(".bx--list-box__menu");
    await expect(menu).toBeVisible();

    await page.getByTestId("outside-target").click();
    await expect(menu).not.toBeVisible();
  });

  test("clearing with openOnClear reopens without self-closing", async ({
    page,
  }) => {
    // The click that triggers clear({ open: true }) must not bubble to the
    // outside-click listener and immediately re-close the menu it just opened.
    // This is the timing-sensitive path that `skipWindowClick` used to guard;
    // it now relies on the gated listener being absent while the click bubbles.
    const wrapper = page.getByTestId("combobox-clear-reopen-wrapper");
    const combobox = wrapper.getByRole("combobox");
    const menu = wrapper.locator(".bx--list-box__menu");
    await expect(combobox).toHaveValue("Email");

    await wrapper.getByRole("button", { name: "Clear selected item" }).click();

    await expect(combobox).toHaveValue("");
    await expect(menu).toBeVisible();
    await expect(wrapper.getByRole("option")).toHaveCount(3);

    // A genuine outside click now closes it on the first try.
    await page.getByTestId("outside-target").click();
    await expect(menu).not.toBeVisible();
  });

  test("selects all text on focus when selectTextOnFocus is true", async ({
    page,
  }) => {
    const combobox = page.getByTestId("combobox-select-on-focus");
    await expect(combobox).toHaveValue("Email");
    await combobox.focus();
    // ComboBox selects on focus after Svelte tick(); WebKit can lag one frame.
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const input = document.activeElement;
            if (input instanceof HTMLInputElement) {
              return {
                selectionStart: input.selectionStart,
                selectionEnd: input.selectionEnd,
                valueLength: input.value.length,
              };
            }
            return null;
          }),
        { timeout: 10_000 },
      )
      .toMatchObject({
        selectionStart: 0,
        selectionEnd: 5,
        valueLength: 5,
      });
  });
});
