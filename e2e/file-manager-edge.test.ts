import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// A folder to pick, as a file picker with `webkitdirectory` would.
// @depends-on e2e/fixtures/file-manager-upload/**
const TRIP_FOLDER = join(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures/file-manager-upload/trip",
);

const row = (page: Page, path: string) =>
  page.locator(`tr[data-row="${path}"]`);
const tile = (page: Page, path: string) =>
  page.locator(`[data-file-path="${path}"]`);
const state = (page: Page) => page.getByTestId("state");
const sidebar = (page: Page) => page.locator(".bx--file-manager__sidebar");

async function open(page: Page, query = "") {
  await page.goto(`/file-manager.html?${query}`);
  await expect(
    page.locator("tr[data-row], [data-file-path]").first(),
  ).toBeVisible();
}

/** Drop files on the pane, as the OS does: `types` carries "Files". */
async function dropFiles(page: Page, names: string[]) {
  await page.evaluate((fileNames) => {
    const dataTransfer = new DataTransfer();
    for (const name of fileNames) {
      dataTransfer.items.add(
        new File(["hello world"], name, { type: "text/plain" }),
      );
    }
    const target = document.querySelector(".bx--file-manager__pane");
    for (const type of ["dragenter", "dragover", "drop"]) {
      target?.dispatchEvent(
        new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }),
      );
    }
  }, names);
}

test.describe("FileManager batch actions", () => {
  test("shows the count with Move to and Delete, and Cancel clears it", async ({
    page,
  }) => {
    await open(page);
    await row(page, "/Photos").locator("td").nth(1).click();
    await row(page, "/README.md")
      .locator("td")
      .nth(1)
      .click({
        modifiers: ["Shift"],
      });
    const bar = page.locator(".bx--batch-actions--active");
    await expect(bar).toContainText("3 items selected");
    await expect(bar.getByRole("button", { name: "Move to…" })).toBeVisible();
    await expect(bar.getByRole("button", { name: "Delete" })).toBeVisible();
    await bar.getByRole("button", { name: "Cancel" }).click();
    await expect(state(page)).toContainText("|list|");
    await expect(page.locator(".bx--batch-actions--active")).toHaveCount(0);
  });

  test("keeps the view and details controls reachable while selecting", async ({
    page,
  }) => {
    await open(page);
    await row(page, "/Photos").locator("td").nth(1).click();
    await page.getByRole("button", { name: "Grid view" }).click();
    await expect(tile(page, "/Photos")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});

test.describe("FileManager path", () => {
  test("collapses a long path into a menu of the hidden folders", async ({
    page,
  }) => {
    await page.goto(
      "/file-manager.html?path=/Deep/level-1/level-2/level-3/level-4/level-5",
    );
    const nav = page.getByRole("navigation", { name: "Folder path" });
    await expect(nav).toContainText("level-5");
    await expect(nav).not.toContainText("level-2");
    await nav.getByRole("button", { name: "Hidden folders" }).click();
    await page.getByRole("menuitem", { name: "level-2" }).click();
    await expect(state(page)).toContainText("/Deep/level-1/level-2|");
  });

  test("shows an error with Retry when a folder fails to load", async ({
    page,
  }) => {
    await open(page, "failList=/Photos");
    await row(page, "/Photos").dblclick();
    await expect(page.getByText("Couldn't load Photos")).toBeVisible();
    await expect(
      page.getByText("The server refused the request."),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
    await page.getByRole("link", { name: "My files" }).click();
    await expect(row(page, "/Documents")).toBeVisible();
  });

  test("shows a loading state, then an empty state with a drop hint", async ({
    page,
  }) => {
    await open(page, "latency=300");
    await row(page, "/Empty").dblclick();
    await expect(
      page.getByRole("status", { name: "Loading files" }),
    ).toBeVisible();
    await expect(page.getByText("This folder is empty")).toBeVisible();
    await expect(
      page.getByText("Drop files here, or choose Upload."),
    ).toBeVisible();
  });
});

test.describe("FileManager uploads", () => {
  test("lists each file with progress and clears finished ones", async ({
    page,
  }) => {
    await open(page, "latency=60");
    await dropFiles(page, ["a.txt", "b.txt"]);
    const list = page.locator(".bx--file-manager__uploads");
    await expect(list).toContainText("a.txt");
    await expect(list.getByRole("progressbar").first()).toBeVisible();
    await expect(page.getByText("Uploads, 2 of 2 done")).toBeVisible();
    await expect(row(page, "/a.txt")).toBeVisible();
    await list.getByRole("button", { name: "Clear finished" }).click();
    await expect(list).toHaveCount(0);
  });

  test("cancels an upload in flight and retries it", async ({ page }) => {
    await open(page, "latency=150");
    await dropFiles(page, ["slow.txt"]);
    const cancel = page.getByRole("button", {
      name: "Cancel upload: slow.txt",
    });
    await cancel.click();
    await expect(page.locator(".bx--progress-bar__helper-text")).toHaveText(
      "Canceled",
    );
    await expect(row(page, "/slow.txt")).toHaveCount(0);
    await page.getByRole("button", { name: "Retry upload: slow.txt" }).click();
    await expect(row(page, "/slow.txt")).toBeVisible({ timeout: 10_000 });
  });

  test("marks a rejected upload and keeps the others", async ({ page }) => {
    await open(page, "failUpload=bad.txt");
    await dropFiles(page, ["good.txt", "bad.txt"]);
    await expect(page.getByText("The upload was rejected.")).toBeVisible();
    await expect(row(page, "/good.txt")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Retry upload: bad.txt" }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "Uploaded 1 file. 1 failed." }),
    ).toHaveCount(1);
  });

  test("uploads a folder with its structure", async ({ page }) => {
    await open(page);
    await page
      .locator('input[type="file"][webkitdirectory]')
      .setInputFiles(TRIP_FOLDER);
    await expect(row(page, "/trip")).toBeVisible({ timeout: 10_000 });
    await row(page, "/trip").dblclick();
    await expect(row(page, "/trip/a.txt")).toBeVisible();
    await expect(row(page, "/trip/day-1")).toBeVisible();
  });

  test("shows the drop overlay while files are dragged over the pane", async ({
    page,
  }) => {
    await open(page);
    await page.evaluate(() => {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(new File(["x"], "x.txt"));
      document.querySelector(".bx--file-manager__pane")?.dispatchEvent(
        new DragEvent("dragenter", {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        }),
      );
    });
    await expect(page.getByText("Drop to upload to My files")).toBeVisible();
  });
});

test.describe("FileManager details and preview", () => {
  test("shows the picture and the facts of one image, and a count for many", async ({
    page,
  }) => {
    await open(page, "path=/Photos&details=1");
    await row(page, "/Photos/image-1.svg").locator("td").nth(1).click();
    const panel = page.locator(".bx--side-panel");
    await expect(
      panel.getByRole("heading", { name: "image-1.svg" }),
    ).toBeVisible();
    await expect(
      panel.getByRole("img", { name: "Preview of image-1.svg" }),
    ).toBeVisible();
    await expect(panel).toContainText("Location");
    await row(page, "/Photos/image-3.svg")
      .locator("td")
      .nth(1)
      .click({
        modifiers: ["Shift"],
      });
    await expect(
      panel.getByRole("heading", { name: "3 items selected" }),
    ).toBeVisible();
  });

  test("opens a text file in a sandboxed frame", async ({ page }) => {
    await open(page, "path=/Documents");
    await row(page, "/Documents/notes.txt").dblclick();
    const frame = page.locator("iframe[title='Preview of notes.txt']");
    await expect(frame).toBeVisible();
    await expect(frame).toHaveAttribute("sandbox", "");
  });

  test("falls back when a file has no preview", async ({ page }) => {
    await open(page, "path=/Documents/Reports");
    await row(page, "/Documents/Reports/q3.pdf").dblclick();
    await expect(page.getByRole("dialog", { name: "q3.pdf" })).toBeVisible();
  });
});

test.describe("FileManager themes and direction", () => {
  test("passes axe in Gray 100", async ({ page }) => {
    await open(page);
    await page.evaluate(() =>
      document.documentElement.classList.add("bx--g100"),
    );
    await page.evaluate(() => (document.body.style.background = "#161616"));
    await row(page, "/Photos").locator("td").nth(1).click();
    expect(
      (await new AxeBuilder({ page }).include("#app").analyze()).violations,
    ).toEqual([]);
    await page.evaluate(() =>
      document.documentElement.classList.remove("bx--g100"),
    );
    await page.evaluate(() => (document.body.style.background = ""));
  });

  test("passes axe in RTL and swaps the arrow keys in the grid", async ({
    page,
  }) => {
    await open(page, "view=grid");
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const grid = page.getByRole("listbox", { name: /Files in/ });
    await grid.focus();
    await page.keyboard.press("ArrowDown");
    await expect(tile(page, "/Archive")).toHaveAttribute("data-cursor", "");
    await page.keyboard.press("ArrowLeft");
    await expect(tile(page, "/Deep")).toHaveAttribute("data-cursor", "");
    await page.keyboard.press("ArrowRight");
    await expect(tile(page, "/Archive")).toHaveAttribute("data-cursor", "");
    // The first tile sits at the inline start, which is the right edge.
    const first = await tile(page, "/Archive").boundingBox();
    const second = await tile(page, "/Deep").boundingBox();
    expect(first && second && first.x > second.x).toBe(true);
    expect(
      (await new AxeBuilder({ page }).include("#app").analyze()).violations,
    ).toEqual([]);
    await page.evaluate(() => document.documentElement.removeAttribute("dir"));
  });

  test("draws the selection and the drop target in forced colors", async ({
    page,
  }) => {
    await open(page);
    await page.emulateMedia({ forcedColors: "active" });
    await row(page, "/Photos").locator("td").nth(1).click();
    const background = await row(page, "/Photos")
      .locator("td")
      .nth(1)
      .evaluate((cell) => getComputedStyle(cell).backgroundColor);
    expect(background).not.toBe("rgba(0, 0, 0, 0)");
    await page.getByRole("button", { name: "Grid view" }).click();
    const tileBackground = await tile(page, "/Photos").evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    expect(tileBackground).not.toBe(
      await tile(page, "/Documents").evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    );
    // The grid settles its columns a frame after the switch and may swap its
    // tiles, so set the attribute and read it in one step, until it holds.
    await expect
      .poll(() =>
        page.evaluate(() => {
          const element = document.querySelector(
            '[data-file-path="/Documents"]',
          );
          element?.setAttribute("data-drop-target", "");
          return element ? getComputedStyle(element).outlineStyle : "";
        }),
      )
      .toBe("solid");
  });
});

test.describe("FileManager at scale", () => {
  test("windows a 10,000 file folder in both views and sorts it", async ({
    page,
  }) => {
    await open(page, "big=10000&path=/Big");
    await expect(row(page, "/Big/file-00000.txt")).toBeVisible();
    expect(await page.locator("tr[data-row]").count()).toBeLessThan(60);
    await page.getByRole("button", { name: /Size/ }).click();
    await page.getByRole("button", { name: /Size/ }).click();
    await expect(page.locator("th[aria-sort='descending']")).toHaveCount(1);
    await row(page, "/Big/file-00001.txt")
      .or(page.locator("tr[data-row]").first())
      .first()
      .focus();
    await page.keyboard.press("Control+a");
    await expect(page.getByText("10000 items selected")).toBeVisible();
    await page.getByRole("button", { name: "Grid view" }).click();
    await expect(page.locator("[role=option]").first()).toBeVisible();
    expect(await page.locator("[role=option]").count()).toBeLessThan(200);
    await expect(
      page.getByRole("option", { selected: true }).first(),
    ).toBeVisible();
  });

  test("loads a tree of 2,000 siblings lazily and windows it", async ({
    page,
  }) => {
    await open(page, "wide=2000");
    const calls = () =>
      page.evaluate(() => window.__fm?.adapter.calls.length ?? 0);
    const before = await calls();
    await sidebar(page)
      .getByRole("treeitem", { name: "Wide" })
      .locator(".bx--tree-parent-node__toggle")
      .click();
    await expect(
      page.locator('[data-tree-row-id="/Wide/folder-0001"]'),
    ).toBeVisible();
    expect(await page.locator("[data-tree-row-id]").count()).toBeLessThan(60);
    // One listing for the folder that opened, nothing for its 2,000 children.
    expect(await calls()).toBe(before + 1);
    await sidebar(page).getByRole("treeitem", { name: "folder-0002" }).click();
    await expect(state(page)).toContainText("/Wide/folder-0002|");
  });
});
