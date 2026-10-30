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

    // The count keeps its order: the digit before the word, as in LTR.
    const order = await page
      .locator(".bx--transfer-list__count")
      .first()
      .evaluate((count) => {
        const text = count.firstChild as Text;
        const range = document.createRange();
        const x = (index: number) => {
          range.setStart(text, index);
          range.setEnd(text, index + 1);
          return range.getBoundingClientRect().left;
        };
        return {
          text: text.data,
          digit: x(0),
          word: x(text.data.indexOf("i")),
        };
      });
    expect(order.text).toBe("10 items");
    expect(order.digit).toBeLessThan(order.word);
    // It stays at the inline end, away from the title.
    const title = await page
      .locator(".bx--transfer-list__title")
      .first()
      .boundingBox();
    const count = await page
      .locator(".bx--transfer-list__count")
      .first()
      .boundingBox();
    expect((count?.x ?? 0) + (count?.width ?? 0)).toBeLessThan(
      (title?.x ?? 0) - 100,
    );
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

  test("draws one edge per list and one line per divider in forced colors", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "WebKit does not force colors");
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/transfer-list-states.html");
    const group = page.getByRole("group", { name: "Default" });
    await expect(group).toBeVisible();

    const edges = await group
      .getByRole("listbox", { name: "Available" })
      .evaluate((menu) => {
        const probe = document.createElement("div");
        document.body.append(probe);
        probe.style.backgroundColor = "Canvas";
        const canvas = getComputedStyle(probe).backgroundColor;
        probe.remove();
        const [first, second] = [
          ...menu.querySelectorAll(".bx--list-box__menu-item__option"),
        ].map((option) => getComputedStyle(option));
        return {
          canvas,
          list: getComputedStyle(menu.parentElement as Element).borderTopStyle,
          menu: getComputedStyle(menu).outlineStyle,
          firstTop: first.borderTopColor,
          firstBottom: first.borderBottomColor,
          secondTop: second.borderTopColor,
        };
      });

    expect(edges.list).toBe("solid");
    expect(edges.menu).toBe("none");
    expect(edges.firstTop).toBe(edges.canvas);
    // One line between two rows: the lower row's top edge.
    expect(edges.firstBottom).toBe(edges.canvas);
    expect(edges.secondTop).not.toBe(edges.canvas);
  });

  test("draws one focus ring: on the cursor row, or on an empty list", async ({
    page,
  }) => {
    await page.goto("/transfer-list.html");
    const outline = (locator: ReturnType<typeof available>) =>
      locator.evaluate((el) => getComputedStyle(el).outlineStyle);

    await available(page).focus();
    await page.keyboard.press("ArrowDown");
    const cursor = available(page).locator(
      ".bx--list-box__menu-item--highlighted",
    );
    await expect(cursor).toHaveText("Deploy to production");
    expect(await outline(cursor)).toBe("solid");
    expect(await outline(available(page))).toBe("none");

    await page
      .getByRole("searchbox", { name: "Search available items" })
      .fill("zzz");
    await available(page).focus();
    expect(await outline(available(page))).toBe("solid");
  });

  test("puts the cursor on the row a drag lifts", async ({ page }) => {
    await page.goto("/transfer-list.html");
    const row = available(page).getByText("Manage API keys");
    const from = await row.boundingBox();
    if (!from) throw new Error("list is not laid out");

    await page.mouse.move(from.x + 20, from.y + 10);
    await page.mouse.down();
    await page.mouse.move(from.x + 20, from.y + 60, { steps: 4 });
    await expect(
      available(page).locator(".bx--list-box__menu-item--highlighted"),
    ).toHaveText("Manage API keys");
    await page.mouse.up();
  });

  test("sets a list's title and count on one baseline", async ({ page }) => {
    await page.goto("/transfer-list.html");
    await expect(available(page)).toBeVisible();
    const baselines = await page.evaluate(() => {
      // A zero-height inline block sits on its line's baseline.
      const baseline = (el: Element) => {
        const probe = document.createElement("span");
        probe.style.display = "inline-block";
        el.append(probe);
        const y = probe.getBoundingClientRect().bottom;
        probe.remove();
        return y;
      };
      return [...document.querySelectorAll(".bx--transfer-list__header")].map(
        (header) => [
          baseline(
            header.querySelector(".bx--transfer-list__title") as Element,
          ),
          baseline(
            header.querySelector(".bx--transfer-list__count") as Element,
          ),
        ],
      );
    });

    expect(baselines).toHaveLength(2);
    for (const [title, count] of baselines) {
      expect(Math.abs(title - count)).toBeLessThanOrEqual(0.5);
    }
  });

  test("shows helper text and errors under the legend, in one row", async ({
    page,
  }) => {
    await page.goto("/transfer-list-states.html");
    const layout = (name: string) =>
      page.getByRole("group", { name }).evaluate((group) => {
        const top = (selector: string) =>
          group.querySelector(selector)?.getBoundingClientRect().top ??
          Number.NaN;
        const legend = group.querySelector("legend")?.getBoundingClientRect();
        return {
          legend: legend?.bottom ?? Number.NaN,
          message: top(".bx--form__helper-text, .bx--form-requirement"),
          lists: top(".bx--transfer-list__header"),
        };
      });

    const helper = await layout("Default");
    const invalid = await layout("Invalid");
    for (const { legend, message, lists } of [helper, invalid]) {
      expect(message).toBeGreaterThan(legend);
      expect(message).toBeLessThan(lists);
    }
    // The error takes the helper text's row, so the lists start level.
    expect(
      Math.abs(invalid.lists - invalid.legend - (helper.lists - helper.legend)),
    ).toBeLessThanOrEqual(0.5);
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
