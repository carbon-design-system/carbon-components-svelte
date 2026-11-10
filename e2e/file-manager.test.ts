import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const row = (page: Page, path: string) =>
  page.locator(`tr[data-row="${path}"]`);
const tile = (page: Page, path: string) =>
  page.locator(`[data-file-path="${path}"]`);
const state = (page: Page) => page.getByTestId("state");
const modifier = process.platform === "darwin" ? "Meta" : "Control";

async function open(page: Page, query = "") {
  await page.goto(`/file-manager.html?${query}`);
  await expect(
    page.locator("tr[data-row], [data-file-path]").first(),
  ).toBeVisible();
}

test.describe("FileManager", () => {
  test("shows the tree, the path and a sorted table with folders first", async ({
    page,
  }) => {
    await open(page);
    await expect(
      page.getByRole("treeitem", { name: "Documents" }),
    ).toBeVisible();
    const names = await page
      .locator("tr[data-row]")
      .evaluateAll((rows) => rows.map((tr) => tr.getAttribute("data-row")));
    expect(names).toEqual([
      "/Archive",
      "/Deep",
      "/Documents",
      "/Empty",
      "/Photos",
      "/Projects",
      "/README.md",
    ]);
  });

  test("opens a folder from the table, the tree and the path", async ({
    page,
  }) => {
    await open(page);
    await row(page, "/Documents").dblclick();
    await expect(state(page)).toContainText("/Documents|list");
    await expect(row(page, "/Documents/notes.txt")).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Folder path" }),
    ).toContainText("Documents");

    await page
      .getByRole("navigation", { name: "Folder path" })
      .getByRole("link", { name: "My files" })
      .click();
    await expect(state(page)).toContainText("/|list");

    await page.getByRole("treeitem", { name: "Photos" }).click();
    await expect(state(page)).toContainText("/Photos|list");
    await expect(row(page, "/Photos/image-1.svg")).toBeVisible();
  });

  test("selects with click, Shift range, Cmd toggle and select all", async ({
    page,
  }) => {
    await open(page);
    await row(page, "/Documents").locator("td").nth(1).click();
    await expect(state(page)).toContainText("|list|/Documents");
    await row(page, "/Photos")
      .locator("td")
      .nth(1)
      .click({
        modifiers: ["Shift"],
      });
    await expect(state(page)).toContainText("/Documents,/Empty,/Photos");
    await row(page, "/Archive")
      .locator("td")
      .nth(1)
      .click({
        modifiers: [modifier],
      });
    await expect(state(page)).toContainText("/Archive");
    await expect(row(page, "/Archive")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await row(page, "/Documents").focus();
    await page.keyboard.press(`${modifier}+a`);
    await expect(state(page)).toContainText(
      "/Archive,/Deep,/Documents,/Empty,/Photos,/Projects,/README.md",
    );
  });

  test("keeps the selection across a view switch and a sort", async ({
    page,
  }) => {
    await open(page);
    await row(page, "/Photos").locator("td").nth(1).click();
    await row(page, "/README.md")
      .locator("td")
      .nth(1)
      .click({
        modifiers: [modifier],
      });
    await page.getByRole("button", { name: "Grid view" }).click();
    await expect(page.getByRole("listbox", { name: /Files in/ })).toBeVisible();
    await expect(tile(page, "/Photos")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(tile(page, "/README.md")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await page.getByRole("button", { name: "List view" }).click();
    await page.getByRole("button", { name: /Size/ }).click();
    await expect(row(page, "/Photos")).toHaveAttribute("aria-selected", "true");
    await expect(state(page)).toContainText("/Photos,/README.md");
  });

  test("moves the cursor and the selection with the keyboard", async ({
    page,
  }) => {
    await open(page);
    await row(page, "/Archive").focus();
    await page.keyboard.press("ArrowDown");
    await expect(row(page, "/Deep")).toBeFocused();
    await expect(state(page)).toContainText("|list|/Deep");
    await page.keyboard.press("Shift+ArrowDown");
    await expect(state(page)).toContainText("/Deep,/Documents");
    await page.keyboard.press("End");
    await expect(row(page, "/README.md")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "README.md" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(row(page, "/README.md")).toBeFocused();
  });

  test("renames with F2 and refuses a name that exists", async ({ page }) => {
    await open(page);
    await row(page, "/README.md").focus();
    await page.keyboard.press("F2");
    const input = page.getByRole("textbox", { name: "Rename README.md" });
    await expect(input).toBeFocused();
    await input.fill("Projects");
    await expect(
      page.getByText("An item with that name already exists."),
    ).toBeVisible();
    await input.fill("notes.md");
    await page.keyboard.press("Enter");
    await expect(row(page, "/notes.md")).toBeVisible();
    await expect(row(page, "/README.md")).toHaveCount(0);
    await expect(row(page, "/notes.md")).toBeFocused();
  });

  test("deletes after a confirmation and returns focus to the neighbor", async ({
    page,
  }) => {
    await open(page);
    await row(page, "/Empty").focus();
    await page.keyboard.press("Delete");
    const dialog = page.getByRole("alertdialog", { name: 'Delete "Empty"?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Delete" }).click();
    await expect(row(page, "/Empty")).toHaveCount(0);
    await expect(row(page, "/Photos")).toBeFocused();
    await expect(
      page.getByRole("status").filter({ hasText: "Deleted 1 item" }),
    ).toHaveCount(1);
  });

  test("moves with the dialog and with cut and paste", async ({ page }) => {
    await open(page);
    await row(page, "/README.md").focus();
    await page.keyboard.press("m");
    const dialog = page.getByRole("dialog", { name: 'Move "README.md"' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("treeitem", { name: "Archive" }).click();
    await dialog.getByRole("button", { name: "Move" }).click();
    await expect(row(page, "/README.md")).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => (window.__fmLog ?? []).join("|")))
      .toContain("move");

    await row(page, "/Projects").focus();
    await page.keyboard.press(`${modifier}+x`);
    await page
      .locator(".bx--file-manager__sidebar")
      .getByRole("treeitem", { name: "Archive" })
      .click();
    await expect(state(page)).toContainText("/Archive|");
    await page.locator(".bx--file-manager__pane").focus();
    await page.keyboard.press(`${modifier}+v`);
    await expect(row(page, "/Archive/Projects")).toBeVisible();
  });

  test("moves by dragging onto a folder in the tree and in the table", async ({
    page,
  }) => {
    await open(page);
    await row(page, "/README.md").dragTo(
      page.getByRole("treeitem", { name: "Archive" }),
    );
    await expect(row(page, "/README.md")).toHaveCount(0);

    await row(page, "/Projects").dragTo(row(page, "/Documents"));
    await expect(row(page, "/Projects")).toHaveCount(0);
    await row(page, "/Documents").dblclick();
    await expect(row(page, "/Documents/Projects")).toBeVisible();
  });

  test("moves a tile onto a folder tile in the grid", async ({ page }) => {
    await open(page, "view=grid");
    await expect(tile(page, "/Documents")).toBeVisible();
    await tile(page, "/README.md").dragTo(tile(page, "/Archive"));
    await expect(tile(page, "/README.md")).toHaveCount(0);
  });

  test("creates a folder and names it", async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "New folder" }).click();
    const input = page.getByRole("textbox", { name: "Rename Untitled folder" });
    await expect(input).toBeFocused();
    await input.fill("Receipts");
    await page.keyboard.press("Enter");
    await expect(row(page, "/Receipts")).toBeVisible();
  });

  test("uploads a dropped file with progress and announces it", async ({
    page,
  }) => {
    await open(page, "details=0");
    await page.evaluate(() => {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(
        new File(["hello world"], "dropped.txt", { type: "text/plain" }),
      );
      const target = document.querySelector(
        ".bx--file-manager__pane",
      ) as HTMLElement;
      for (const type of ["dragenter", "dragover", "drop"]) {
        target.dispatchEvent(
          new DragEvent(type, {
            bubbles: true,
            cancelable: true,
            dataTransfer,
          }),
        );
      }
    });
    await expect(
      page
        .getByRole("progressbar")
        .or(page.getByText("Uploaded", { exact: false }))
        .first(),
    ).toBeVisible();
    await expect(row(page, "/dropped.txt")).toBeVisible();
    await expect(
      page.getByRole("status").filter({ hasText: "Uploaded 1 file" }),
    ).toHaveCount(1);
  });
});

test.describe("FileManager accessibility", () => {
  test("has no axe violations in the list, the grid and with details", async ({
    page,
  }) => {
    await open(page);
    expect(
      (await new AxeBuilder({ page }).include("#app").analyze()).violations,
    ).toEqual([]);
    await page.getByRole("button", { name: "Grid view" }).click();
    await expect(tile(page, "/Documents")).toBeVisible();
    expect(
      (await new AxeBuilder({ page }).include("#app").analyze()).violations,
    ).toEqual([]);
    await tile(page, "/Photos").click();
    await page.getByRole("button", { name: "Details" }).click();
    await expect(page.getByRole("heading", { name: "Photos" })).toBeVisible();
    // The panel slides in. Axe measures contrast mid-fade otherwise.
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.getAnimations().filter((a) => a.playState === "running")
              .length,
        ),
      )
      .toBe(0);
    expect(
      (await new AxeBuilder({ page }).include("#app").analyze()).violations,
    ).toEqual([]);
  });
});
