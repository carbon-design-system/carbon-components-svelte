import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const rowCount = (page: Page) => page.getByRole("treeitem").count();

/** Wait for an expand-all or a search to finish its time slices. */
const settled = (page: Page) =>
  expect(page.getByRole("tree")).not.toHaveAttribute("aria-busy", "true");

test.describe("JsonViewer", () => {
  test("windows a 100,000 row tree and scrolls through all of it", async ({
    page,
  }) => {
    await page.goto("/json-viewer.html?data=users&n=10000&height=600");
    await page.getByRole("button", { name: "Expand all" }).click();
    await settled(page);

    const tree = page.getByRole("tree");
    expect(await rowCount(page)).toBeLessThan(80);
    // 10,000 users of 10 nodes, plus the root.
    expect(await tree.evaluate((el) => el.scrollHeight)).toBe(100_001 * 24);

    await tree.evaluate((el) => {
      el.scrollTop = 50_000 * 24;
    });
    await expect(
      page.getByRole("treeitem", { name: /^\s*id: 5000 /, exact: false }),
    ).toHaveCount(0);
    const middle = page.getByRole("treeitem").nth(10);
    const position = Number(await middle.getAttribute("aria-posinset"));
    expect(position).toBeGreaterThan(0);
    expect(await rowCount(page)).toBeLessThan(80);
  });

  test("End reaches the last row of a 100,000 row tree", async ({ page }) => {
    await page.goto("/json-viewer.html?data=users&n=10000&height=600");
    await page.getByRole("button", { name: "Expand all" }).click();
    await settled(page);

    await page.getByRole("treeitem").first().focus();
    await page.keyboard.press("End");

    const last = page.locator("[role=treeitem]:focus");
    await expect(last).toContainText("lng: -2499.75");
    await expect(page.getByTestId("path")).toHaveText("$[9999].geo.lng");
  });

  test("keeps the focused row in view as ArrowDown crosses the window", async ({
    page,
  }) => {
    await page.goto("/json-viewer.html?data=users&n=2000&expand=2&height=240");
    await page.getByRole("treeitem").first().focus();

    for (let i = 0; i < 60; i++) {
      // biome-ignore lint/performance/noAwaitInLoops: key presses are ordered
      await page.keyboard.press("ArrowDown");
    }

    const focused = page.locator("[role=treeitem]:focus");
    await expect(focused).toHaveAttribute("aria-posinset", /.+/);
    const inView = await focused.evaluate((row) => {
      const tree = row.closest("[role=tree]") as HTMLElement;
      const a = row.getBoundingClientRect();
      const b = tree.getBoundingClientRect();
      return a.top >= b.top - 1 && a.bottom <= b.bottom + 1;
    });
    expect(inView).toBe(true);
  });

  test("scrolls a depth 200 row's key into view", async ({ page }) => {
    await page.goto(
      "/json-viewer.html?data=deep&depth=200&expand=500&height=300",
    );
    await page.getByRole("treeitem").first().focus();
    await page.keyboard.press("End");

    const focused = page.locator("[role=treeitem]:focus");
    await expect(focused).toContainText("leaf");
    await expect(focused).toHaveAttribute("aria-level", "202");
    const visible = await focused.evaluate((row) => {
      const key = row.querySelector(".bx--json-viewer__key") as HTMLElement;
      const tree = row.closest("[role=tree]") as HTMLElement;
      const a = key.getBoundingClientRect();
      const b = tree.getBoundingClientRect();
      return a.left >= b.left && a.right <= b.right;
    });
    expect(visible).toBe(true);
  });

  test("finds a match deep in 100,000 rows without freezing the page", async ({
    page,
  }) => {
    await page.goto("/json-viewer.html?data=users&n=10000&height=600");
    await page.getByRole("searchbox").fill("user-9999");
    await settled(page);

    await expect(page.locator(".bx--json-viewer__status")).toHaveText("1 of 1");
    await expect(page.locator("[aria-current=true]")).toContainText(
      "user-9999",
    );
    await expect(page.getByTestId("path")).toHaveText("$[9999].name");
  });

  test("copies the active value with Ctrl+C and its path with the button", async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "grants the clipboard in Chromium");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/json-viewer.html?data=basic");

    await page.getByRole("treeitem", { name: /keywords/ }).click();
    await page.keyboard.press("ControlOrMeta+c");
    expect(
      JSON.parse(await page.evaluate(() => navigator.clipboard.readText())),
    ).toEqual(["svelte", "carbon", "components"]);

    await page.getByRole("button", { name: "Copy path" }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "$.keywords",
    );
  });

  test("focuses the search field with its shortcut", async ({ page }) => {
    await page.goto("/json-viewer.html?data=basic&shortcut=/");
    await page.getByRole("treeitem").first().focus();

    await page.keyboard.press("/");
    await expect(page.getByRole("searchbox")).toBeFocused();
  });
});

test.describe("JsonViewer right to left", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/json-viewer.html?data=basic&expand=2&types");
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    await expect(page.getByRole("tree")).toBeVisible();
  });

  test("indents from the right and keeps keys and values left to right", async ({
    page,
  }) => {
    const geometry = await page.evaluate(() => {
      const tree = document.querySelector("[role=tree]") as HTMLElement;
      const rows = [...tree.querySelectorAll<HTMLElement>("[role=treeitem]")];
      const root = rows[0];
      const child = rows.find((row) => row.getAttribute("aria-level") === "3");
      const key = child?.querySelector(".bx--json-viewer__key") as HTMLElement;
      const toggle = (row: HTMLElement | undefined) =>
        row?.querySelector(".bx--json-viewer__toggle")?.getBoundingClientRect();
      return {
        treeRight: tree.getBoundingClientRect().right,
        rootToggleRight: toggle(root)?.right ?? 0,
        childToggleRight: toggle(child)?.right ?? 0,
        keyDirection: getComputedStyle(key).direction,
        valueDirection: getComputedStyle(
          child?.querySelector(".bx--json-viewer__value") as HTMLElement,
        ).direction,
      };
    });

    // The root toggle hugs the right edge, and a child sits further left.
    expect(geometry.treeRight - geometry.rootToggleRight).toBeLessThan(24);
    expect(
      geometry.rootToggleRight - geometry.childToggleRight,
    ).toBeGreaterThan(12);
    expect(geometry.keyDirection).toBe("ltr");
    expect(geometry.valueDirection).toBe("ltr");
  });

  test("points a collapsed caret left, and opens with ArrowLeft", async ({
    page,
  }) => {
    await page.goto("/json-viewer.html?data=basic&expand=1");
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const row = page.getByRole("treeitem", { name: /^\s*keywords/ });
    const angle = () =>
      row.locator(".bx--json-viewer__caret").evaluate((svg) => {
        const matrix = new DOMMatrixReadOnly(getComputedStyle(svg).transform);
        return Math.round((Math.atan2(matrix.b, matrix.a) * 180) / Math.PI);
      });
    // A down chevron: 90 points left, -90 right, 0 down. The caret turns over
    // a transition, so wait for it to settle.
    await expect.poll(angle).toBe(90);

    await row.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(row).toHaveAttribute("aria-expanded", "true");
    await expect.poll(angle).toBe(0);
    await page.keyboard.press("ArrowRight");
    await expect(row).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("JsonViewer forced colors", () => {
  test.beforeEach(async ({ page, browserName }) => {
    test.skip(browserName === "webkit", "WebKit does not force colors");
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/json-viewer.html?data=types&expand=2&height=900");
    await expect(page.getByRole("tree")).toBeVisible();
  });

  test("tells every type apart by its text, with no color to go on", async ({
    page,
  }) => {
    const text = async (key: string) =>
      (
        await page
          .getByRole("treeitem", { name: new RegExp(`^\\s*${key}\\b`) })
          .locator(".bx--json-viewer__value")
          .textContent()
      )?.trim();

    expect(await text("string")).toBe('"Hello, world"');
    expect(await text("number")).toBe("42");
    expect(await text("bigint")).toBe("9007199254740993n");
    expect(await text("date")).toMatch(/^Date 2024-05-01/);
    // A production build may rename the function, so check its shape.
    expect(await text("fn")).toMatch(/^ƒ \w+\(\)$/);
    expect(await text("self")).toBe("[Circular → $]");
    expect(await text("null")).toBe("null");
  });

  test("marks the active row and the matches with system colors", async ({
    page,
  }) => {
    await page.getByRole("searchbox").fill("hello");
    await expect(page.locator(".bx--json-viewer__mark")).toHaveCount(1);

    const styles = await page.evaluate(() => {
      const probe = document.createElement("div");
      document.body.append(probe);
      const resolve = (name: string) => {
        probe.style.backgroundColor = name;
        return getComputedStyle(probe).backgroundColor;
      };
      const mark = getComputedStyle(
        document.querySelector(".bx--json-viewer__mark") as Element,
      );
      const current = getComputedStyle(
        document.querySelector(".bx--json-viewer__row--current") as Element,
      );
      const result = {
        markBackground: mark.backgroundColor,
        markColor: mark.color,
        expectedMark: resolve("Mark"),
        expectedMarkText: (() => {
          probe.style.backgroundColor = "MarkText";
          return getComputedStyle(probe).backgroundColor;
        })(),
        activeOutline: `${current.outlineStyle} ${current.outlineWidth}`,
      };
      probe.remove();
      return result;
    });

    expect(styles.markBackground).toBe(styles.expectedMark);
    expect(styles.markColor).toBe(styles.expectedMarkText);
    expect(styles.activeOutline).not.toMatch(/^none/);
  });
});
