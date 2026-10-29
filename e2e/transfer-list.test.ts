import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const available = (page: Page) =>
  page.getByRole("listbox", { name: "Available" });
const selected = (page: Page) =>
  page.getByRole("listbox", { name: "Selected" });
const optionTexts = (listbox: ReturnType<typeof available>) =>
  listbox.getByRole("option").allTextContents();

test.describe("TransferList", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/transfer-list.html");
    await expect(available(page)).toBeVisible();

    const idle = await new AxeBuilder({ page }).include("#app").analyze();
    expect(idle.violations).toEqual([]);

    await available(page).getByText("Manage API keys").click();
    await page.getByRole("button", { name: "Add selected items" }).click();
    await available(page).focus();
    await page.keyboard.press("ArrowDown");
    const moved = await new AxeBuilder({ page }).include("#app").analyze();
    expect(moved.violations).toEqual([]);
  });

  test("moves, reorders and submits with the keyboard alone", async ({
    page,
  }) => {
    await page.goto("/transfer-list.html");

    // Tab: available search, available list, the move toolbar, the selected
    // search, the selected list.
    await page
      .getByRole("searchbox", { name: "Search available items" })
      .focus();
    await page.keyboard.press("Tab");
    await expect(available(page)).toBeFocused();

    // Mark "Billing administrator", "Deploy to production" and add them.
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Space");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("selected")).toHaveText(
      "audit,alerts,billing,deploy",
    );

    // Into the toolbar, the all button after the first, then back out.
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "Add selected items" }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Add all items" }),
    ).toBeFocused();

    // Selected list: mark the last row and raise it twice with Alt+Up.
    await selected(page).focus();
    await page.keyboard.press("End");
    await page.keyboard.press("Space");
    await page.keyboard.press("Alt+ArrowUp");
    await page.keyboard.press("Alt+ArrowUp");
    await expect(page.getByTestId("selected")).toHaveText(
      "audit,deploy,alerts,billing",
    );

    await page.getByRole("button", { name: "Save" }).press("Enter");
    await expect(page.getByTestId("form-data")).toHaveText(
      '["audit","deploy","alerts","billing"]',
    );
  });

  test("keeps the cursor on the next row after a move", async ({ page }) => {
    await page.goto("/transfer-list.html");

    // "Billing administrator", "Deploy to production", "Manage API keys".
    await available(page).focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("selected")).toHaveText("audit,alerts,keys");

    const cursor = available(page).locator(
      ".bx--list-box__menu-item--highlighted",
    );
    await expect(cursor).toHaveText("Invite members");
    const id = await cursor.getAttribute("id");
    await expect(available(page)).toHaveAttribute(
      "aria-activedescendant",
      id ?? "",
    );

    await page.keyboard.press("ArrowDown");
    await expect(cursor).toHaveText("Restore backups");
  });

  test("keeps a button's focus in the list when the last item moves", async ({
    page,
  }) => {
    await page.goto("/transfer-list.html");

    await page.getByRole("button", { name: "Remove all items" }).focus();
    await page.keyboard.press("Enter");

    await expect(page.getByTestId("selected")).toHaveText("");
    await expect(available(page)).toBeFocused();
  });

  test("stacks the lists on a narrow screen", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/transfer-list.html");

    const [first, second] = await Promise.all([
      available(page).boundingBox(),
      selected(page).boundingBox(),
    ]);
    expect(second?.y).toBeGreaterThan((first?.y ?? 0) + (first?.height ?? 0));
    expect(Math.round(second?.x ?? 0)).toBe(Math.round(first?.x ?? 1));
  });

  test("mirrors the layout and the arrows under dir=rtl", async ({ page }) => {
    await page.goto("/transfer-list.html");
    const ltr = await available(page).boundingBox();
    const ltrSelected = await selected(page).boundingBox();
    const transform = () =>
      page
        .getByRole("button", { name: "Add selected items" })
        .locator("svg")
        .evaluate((svg) => getComputedStyle(svg).transform);
    expect(await transform()).toBe("none");

    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const rtl = await available(page).boundingBox();
    const selectedBox = await selected(page).boundingBox();

    expect(rtl?.x).toBeGreaterThan(selectedBox?.x ?? 0);
    expect(ltr?.x).toBeLessThan(ltrSelected?.x ?? 0);
    expect(await transform()).toBe("matrix(-1, 0, 0, 1, 0, 0)");
    await page.evaluate(() => document.documentElement.removeAttribute("dir"));
  });

  test("keeps marked rows visible in forced colors", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "WebKit does not force colors");
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/transfer-list.html");

    await available(page).getByText("Manage API keys").click();
    await available(page).getByText("Invite members").click();
    // Focus leaves the cursor on a marked row; move it to an unmarked one.
    await page.keyboard.press("ArrowDown");

    const readColors = () =>
      page.evaluate(() => {
        const probe = document.createElement("div");
        document.body.append(probe);
        probe.style.backgroundColor = "Highlight";
        const highlight = getComputedStyle(probe).backgroundColor;
        probe.remove();
        const read = (text: string) => {
          const row = [...document.querySelectorAll('[role="option"]')].find(
            (option) => option.textContent?.includes(text),
          );
          if (!row) throw new Error(text);
          const style = getComputedStyle(row);
          return {
            background: style.backgroundColor,
            outline: style.outlineStyle,
          };
        };
        return {
          highlight,
          marked: read("Manage API keys"),
          cursor: read("Restore backups"),
          plain: read("Raise usage quota"),
        };
      });
    // A row's fill eases in, so read once it has settled.
    await expect
      .poll(async () => {
        const { marked, highlight } = await readColors();
        return marked.background === highlight;
      })
      .toBe(true);
    const colors = await readColors();

    expect(colors.marked.background).toBe(colors.highlight);
    expect(colors.plain.background).not.toBe(colors.highlight);
    // The cursor on an unmarked row is a ring, not a fill.
    expect(colors.cursor.background).not.toBe(colors.highlight);
    expect(colors.cursor.outline).toBe("solid");
  });

  test("dims every row when disabled", async ({ page }) => {
    await page.goto("/transfer-list-states.html");
    const color = (group: string, text: string) =>
      page
        .getByRole("group", { name: group })
        .locator(".bx--list-box__menu-item__option", { hasText: text })
        .evaluate((option) => getComputedStyle(option).color);

    const disabledItem = await color("Default", "Configure single sign-on");
    expect(await color("Disabled", "Billing administrator")).toBe(disabledItem);
    expect(await color("Disabled", "Audit log viewer")).toBe(disabledItem);
    expect(await color("Default", "Billing administrator")).not.toBe(
      disabledItem,
    );
  });

  test("stays quick with 2,000 items", async ({ page }) => {
    await page.goto("/transfer-list-large.html");
    await expect(available(page)).toBeVisible();

    // Only a window of the rows is in the page.
    expect(await available(page).getByRole("option").count()).toBeLessThan(30);
    await expect(available(page).getByRole("option").first()).toHaveAttribute(
      "aria-setsize",
      "2000",
    );

    const time = (action: () => Promise<void>) =>
      page
        .evaluate(() => performance.now())
        .then(async (start) => {
          await action();
          await page.evaluate(
            () =>
              new Promise((resolve) =>
                requestAnimationFrame(() => resolve(null)),
              ),
          );
          return (await page.evaluate(() => performance.now())) - start;
        });

    const filtered = await time(() =>
      page
        .getByRole("searchbox", { name: "Search available items" })
        .fill("Service 19"),
    );
    expect(await available(page).getByRole("option").count()).toBeGreaterThan(
      5,
    );

    const all = await time(() =>
      page.getByRole("button", { name: "Add all items" }).click(),
    );
    await expect(page.getByTestId("count")).toHaveText("100");

    await page
      .getByRole("searchbox", { name: "Search available items" })
      .fill("");
    const everything = await time(() =>
      page.getByRole("button", { name: "Add all items" }).click(),
    );
    await expect(page.getByTestId("count")).toHaveText("2000");

    const removed = await time(() =>
      page.getByRole("button", { name: "Remove all items" }).click(),
    );
    console.log(
      `TransferList 2000 items: filter ${filtered.toFixed(0)} ms, add 100 ${all.toFixed(0)} ms, add rest ${everything.toFixed(0)} ms, remove all ${removed.toFixed(0)} ms`,
    );
    expect(Math.max(filtered, all, everything, removed)).toBeLessThan(1000);
    await expect(page.getByTestId("count")).toHaveText("0");
  });

  test("drags a row from one list to the other", async ({ page }) => {
    await page.goto("/transfer-list.html");

    const row = available(page).getByText("Manage API keys");
    const target = selected(page);
    const from = await row.boundingBox();
    const to = await target.boundingBox();
    if (!(from && to)) throw new Error("lists are not laid out");

    await page.mouse.move(from.x + 20, from.y + 10);
    await page.mouse.down();
    await page.mouse.move(to.x + 40, to.y + 30, { steps: 8 });
    await page.mouse.up();

    await expect(page.getByTestId("selected")).toContainText("keys");
    expect((await optionTexts(selected(page))).map((t) => t.trim())).toContain(
      "Manage API keys",
    );
  });
});
