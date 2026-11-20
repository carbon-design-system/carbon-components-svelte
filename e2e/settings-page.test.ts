import AxeBuilder from "@axe-core/playwright";
import { test as plainTest } from "@playwright/test";
import { expect, test } from "./helpers/host";
import {
  expectNoNestedBorders,
  expectNoPageOverflow,
  expectTextFits,
} from "./helpers/layout";

const WIDTHS = [320, 672, 1056, 1584];

test.describe("settings page", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test("keyboard only: edit, save with Enter, focus returns to the field", async ({
    page,
  }) => {
    await page.goto("/settings-page.html");
    const name = page.getByRole("textbox", { name: "Display name" });
    await name.focus();
    await page.keyboard.press("Control+a");
    await page.keyboard.type("Priya N.");

    const save = page.getByRole("button", { name: /^Save/ });
    // The next stops after the field are its reset button's neighbours, then
    // the rest of the page, so reach Save by Tab from the bar's Discard.
    await page.getByRole("button", { name: "Discard" }).focus();
    await page.keyboard.press("Tab");
    await expect(save).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(page.getByTestId("saved-count")).toHaveText("1");
    await expect(name).toBeFocused();
    await expect(page.locator(".bx--settings-save-bar")).toHaveAttribute(
      "inert",
      /.*/,
    );
  });

  test("keyboard only: discard restores the value and returns focus", async ({
    page,
  }) => {
    await page.goto("/settings-page.html");
    const name = page.getByRole("textbox", { name: "Display name" });
    await name.focus();
    await page.keyboard.type("!");
    await page.getByRole("button", { name: "Discard" }).focus();
    await page.keyboard.press("Space");

    await expect(name).toHaveValue("Priya Natarajan");
    await expect(name).toBeFocused();
  });

  test("keyboard only: the shortcut saves from a field", async ({ page }) => {
    await page.goto("/settings-page.html");
    await page.getByRole("textbox", { name: "Display name" }).focus();
    await page.keyboard.type("!");
    // `mod` is Command where the page reads an Apple platform, else Control.
    const apple = await page.evaluate(() =>
      /Mac|iPhone|iPad|iPod/.test(
        (navigator as { userAgentData?: { platform?: string } }).userAgentData
          ?.platform ||
          navigator.platform ||
          navigator.userAgent,
      ),
    );
    await page.keyboard.press(apple ? "Meta+s" : "Control+s");
    await expect(page.getByTestId("saved-count")).toHaveText("1");
  });

  test("keyboard only: leaving asks, Keep editing keeps the page, Discard leaves", async ({
    page,
  }) => {
    await page.goto("/settings-page.html");
    await page.getByRole("textbox", { name: "Display name" }).focus();
    await page.keyboard.type("!");

    await page.getByTestId("leave").focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByTestId("left")).toHaveText("");
    await expect(page.getByTestId("dirty")).toHaveText("true");

    await page.getByTestId("leave").focus();
    await page.keyboard.press("Enter");
    await dialog.getByRole("button", { name: "Discard" }).click();
    await expect(page.getByTestId("left")).toHaveText("billing");
  });

  test("the save bar appearing moves nothing", async ({ page }) => {
    await page.goto("/settings-page.html");
    const measure = () =>
      page.evaluate(() => ({
        height: document.documentElement.scrollHeight,
        tops: [...document.querySelectorAll(".bx--settings-row")].map((row) =>
          Math.round(row.getBoundingClientRect().top),
        ),
      }));
    const before = await measure();
    await page.getByRole("textbox", { name: "Display name" }).fill("x");
    await expect(page.locator(".bx--settings-save-bar--visible")).toBeVisible();
    // The bar's transition ends in about 150 ms.
    await page.waitForTimeout(300);
    expect(await measure()).toEqual(before);
  });

  test("the bar sticks to the bottom and a focused field clears it", async ({
    page,
  }) => {
    await page.goto("/settings-page.html?fields=30");
    await page.getByRole("textbox", { name: "Display name" }).fill("x");
    await page.getByRole("textbox", { name: "Quota 28" }).focus();
    await page.waitForTimeout(200);

    const { bar, field } = await page.evaluate(() => ({
      bar: document
        .querySelector(".bx--settings-save-bar")
        ?.getBoundingClientRect(),
      field: document.activeElement?.getBoundingClientRect(),
    }));
    expect(bar?.bottom).toBeCloseTo(800, 0);
    expect(field?.bottom).toBeLessThanOrEqual(bar?.top ?? 0);
  });

  test("the section list moves focus to the heading and marks the section", async ({
    page,
  }) => {
    await page.goto("/settings-page.html");
    await page.getByRole("link", { name: "Security" }).click();
    await expect(page.getByRole("heading", { name: "Security" })).toBeFocused();
    await expect(page.getByRole("link", { name: "Security" })).toHaveAttribute(
      "aria-current",
      "location",
    );
  });

  test("the section menu replaces the list below the large breakpoint", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 672, height: 800 });
    await page.goto("/settings-page.html");
    await expect(
      page.getByRole("navigation", { name: "Settings sections" }),
    ).toBeHidden();

    await page.getByRole("combobox", { name: "Jump to section" }).click();
    await page.getByRole("option", { name: "Security" }).click();
    await expect(page.getByRole("heading", { name: "Security" })).toBeFocused();
  });

  test("search filters sections, rows and the list, and highlights the match", async ({
    page,
  }) => {
    await page.goto("/settings-page.html");
    await page
      .getByRole("searchbox", { name: "Search settings" })
      .fill("frequency");

    await expect(page.getByRole("heading", { name: "Profile" })).toBeHidden();
    await expect(page.locator('[data-settings-row="digest"] mark')).toHaveText(
      "Frequency".toLowerCase().replace(/^./, "f"),
    );
    await expect(page.getByRole("link", { name: "Profile" })).toBeHidden();
    await expect(
      page.getByRole("link", { name: "Notifications" }),
    ).toBeVisible();
    await expect(page.getByRole("status")).toContainText(
      "1 setting matches frequency",
    );

    await page.getByRole("searchbox", { name: "Search settings" }).fill("zzzz");
    await expect(page.getByTestId("no-results")).toBeVisible();
  });

  test("a rejected save maps errors to fields, the list and the sections", async ({
    page,
  }) => {
    await page.goto("/settings-page.html?save=field");
    await page.getByRole("textbox", { name: "Username" }).fill("taken");
    await page.getByRole("button", { name: /^Save/ }).click();

    const username = page.getByRole("textbox", { name: "Username" });
    await expect(username).toBeFocused();
    await expect(username).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("That username is taken.")).toBeVisible();
    await expect(page.getByRole("link", { name: /Profile/ })).toContainText(
      "1 error",
    );
    await expect(page.getByRole("link", { name: /Security/ })).toContainText(
      "1 error",
    );
    await expect(page.locator(".bx--settings-save-bar")).toContainText(
      "2 settings could not be saved",
    );

    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });

  test("a failed request keeps the edits and the bar", async ({ page }) => {
    await page.goto("/settings-page.html?save=network");
    await page.getByRole("textbox", { name: "Display name" }).fill("kept");
    await page.getByRole("button", { name: /^Save/ }).click();

    await expect(page.getByText("We couldn't reach the server.")).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Display name" }),
    ).toHaveValue("kept");
    await expect(page.locator(".bx--settings-save-bar--visible")).toBeVisible();
  });

  test("an optimistic save clears the bar before the server answers", async ({
    page,
  }) => {
    await page.goto("/settings-page.html?optimistic&save=network");
    await page.getByRole("textbox", { name: "Display name" }).fill("kept");
    await page.getByRole("button", { name: /^Save/ }).click();
    await expect(page.getByTestId("saved-name")).toHaveText("kept");
    // The request fails after 150 ms, so the baseline rolls back.
    await expect(page.getByTestId("saved-name")).toHaveText("Priya Natarajan");
    await expect(page.getByTestId("dirty")).toHaveText("true");
  });

  test("reset to default puts the default back and keeps focus in the row", async ({
    page,
  }) => {
    await page.goto("/settings-page.html");
    const row = page.locator('[data-settings-row="displayName"]');
    await row.getByRole("button", { name: "Reset to default" }).click();
    await expect(row.getByRole("textbox")).toHaveValue("");
    await expect(row.getByRole("textbox")).toBeFocused();
  });

  test("a policy-locked row is disabled and explains itself on focus", async ({
    page,
  }) => {
    await page.goto("/settings-page.html");
    const row = page.locator('[data-settings-row="securityAlerts"]');
    await expect(row.getByRole("switch")).toBeDisabled();
    const lock = row.getByRole("button", { name: "Locked" });
    await lock.focus();
    await expect(lock).toHaveAccessibleDescription(
      "Managed by your organization",
    );
  });

  test("the danger zone confirms by typing the workspace name", async ({
    page,
  }) => {
    await page.goto("/settings-page.html");
    await page.getByTestId("delete").click();
    const dialog = page.getByRole("alertdialog");
    const confirm = dialog.getByRole("button", { name: "Delete workspace" });
    await expect(confirm).toBeDisabled();
    await dialog.getByRole("textbox").fill("acme-prod");
    await expect(confirm).toBeEnabled();
    await confirm.click();
    await expect(page.getByTestId("deleted")).toHaveText("deleted");
  });

  test("exposes one h1, section headings, and landmarks only while dirty", async ({
    page,
  }) => {
    await page.goto("/settings-page.html");
    const headings = await page
      .getByRole("heading")
      .evaluateAll((nodes) =>
        nodes.map((node) => `${node.tagName} ${node.textContent?.trim()}`),
      );
    expect(headings).toEqual([
      "H1 Account settings",
      "H2 Profile",
      "H2 Notifications",
      "H2 Security",
      "H2 Advanced",
      "H2 Danger zone",
    ]);

    const snapshot = () => page.locator("body").ariaSnapshot();
    const clean = await snapshot();
    expect(clean).toContain('navigation "Settings sections"');
    expect(clean).not.toContain("Unsaved changes");

    await page.getByRole("textbox", { name: "Display name" }).fill("x");
    expect(await snapshot()).toContain('region "Unsaved changes"');
  });

  test("announces the first unsaved change and the saved result", async ({
    page,
  }) => {
    await page.goto("/settings-page.html");
    const status = page.getByRole("status").first();
    await page.getByRole("textbox", { name: "Display name" }).fill("x");
    await expect(page.locator('[role="status"][aria-live]').last()).toHaveText(
      "You have unsaved changes",
    );
    await page.getByRole("button", { name: /^Save/ }).click();
    await expect(page.locator('[role="status"][aria-live]').last()).toHaveText(
      "Settings saved",
    );
    void status;
  });

  test("has no axe violations clean, dirty and searched", async ({ page }) => {
    await page.goto("/settings-page.html");
    const scan = () => new AxeBuilder({ page }).include("#app").analyze();
    expect((await scan()).violations).toEqual([]);

    await page.getByRole("textbox", { name: "Display name" }).fill("x");
    await page.waitForTimeout(300);
    expect((await scan()).violations).toEqual([]);

    await page
      .getByRole("searchbox", { name: "Search settings" })
      .fill("alerts");
    expect((await scan()).violations).toEqual([]);
  });

  test("has no axe violations in Gray 100", async ({ page }) => {
    await page.goto("/settings-page.html");
    await page.evaluate(() =>
      document.documentElement.classList.add("bx--g100"),
    );
    await page.getByRole("textbox", { name: "Display name" }).fill("x");
    await page.waitForTimeout(300);
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });

  for (const width of WIDTHS) {
    test(`fits at ${width}px, clean and dirty`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/settings-page.html");
      await expectNoPageOverflow(page);
      await expectNoNestedBorders(page);
      await expectTextFits(page);

      await page.getByRole("textbox", { name: "Display name" }).fill("x");
      await page.waitForTimeout(300);
      await expectNoPageOverflow(page);
      await expectTextFits(page);
    });
  }

  test("a row sits beside its control from 36rem of section width, below it under", async ({
    page,
  }) => {
    const placement = async () =>
      page.evaluate(() => {
        const row = document.querySelector('[data-settings-row="displayName"]');
        const text = row
          ?.querySelector(".bx--settings-row__text")
          ?.getBoundingClientRect();
        const control = row
          ?.querySelector(".bx--settings-row__control")
          ?.getBoundingClientRect();
        return control && text && control.top >= text.bottom - 1
          ? "below"
          : "beside";
      });
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/settings-page.html");
    expect(await placement()).toBe("below");
    await page.setViewportSize({ width: 1056, height: 800 });
    expect(await placement()).toBe("beside");
  });

  test("a 40-field page types without a lag and fits at every width", async ({
    page,
  }) => {
    await page.goto("/settings-page.html?fields=40");
    expect(await page.locator(".bx--settings-row").count()).toBeGreaterThan(48);
    const name = page.getByRole("textbox", { name: "Display name" });
    await name.focus();
    const elapsed = await page.evaluate(async () => {
      const input = document.activeElement as HTMLInputElement;
      const start = performance.now();
      for (let index = 0; index < 100; index++) {
        input.value = `${input.value}a`;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        // biome-ignore lint/performance/noAwaitInLoops: keystrokes arrive one after another
        await new Promise((resolve) => setTimeout(resolve));
        // Reading a size makes the browser lay the page out.
        void document.body.offsetHeight;
      }
      return performance.now() - start;
    });
    // About 4 ms a keystroke, with the timer's own minimum, on a slow runner.
    expect(elapsed).toBeLessThan(2000);

    for (const width of WIDTHS) {
      // biome-ignore lint/performance/noAwaitInLoops: one width at a time
      await page.setViewportSize({ width, height: 800 });
      await expectNoPageOverflow(page);
      await expectTextFits(page);
    }
  });

  test("forced colors keep the bar's edge, the modified line and the dot visible", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/settings-page.html");
    await page.getByRole("textbox", { name: "Display name" }).fill("x");
    await page.waitForTimeout(300);
    const styles = await page.evaluate(() => {
      const read = (selector: string, pseudo?: string) =>
        getComputedStyle(document.querySelector(selector) as Element, pseudo);
      const bar = read(".bx--settings-save-bar");
      const line = read(".bx--settings-row--modified", "::before");
      const dot = read(".bx--settings-nav__dot");
      return {
        barEdge: `${bar.borderTopWidth} ${bar.borderTopStyle}`,
        lineColor: line.backgroundColor,
        dotWidth: dot.borderTopWidth,
        dotStyle: dot.borderTopStyle,
      };
    });
    expect(styles.barEdge).toBe("1px solid");
    expect(styles.dotStyle).toBe("solid");
    expect(Number.parseFloat(styles.dotWidth)).toBeGreaterThan(0);
    expect(styles.lineColor).not.toBe("rgba(0, 0, 0, 0)");
    await expectNoNestedBorders(page);
  });

  test("RTL puts the modified line on the inline start and the bar's buttons at the end", async ({
    page,
  }) => {
    await page.goto("/settings-page.html");
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    await page.getByRole("textbox", { name: "Display name" }).fill("x");
    await page.waitForTimeout(300);
    const geometry = await page.evaluate(() => {
      const row = document
        .querySelector(".bx--settings-row--modified")
        ?.getBoundingClientRect();
      const line = getComputedStyle(
        document.querySelector(".bx--settings-row--modified") as Element,
        "::before",
      );
      const message = document
        .querySelector(".bx--settings-save-bar__message")
        ?.getBoundingClientRect();
      const actions = document
        .querySelector(".bx--settings-save-bar__actions")
        ?.getBoundingClientRect();
      return {
        rowRight: row?.right,
        lineLeft: line.insetInlineStart,
        messageRight: message?.right,
        actionsRight: actions?.right,
      };
    });
    expect(geometry.lineLeft).toBe("0px");
    // The message starts at the right, the actions end at the left.
    expect(geometry.messageRight).toBeGreaterThan(geometry.actionsRight ?? 0);
    await expectNoPageOverflow(page);
  });
});

// A hash applies on a page load, which the shared host page skips.
plainTest(
  "a deep link moves focus to the section heading",
  async ({ page }) => {
    await page.goto("/settings-page.html#notifications");
    await expect(
      page.getByRole("heading", { name: "Notifications" }),
    ).toBeFocused();
  },
);

plainTest(
  "a hash change moves focus to the section heading",
  async ({ page }) => {
    await page.goto("/settings-page.html");
    await page.evaluate(() => {
      window.location.hash = "#security";
    });
    await expect(page.getByRole("heading", { name: "Security" })).toBeFocused();
  },
);
