import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

const log = (page: import("@playwright/test").Page) =>
  page.getByTestId("log").evaluate((el) => JSON.parse(el.textContent ?? "[]"));

test.describe("Popconfirm", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/popconfirm.html");
  });

  test("opens as a non-modal alert dialog with Cancel focused", async ({
    page,
  }) => {
    const trigger = page.getByTestId("basic-trigger");
    await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await trigger.click();
    const dialog = page.getByRole("alertdialog", { name: "Delete this row?" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleDescription("You can't undo this.");
    await expect(dialog).not.toHaveAttribute("aria-modal");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(trigger).toHaveAttribute(
      "aria-controls",
      (await dialog.getAttribute("id")) ?? "",
    );
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  });

  test("Escape cancels and returns focus to the trigger", async ({ page }) => {
    const trigger = page.getByTestId("basic-trigger");
    await trigger.click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("alertdialog")).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(await log(page)).toEqual(["open", "cancel:escape-key", "close"]);
  });

  test("one Escape closes it even with the trigger's tooltip open", async ({
    page,
  }) => {
    const trigger = page.getByTestId("basic-trigger");
    await trigger.hover();
    await expect(trigger).toHaveClass(/bx--tooltip--visible/);
    await trigger.click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("alertdialog")).toBeHidden();
    await expect(trigger).not.toHaveClass(/bx--tooltip--visible/);
  });

  test("Tab and Shift+Tab cycle inside the popconfirm", async ({ page }) => {
    await page.getByTestId("basic-trigger").click();
    const dialog = page.getByRole("alertdialog");
    const cancel = dialog.getByRole("button", { name: "Cancel" });
    const confirm = dialog.getByRole("button", { name: "Delete" });
    await expect(cancel).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(confirm).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(cancel).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(confirm).toBeFocused();
  });

  test("Cancel and Confirm report their events and close", async ({ page }) => {
    const trigger = page.getByTestId("basic-trigger");
    await trigger.click();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("alertdialog")).toBeHidden();
    await expect(trigger).toBeFocused();

    await trigger.click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByRole("alertdialog")).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(await log(page)).toEqual([
      "open",
      "cancel:cancel-button",
      "close",
      "open",
      "confirm",
      "close",
    ]);
  });

  test("an outside click cancels and keeps the focus it made", async ({
    page,
  }) => {
    await page.getByTestId("basic-trigger").click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByTestId("outside").click();
    await expect(page.getByRole("alertdialog")).toBeHidden();
    await expect(page.getByTestId("outside")).toBeFocused();
    expect(await log(page)).toEqual([
      "open",
      "outside-clicked",
      "cancel:outside-click",
      "close",
    ]);
  });

  test("clicking the trigger again closes it", async ({ page }) => {
    const trigger = page.getByTestId("basic-trigger");
    await trigger.click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await trigger.click();
    await expect(page.getByRole("alertdialog")).toBeHidden();
    expect(await log(page)).toEqual(["open", "cancel:trigger", "close"]);
  });

  test("the warning kind is an alert dialog, the info kind a dialog that focuses Confirm", async ({
    page,
  }) => {
    await page.getByTestId("warning-trigger").click();
    const warning = page.getByRole("alertdialog", {
      name: "Discard this draft?",
    });
    await expect(
      warning.getByRole("button", { name: "Keep editing" }),
    ).toBeFocused();
    await page.keyboard.press("Escape");

    await page.getByTestId("info-trigger").click();
    const info = page.getByRole("dialog", { name: "Make this public?" });
    await expect(info).toBeVisible();
    await expect(info.getByRole("button", { name: "Publish" })).toBeFocused();
  });

  test("an async confirm shows loading, ignores close, then closes", async ({
    page,
  }) => {
    await page.getByTestId("async-ok-trigger").click();
    const dialog = page.getByRole("alertdialog");
    const confirm = dialog.getByRole("button", { name: "Delete" });
    await confirm.click();
    await expect(confirm).toHaveAttribute("aria-busy", "true");
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeDisabled();
    // The work is under way: Escape and a second click do nothing.
    await page.keyboard.press("Escape");
    await confirm.click({ force: true });
    await expect(dialog).toBeVisible();
    await expect(dialog).toBeHidden();
    expect(await log(page)).toEqual(["deleted"]);
    await expect(page.getByTestId("async-ok-trigger")).toBeFocused();
  });

  test("a failed confirm shows the error in place and can be retried", async ({
    page,
  }) => {
    await page.getByTestId("async-fail-trigger").click();
    const dialog = page.getByRole("alertdialog");
    const confirm = dialog.getByRole("button", { name: "Delete" });
    await confirm.click();
    await expect(dialog.getByRole("alert")).toHaveText(
      "Couldn't delete: Server said no",
    );
    await expect(dialog).toBeVisible();
    await expect(confirm).not.toHaveAttribute("aria-busy", "true");
    await expect(confirm).toBeFocused();

    await confirm.click();
    await expect(dialog).toBeHidden();
    expect(await log(page)).toEqual(["error", "deleted after retry"]);
  });

  test("a tag can be the trigger", async ({ page }) => {
    await page.getByTestId("tag-beta").click();
    const dialog = page.getByRole("alertdialog", { name: "Remove beta?" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Remove" }).click();
    await expect(page.getByTestId("tag-beta")).toBeHidden();
    await expect(page.getByTestId("tag-alpha")).toBeVisible();
  });

  test("bind:open opens it from a button outside", async ({ page }) => {
    await page.getByTestId("controlled-open").click();
    await expect(
      page.getByRole("alertdialog", { name: "Controlled" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("alertdialog", { name: "Controlled" }),
    ).toBeHidden();
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    const closed = await new AxeBuilder({ page }).include("#app").analyze();
    expect(closed.violations).toEqual([]);

    await page.getByTestId("async-fail-trigger").click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Delete" })
      .click();
    await expect(page.getByRole("alert")).toBeVisible();
    const open = await new AxeBuilder({ page }).include("#app").analyze();
    expect(open.violations).toEqual([]);
  });
});
