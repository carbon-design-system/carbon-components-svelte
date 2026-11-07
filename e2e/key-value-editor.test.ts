import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { getAXTree } from "./helpers/ax-tree";
import { expect, test } from "./helpers/host";

const open = (page: Page) => page.goto("/key-value-editor.html");

const editor = (page: Page, label = "Environment variables") =>
  page.getByRole("group", { name: label, exact: true });

const row = (page: Page, name: string, label?: string) =>
  editor(page, label).getByRole("group", { name, exact: true });

const axe = (page: Page) =>
  new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();

test.describe("KeyValueEditor", () => {
  test("posts every row, and nothing for a stored secret's value or the empty line", async ({
    page,
  }) => {
    await open(page);
    await page.getByRole("button", { name: "Save" }).click();
    const submitted = JSON.parse(
      (await page.getByTestId("submitted").textContent()) || "null",
    );

    expect(submitted.env).toEqual([
      expect.objectContaining({
        key: "NODE_ENV",
        value: "production",
        scope: "prod",
      }),
      expect.objectContaining({
        key: "DATABASE_URL",
        value: "postgres://db.internal/app",
        secret: true,
      }),
      {
        key: "API_TOKEN",
        value: "",
        secret: true,
        stored: true,
        scope: "",
        description: "",
      },
      expect.objectContaining({
        key: "DEBUG",
        value: "1",
        enabled: false,
        scope: "preview",
      }),
    ]);
    // The row under the last header is the empty line, so two rows post.
    expect(submitted.headers.map((r: { key: string }) => r.key)).toEqual([
      "Accept",
      "Authorization",
    ]);
    expect(submitted.labels).toHaveLength(2);
  });

  test("never has a stored secret's value in the page", async ({ page }) => {
    await open(page);
    expect(await page.content()).not.toContain('API_TOKEN" value');
    await expect(
      row(page, "Row 3 of 4").getByRole("img", { name: "Stored" }),
    ).toBeVisible();
    await expect(
      row(page, "Row 3 of 4").locator('[data-kv-field="value"]'),
    ).toHaveCount(0);
  });

  test("is operable with the keyboard alone", async ({ page }) => {
    await open(page);
    const first = row(page, "Row 1 of 4");
    await first.getByLabel("Key").focus();

    // Key, value, then (Secret, Applies to and Description come after) the
    // row's buttons are one tab stop.
    await page.keyboard.press("Tab");
    await expect(first.getByLabel("Value")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(first.getByRole("checkbox", { name: "Secret" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(first.getByRole("combobox")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(first.getByLabel("Description")).toBeFocused();
    await page.keyboard.press("Tab");
    const actions = first.getByRole("toolbar");
    await expect(actions.getByRole("button").nth(1)).toBeFocused();
    await page.keyboard.press("Tab");
    // Past the toolbar is the next row's first field, not its buttons.
    await expect(
      row(page, "Row 2 of 4").getByRole("checkbox", { name: "Enabled" }),
    ).toBeFocused();

    // Move the first row down with the key chord, from a field.
    await first.getByLabel("Key").focus();
    await page.keyboard.press("Alt+Shift+ArrowDown");
    await expect(row(page, "Row 2 of 4").getByLabel("Key")).toHaveValue(
      "NODE_ENV",
    );
    await expect(row(page, "Row 2 of 4").getByLabel("Key")).toBeFocused();
    await expect(editor(page).getByRole("status")).toHaveText(
      "Moved to position 2 of 4.",
    );

    // Remove it from its toolbar: focus lands on the next row's key.
    await row(page, "Row 2 of 4")
      .getByRole("button", { name: "Remove row 2" })
      .focus();
    await page.keyboard.press("Enter");
    await expect(row(page, "Row 2 of 3").getByLabel("Key")).toBeFocused();
    await expect(row(page, "Row 2 of 3").getByLabel("Key")).toHaveValue(
      "API_TOKEN",
    );
  });

  test("turns a typed line into a row and keeps the caret", async ({
    page,
  }) => {
    await open(page);
    const headers = "Request headers";
    await editor(page, headers)
      .getByRole("group", { name: "Add row", exact: true })
      .getByLabel("Key")
      .click();
    await page.keyboard.type("X-Trace");
    const added = row(page, "Row 3 of 3", headers).getByLabel("Key");
    await expect(added).toHaveValue("X-Trace");
    await expect(added).toBeFocused();
    // A new empty line follows.
    await expect(
      editor(page, headers).getByRole("group", {
        name: "Add row",
        exact: true,
      }),
    ).toHaveCount(1);
  });

  test("imports a pasted block after a confirmation, with the keyboard", async ({
    page,
  }) => {
    await open(page);
    await row(page, "Row 1 of 4").getByLabel("Key").focus();
    await page.evaluate(() => {
      const field = document.activeElement;
      const data = new DataTransfer();
      data.setData(
        "text/plain",
        "NEW_ONE=1\nexport NEW_TWO='two words'\nNODE_ENV=staging",
      );
      field?.dispatchEvent(
        new ClipboardEvent("paste", {
          clipboardData: data,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    const prompt = page.getByRole("group", { name: /^Import 2 new rows/ });
    await expect(prompt).toBeVisible();
    await expect(page.getByRole("button", { name: "Import" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(row(page, "Row 6 of 6").getByLabel("Key")).toHaveValue(
      "NEW_TWO",
    );
    await expect(row(page, "Row 1 of 6").getByLabel("Value")).toHaveValue(
      "staging",
    );
    await expect(row(page, "Row 5 of 6").getByLabel("Key")).toBeFocused();
  });

  test("switches to text and back with the parse errors shown", async ({
    page,
  }) => {
    await open(page);
    await editor(page).getByRole("button", { name: "Edit as text" }).click();
    const area = editor(page).getByRole("textbox", { name: "Rows as text" });
    await expect(area).toHaveValue(/NODE_ENV=production/);
    await area.press("Control+End");
    await page.keyboard.type("\nnot a pair");
    await expect(
      editor(page).getByRole("button", { name: /^Line 4: Add an equals sign/ }),
    ).toBeVisible();
    await editor(page).getByRole("button", { name: "Edit as rows" }).click();
    await expect(area).toBeVisible();
    await area.press("Control+z");
    await area.fill("NODE_ENV=production");
    await editor(page).getByRole("button", { name: "Edit as rows" }).click();
    await expect(row(page, "Row 1 of 2").getByLabel("Key")).toHaveValue(
      "NODE_ENV",
    );
  });

  test("shows messages after a row is left and a summary after a submit", async ({
    page,
  }) => {
    await open(page);
    const key = row(page, "Row 1 of 4").getByLabel("Key");
    await key.fill("bad key");
    await expect(key).not.toHaveAttribute("aria-invalid", "true");
    await page.getByRole("button", { name: "Save" }).click();

    const summary = page.getByRole("group", { name: "1 row needs attention" });
    await expect(summary).toBeFocused();
    await expect(key).toHaveAttribute("aria-invalid", "true");
    await summary.getByRole("button").click();
    await expect(key).toBeFocused();
    // The native submit did not go through.
    await expect(page.getByTestId("submitted")).toHaveText("");
  });

  test("names things for assistive tech", async ({ page }) => {
    await open(page);
    const tree = await getAXTree(page);
    expect(await tree.query("group", "Environment variables")).toHaveLength(1);
    expect(await tree.query("group", "Row 1 of 4")).toHaveLength(1);
    // One per editor on the page.
    expect(await tree.query("toolbar", "Actions for row 1")).toHaveLength(3);
    const [key] = await tree.query("textbox", "Key");
    expect(key).toBeDefined();
    await tree.dispose();
  });

  for (const [name, setup] of [
    ["White", async () => {}],
    [
      "Gray 100",
      async (page: Page) => {
        await page.evaluate(() =>
          document.documentElement.classList.add("bx--g100"),
        );
      },
    ],
    [
      "RTL",
      async (page: Page) => {
        await page.evaluate(() =>
          document.documentElement.setAttribute("dir", "rtl"),
        );
      },
    ],
  ] as const) {
    test(`has no axe violations on ${name}, valid and with errors`, async ({
      page,
    }) => {
      await open(page);
      await setup(page);
      expect((await axe(page)).violations).toEqual([]);

      await row(page, "Row 1 of 4").getByLabel("Key").fill("bad key");
      await page.getByRole("button", { name: "Save" }).click();
      await expect(
        page.getByRole("group", { name: /needs attention/ }),
      ).toBeVisible();
      expect((await axe(page)).violations).toEqual([]);
    });
  }

  test("has no axe violations while the text editor shows parse errors", async ({
    page,
  }) => {
    await open(page);
    await editor(page).getByRole("button", { name: "Edit as text" }).click();
    await editor(page)
      .getByRole("textbox", { name: "Rows as text" })
      .fill("oops");
    expect((await axe(page)).violations).toEqual([]);
  });

  test("reads keys left to right and values by their own text in RTL", async ({
    page,
  }) => {
    await open(page);
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const first = row(page, "Row 1 of 4");
    await expect(first.getByLabel("Key")).toHaveAttribute("dir", "ltr");
    await expect(first.getByLabel("Description")).toHaveAttribute(
      "dir",
      "auto",
    );
    // The columns mirror: the key sits at the right edge.
    const keyBox = await first.getByLabel("Key").boundingBox();
    const valueBox = await first.getByLabel("Value").boundingBox();
    expect(keyBox && valueBox && keyBox.x > valueBox.x).toBe(true);
  });

  test("keeps its borders and states in forced colors", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await open(page);
    await row(page, "Row 1 of 4").getByLabel("Key").fill("bad key");
    await page.getByRole("button", { name: "Save" }).click();
    const summary = page.getByRole("group", { name: /needs attention/ });
    await expect(summary).toBeVisible();
    const border = await summary.evaluate((el) => {
      const style = getComputedStyle(el);
      return [style.borderTopWidth, style.borderTopColor];
    });
    expect(border[0]).not.toBe("0px");
    expect(border[1]).not.toBe("rgba(0, 0, 0, 0)");
    // A button that cannot act stays visible, in a system color.
    const up = row(page, "Row 1 of 4").getByRole("button", {
      name: "Move row 1 up",
    });
    await expect(up).toHaveAttribute("aria-disabled", "true");
    const color = await up.evaluate((el) => getComputedStyle(el).color);
    expect(color).not.toBe("rgba(0, 0, 0, 0)");
  });
});
